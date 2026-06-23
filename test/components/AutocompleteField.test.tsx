// AutocompleteField a través del controlador (Fase 4): renderiza, carga opciones async y dispara
// onChange en la selección, SIN loop de render ni context. Usa el prop getFormValues. (ROADMAP_V2.md Fase 4)

import { describe, it, expect, vi } from "vitest";
import { render, screen, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

import { FormProvider, useFormStore } from "../../src/context/FormStoreContext";
import { Field } from "../../src/components/form/Field";
import type { JsfObjectSchema, AsyncOptionsLoader } from "@laus/json-schema-form";

// Schema con un autocomplete que referencia un loader async por id (el motor le inyecta asyncOptions.loader).
const schema: JsfObjectSchema = {
  type: "object",
  properties: {
    pais: {
      type: "string",
      title: "Pais",
      "x-jsf-presentation": {
        inputType: "autocomplete",
        asyncOptions: { id: "paises" },
      },
    },
  },
} as JsfObjectSchema;

// Loader que devuelve opciones fijas; espiado para contar invocaciones (detecta recargas innecesarias).
function makeLoader() {
  return vi.fn(async () => ({
    options: [
      { value: "ar", label: "Argentina" },
      { value: "uy", label: "Uruguay" },
    ],
  })) as unknown as AsyncOptionsLoader & { mock: { calls: unknown[] } };
}

function renderForm(loader: AsyncOptionsLoader) {
  let latest: Record<string, unknown> = {};
  function ValuesSpy() {
    latest = useFormStore((s) => s.values);
    return null;
  }
  const utils = render(
    <FormProvider schema={schema} asyncLoaders={{ paises: loader }}>
      <ValuesSpy />
      <Field name="pais" />
    </FormProvider>,
  );
  return { ...utils, getValues: () => latest };
}

describe("AutocompleteField vía <Field> (Fase 4)", () => {
  it("renderiza el campo (label + combobox) dentro del FormProvider", () => {
    renderForm(makeLoader());
    expect(screen.getByText("Pais")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("carga las opciones async al montar usando getFormValues (no context)", async () => {
    const loader = makeLoader();
    renderForm(loader);
    // El effect de carga inicial corre con el loader inyectado por el motor.
    await waitFor(() => expect(loader).toHaveBeenCalled());
    // El loader recibe el contexto con formValues (provisto por getFormValues, no por context).
    expect((loader as any).mock.calls[0][0]).toHaveProperty("formValues");
  });

  it("dispara onChange(name,value) al seleccionar una opción → guarda el value en el store", async () => {
    const user = userEvent.setup();
    const loader = makeLoader();
    const { getValues } = renderForm(loader);

    await waitFor(() => expect(loader).toHaveBeenCalled());

    const input = screen.getByRole("combobox");
    await user.click(input);
    await user.type(input, "Arg");

    // La opción aparece en el dropdown (cargada async) y la seleccionamos.
    const option = await screen.findByText("Argentina");
    await user.click(option);

    // El controlador adaptó onChange(name,value) → setValue → el store guarda el value de la opción.
    await waitFor(() => expect(getValues().pais).toBe("ar"));
  });

  it("no loopea: setValue externo no dispara recargas de opciones en cascada", async () => {
    const loader = makeLoader();
    let setValue!: (name: string, value: unknown) => void;
    function Capture() {
      setValue = useFormStore((s) => s.setValue);
      return null;
    }
    render(
      <FormProvider schema={schema} asyncLoaders={{ paises: loader }}>
        <Capture />
        <Field name="pais" />
      </FormProvider>,
    );

    await waitFor(() => expect(loader).toHaveBeenCalledTimes(1));
    const callsAfterMount = (loader as any).mock.calls.length;

    // Cambiar el value del campo NO debe re-disparar el loader (carga inicial atada a deps estructurales).
    act(() => setValue("pais", "uy"));
    // Varios cambios externos consecutivos: si hubiera loop, el loader se dispararía en cascada.
    act(() => setValue("pais", "ar"));
    act(() => setValue("pais", ""));
    // Ventana amplia para detectar cualquier recarga diferida (debounce/effect tardío).
    await new Promise((r) => setTimeout(r, 100));

    expect((loader as any).mock.calls.length).toBe(callsAfterMount);
  });

  it("la búsqueda en el input recarga las opciones vía el loader del store (debounced)", async () => {
    const user = userEvent.setup();
    const loader = makeLoader();
    renderForm(loader);

    await waitFor(() => expect(loader).toHaveBeenCalledTimes(1));

    const input = screen.getByRole("combobox");
    await user.click(input);
    await user.type(input, "Uru");

    // onSearch → reload(search) re-invoca el loader; el debounce colapsa el tipeo en una sola recarga extra.
    await waitFor(() => expect((loader as any).mock.calls.length).toBeGreaterThan(1));
    const lastCall = (loader as any).mock.calls.at(-1)[0];
    expect(lastCall).toHaveProperty("search");
    expect(lastCall.search).toContain("Uru");
  });
});
