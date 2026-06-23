// EL test crítico (ARCHITECTURE_V2.md §11.8): tipear en el campo A NO re-renderiza al campo B.
// Prueba que la suscripción granular (selector + shallow en useField) mata los re-renders cruzados.

import { describe, it, expect } from "vitest";
import { render, act } from "@testing-library/react";
import React from "react";

import { FormProvider, useFormStore } from "../../src/context/FormStoreContext";
import { useField } from "../../src/hooks/useField";
import type { JsfObjectSchema } from "@laus/json-schema-form";
const schema: JsfObjectSchema = {
  type: "object",
  properties: {
    a: { type: "string", "x-jsf-presentation": { inputType: "text" } },
    b: { type: "string", "x-jsf-presentation": { inputType: "text" } },
  },
} as JsfObjectSchema;

// Consumidor mínimo: se suscribe a UN campo y registra cada render en un contador externo.
function Consumer({ name, counter }: { name: string; counter: { count: number } }) {
  counter.count += 1;
  const { value } = useField(name);
  return <span data-testid={name}>{value}</span>;
}

describe("aislamiento de re-render (§11.8)", () => {
  it("tipear en A re-renderiza A pero NO re-renderiza B", () => {
    const counterA = { count: 0 };
    const counterB = { count: 0 };
    let setValue!: (name: string, value: unknown) => void;

    function Capture() {
      setValue = useFormStore((s) => s.setValue);
      return null;
    }

    render(
      <FormProvider schema={schema}>
        <Capture />
        <Consumer name="a" counter={counterA} />
        <Consumer name="b" counter={counterB} />
      </FormProvider>,
    );

    const rendersBBefore = counterB.count;
    const rendersABefore = counterA.count;

    act(() => setValue("a", "nuevo valor de a"));

    // A debe haber re-renderizado (su slice cambió).
    expect(counterA.count).toBeGreaterThan(rendersABefore);
    // B NO debe haber re-renderizado: su selector devuelve la misma tupla (shallow). ESTE es el corazón del fix.
    expect(counterB.count).toBe(rendersBBefore);
  });
});
