// EL test crítico (ARCHITECTURE_V2.md §11.8): tipear en el campo A NO re-renderiza al campo B.
// Cubre DOS niveles: el hook useField aislado Y el controlador <Field> real (que es lo que se
// renderiza en producción). La revisión detectó que probar solo el hook daba falso positivo:
// el <Field> tenía una suscripción extra (getFormValues) que lo re-renderizaba ante cualquier cambio.

import { describe, it, expect } from "vitest";
import { render, act } from "@testing-library/react";
import React, { Profiler } from "react";

import { FormProvider, useFormStore } from "../../src/context/FormStoreContext";
import { useField } from "../../src/hooks/useField";
import { Field } from "../../src/components/form/Field";
import type { JsfObjectSchema } from "@laus/json-schema-form";

const schema: JsfObjectSchema = {
  type: "object",
  properties: {
    a: { type: "string", "x-jsf-presentation": { inputType: "text" } },
    b: { type: "string", "x-jsf-presentation": { inputType: "text" } },
  },
} as JsfObjectSchema;

// Captura la acción setValue del store para disparar cambios desde fuera del árbol observado.
function makeCapture(assign: (fn: (name: string, value: unknown) => void) => void) {
  return function Capture() {
    assign(useFormStore((s) => s.setValue));
    return null;
  };
}

describe("aislamiento de re-render (§11.8)", () => {
  // Nivel 1: el hook. Garantiza que el selector + shallow de useField no propaga cambios cruzados.
  it("nivel hook: useField('a') re-renderiza solo cuando cambia 'a'", () => {
    const counterA = { count: 0 };
    const counterB = { count: 0 };
    let setValue!: (name: string, value: unknown) => void;
    const Capture = makeCapture((fn) => (setValue = fn));

    function Consumer({ name, counter }: { name: string; counter: { count: number } }) {
      counter.count += 1;
      const { value } = useField(name);
      return <span data-testid={name}>{value}</span>;
    }

    render(
      <FormProvider schema={schema}>
        <Capture />
        <Consumer name="a" counter={counterA} />
        <Consumer name="b" counter={counterB} />
      </FormProvider>,
    );

    const aBefore = counterA.count;
    const bBefore = counterB.count;
    act(() => setValue("a", "nuevo valor de a"));

    expect(counterA.count).toBeGreaterThan(aBefore);
    expect(counterB.count).toBe(bBefore);
  });

  // Nivel 2 (AUTORITATIVO): el controlador <Field> REAL, tal cual se usa en producción.
  // Antes era un falso positivo (el test solo renderizaba useField). Con getFormValues estable
  // y los adaptadores memoizados, <Field name="b"> NO debe commitear cuando cambia 'a'.
  it("nivel controlador: <Field> de B NO re-renderiza al tipear en A", () => {
    const commits: Record<string, number> = { a: 0, b: 0 };
    let setValue!: (name: string, value: unknown) => void;
    const Capture = makeCapture((fn) => (setValue = fn));

    render(
      <FormProvider schema={schema}>
        <Capture />
        <Profiler id="a" onRender={() => (commits.a += 1)}>
          <Field name="a" />
        </Profiler>
        <Profiler id="b" onRender={() => (commits.b += 1)}>
          <Field name="b" />
        </Profiler>
      </FormProvider>,
    );

    const aBefore = commits.a;
    const bBefore = commits.b;
    act(() => setValue("a", "hola"));

    // A commitea (su slice cambió); B NO (su slice no cambió y no hay suscripciones de más).
    expect(commits.a).toBeGreaterThan(aBefore);
    expect(commits.b).toBe(bBefore);
  });
});
