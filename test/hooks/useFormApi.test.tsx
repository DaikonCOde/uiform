// Tests de useFormApi (ARCHITECTURE_V2.md §5): isSubmitting flip durante submit, isValid refleja errors, acciones funcionan.

import { describe, it, expect, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import React from "react";

import { FormProvider } from "../../src/context/FormStoreContext";
import { useFormApi } from "../../src/hooks/useFormApi";
import { useField } from "../../src/hooks/useField";
import type { JsfObjectSchema } from "@laus/json-schema-form";

const schema: JsfObjectSchema = {
  type: "object",
  properties: {
    name: { type: "string", "x-jsf-presentation": { inputType: "text" } },
  },
  required: ["name"],
} as JsfObjectSchema;

function makeWrapper(onSubmit?: (...a: unknown[]) => unknown) {
  return function wrapper({ children }: { children: React.ReactNode }) {
    return (
      <FormProvider schema={schema} onSubmit={onSubmit}>
        {children}
      </FormProvider>
    );
  };
}

describe("useFormApi", () => {
  it("isValid arranca true y pasa a false cuando validate puebla errores", () => {
    const { result } = renderHook(() => useFormApi(), { wrapper: makeWrapper() });
    expect(result.current.isValid).toBe(true);

    act(() => {
      result.current.validate(); // name requerido vacío → error
    });
    expect(result.current.isValid).toBe(false);
  });

  it("submit NO llama onSubmit con form inválido y sí cuando es válido", async () => {
    const onSubmit = vi.fn();
    const wrapper = makeWrapper(onSubmit);
    const { result } = renderHook(
      () => {
        const api = useFormApi();
        const field = useField("name");
        return { api, field };
      },
      { wrapper },
    );

    // Inválido: no envía.
    await act(async () => {
      await result.current.api.submit();
    });
    expect(onSubmit).not.toHaveBeenCalled();

    // Completamos el requerido y reintentamos.
    act(() => result.current.field.onChange("Laus"));
    await act(async () => {
      await result.current.api.submit();
    });
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("isSubmitting hace flip durante un submit asíncrono", async () => {
    let resolveSubmit!: () => void;
    const onSubmit = vi.fn(
      () => new Promise<void>((res) => (resolveSubmit = res)),
    );
    const wrapper = makeWrapper(onSubmit);

    const { result } = renderHook(
      () => {
        const api = useFormApi();
        const field = useField("name");
        return { api, field };
      },
      { wrapper },
    );

    act(() => result.current.field.onChange("Laus")); // válido para que llegue a onSubmit

    let submitPromise!: Promise<void>;
    act(() => {
      submitPromise = result.current.api.submit();
    });

    // Mientras la promesa de onSubmit no resuelve, isSubmitting debe ser true.
    await waitFor(() => expect(result.current.api.isSubmitting).toBe(true));

    await act(async () => {
      resolveSubmit();
      await submitPromise;
    });
    expect(result.current.api.isSubmitting).toBe(false);
  });

  it("reset restaura los valores por defecto", () => {
    const { result } = renderHook(
      () => {
        const api = useFormApi();
        const field = useField("name");
        return { api, field };
      },
      { wrapper: makeWrapper() },
    );

    act(() => result.current.field.onChange("temporal"));
    expect(result.current.field.value).toBe("temporal");

    act(() => result.current.api.reset());
    expect(result.current.field.value).toBe("");
  });
});
