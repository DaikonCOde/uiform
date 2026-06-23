/* eslint-disable @typescript-eslint/no-explicit-any */
// Tests de useAsyncOptions (ARCHITECTURE_V2.md §8): carga al montar, estados loading/error, reload y recarga al cambiar deps.

import { describe, it, expect, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import React from "react";

import { FormProvider, useFormStore } from "../../src/context/FormStoreContext";
import { useAsyncOptions } from "../../src/hooks/useAsyncOptions";
import type { JsfObjectSchema } from "@laus/json-schema-form";

// Schema con un select async (deps: region) + el campo region del que depende.
const schema: JsfObjectSchema = {
  type: "object",
  properties: {
    region: { type: "string", "x-jsf-presentation": { inputType: "text" } },
    city: {
      type: "string",
      "x-jsf-presentation": {
        inputType: "select",
        asyncOptions: { id: "myLoader", dependencies: ["region"] },
      },
    },
  },
} as JsfObjectSchema;

function makeWrapper(loader: any) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <FormProvider schema={schema} asyncLoaders={{ myLoader: loader }}>
        {children}
      </FormProvider>
    );
  };
}

describe("useAsyncOptions", () => {
  it("carga las opciones al montar (poblándolas desde el store)", async () => {
    const loader = vi.fn(async () => ({ options: [{ label: "A", value: "a" }] }));
    const { result } = renderHook(
      () => useAsyncOptions("myLoader", ["region"]),
      { wrapper: makeWrapper(loader) },
    );

    await waitFor(() => expect(loader).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(result.current.options).toEqual([{ label: "A", value: "a" }]),
    );
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("refleja el estado de error cuando el loader falla", async () => {
    const loader = vi.fn(async () => {
      throw new Error("boom");
    });
    const { result } = renderHook(
      () => useAsyncOptions("myLoader", ["region"]),
      { wrapper: makeWrapper(loader) },
    );

    await waitFor(() => expect(result.current.error).toContain("boom"));
    expect(result.current.options).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it("reload() vuelve a invocar el loader", async () => {
    const loader = vi.fn(async () => ({ options: [] }));
    const { result } = renderHook(
      () => useAsyncOptions("myLoader", ["region"]),
      { wrapper: makeWrapper(loader) },
    );

    await waitFor(() => expect(loader).toHaveBeenCalledTimes(1));
    act(() => result.current.reload("buscar"));
    await waitFor(() => expect(loader).toHaveBeenCalledTimes(2));
    // El término de búsqueda llega al loader.
    expect(loader.mock.calls[1][0]).toMatchObject({ search: "buscar" });
  });

  it("recarga cuando cambia el valor de una dependencia", async () => {
    const loader = vi.fn(async () => ({ options: [] }));
    const { result } = renderHook(
      () => {
        const setValue = useFormStore((s) => s.setValue);
        const async = useAsyncOptions("myLoader", ["region"]);
        return { setValue, async };
      },
      { wrapper: makeWrapper(loader) },
    );

    await waitFor(() => expect(loader).toHaveBeenCalledTimes(1));
    // Cambiar la dependencia 'region' debe disparar una recarga.
    act(() => result.current.setValue("region", "norte"));
    await waitFor(() => expect(loader).toHaveBeenCalledTimes(2));
  });

  it("advierte (dev) una sola vez cuando el loaderId no matchea ningún loader", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    // id inexistente: no está en asyncLoaders → el store retorna temprano y el slice queda undefined.
    const { rerender } = renderHook(() => useAsyncOptions("fantasma", []), {
      wrapper: makeWrapper(vi.fn()),
    });

    await waitFor(() =>
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining("fantasma"),
      ),
    );
    const callsAfterFirst = warn.mock.calls.length;

    // Re-render: el warning NO debe spamear (una sola vez por id).
    rerender();
    await new Promise((r) => setTimeout(r, 20));
    expect(warn.mock.calls.length).toBe(callsAfterFirst);

    warn.mockRestore();
  });

  it("sin loaderId queda inerte (no carga, devuelve defaults)", async () => {
    const loader = vi.fn(async () => ({ options: [{ label: "X", value: "x" }] }));
    const { result } = renderHook(() => useAsyncOptions(undefined), {
      wrapper: makeWrapper(loader),
    });

    expect(result.current.options).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    // Damos margen a un posible effect: nunca debe llamar al loader.
    await new Promise((r) => setTimeout(r, 50));
    expect(loader).not.toHaveBeenCalled();
  });
});
