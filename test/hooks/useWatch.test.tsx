// Tests de useWatch (ARCHITECTURE_V2.md §5): devuelve el valor observado y re-renderiza SOLO si cambia.

import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import React, { useRef } from "react";

import { FormProvider, useFormStore } from "../../src/context/FormStoreContext";
import { useWatch } from "../../src/hooks/useWatch";
import type { JsfObjectSchema } from "@laus/json-schema-form";

const schema: JsfObjectSchema = {
  type: "object",
  properties: {
    a: { type: "string", "x-jsf-presentation": { inputType: "text" } },
    b: { type: "string", "x-jsf-presentation": { inputType: "text" } },
  },
} as JsfObjectSchema;

function wrapper({ children }: { children: React.ReactNode }) {
  return <FormProvider schema={schema}>{children}</FormProvider>;
}

describe("useWatch", () => {
  it("devuelve el valor observado y se actualiza al cambiar", () => {
    const { result } = renderHook(
      () => {
        const value = useWatch("a");
        const setValue = useFormStore((s) => s.setValue);
        return { value, setValue };
      },
      { wrapper },
    );

    expect(result.current.value).toBe("");
    act(() => result.current.setValue("a", "hola"));
    expect(result.current.value).toBe("hola");
  });

  it("array overload devuelve la tupla de valores observados", () => {
    const { result } = renderHook(
      () => {
        const values = useWatch(["a", "b"]);
        const setValue = useFormStore((s) => s.setValue);
        return { values, setValue };
      },
      { wrapper },
    );

    expect(result.current.values).toEqual(["", ""]);
    act(() => result.current.setValue("b", "x"));
    expect(result.current.values).toEqual(["", "x"]);
  });

  it("NO re-renderiza cuando cambia un campo NO observado", () => {
    const { result } = renderHook(
      () => {
        const renderCount = useRef(0);
        renderCount.current += 1;
        const value = useWatch("a"); // observamos solo 'a'
        const setValue = useFormStore((s) => s.setValue);
        return { value, setValue, renders: renderCount.current };
      },
      { wrapper },
    );

    const before = result.current.renders;
    // Cambiar 'b' (no observado) no debe re-renderizar este hook.
    act(() => result.current.setValue("b", "cambio en b"));
    expect(result.current.renders).toBe(before);

    // Cambiar 'a' (observado) sí re-renderiza.
    act(() => result.current.setValue("a", "cambio en a"));
    expect(result.current.renders).toBeGreaterThan(before);
  });
});
