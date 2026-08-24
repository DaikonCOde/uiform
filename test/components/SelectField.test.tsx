/* eslint-disable @typescript-eslint/no-explicit-any */
// Tests de SelectField (ARCHITECTURE_V2.md §8): opciones estáticas + onChange, y opciones async desde el store (sin FormContext).

import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

import { FormProvider } from "../../src/context/FormStoreContext";
import { SelectField } from "../../src/components/fields/SelectField";
import type { JsfObjectSchema } from "@laus/json-schema-form";

// SelectField usa useAsyncOptions internamente → siempre necesita un FormProvider, aunque sea estático.
const baseSchema: JsfObjectSchema = {
  type: "object",
  properties: {
    color: { type: "string", "x-jsf-presentation": { inputType: "select" } },
  },
} as JsfObjectSchema;

function renderInProvider(
  ui: React.ReactNode,
  asyncLoaders?: Record<string, any>,
) {
  return render(
    <FormProvider schema={baseSchema} asyncLoaders={asyncLoaders}>
      {ui}
    </FormProvider>,
  );
}

describe("SelectField", () => {
  it("renderiza opciones estáticas y dispara onChange(name, value) al seleccionar", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    renderInProvider(
      <SelectField
        name="color"
        inputType="select"
        isVisible
        value={undefined}
        onChange={onChange}
        options={[
          { label: "Rojo", value: "red" },
          { label: "Azul", value: "blue" },
        ]}
        {...({} as any)}
      />,
    );

    // Abrir el dropdown y elegir una opción.
    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByText("Azul"));

    expect(onChange).toHaveBeenCalledWith("color", "blue");
  });

  it("con asyncOptions.id carga las opciones desde el loader del store y no crashea", async () => {
    const loader = vi.fn(async () => ({
      options: [{ label: "Cargada", value: "loaded" }],
    }));

    renderInProvider(
      <SelectField
        name="color"
        inputType="select"
        isVisible
        value={undefined}
        onChange={vi.fn()}
        asyncOptions={{ id: "remote" }}
        {...({} as any)}
      />,
      { remote: loader },
    );

    // El loader del store debe correr al montar.
    await waitFor(() => expect(loader).toHaveBeenCalledTimes(1));

    // La opción cargada aparece en el dropdown.
    const user = userEvent.setup();
    await user.click(screen.getByRole("combobox"));
    expect(await screen.findByText("Cargada")).toBeInTheDocument();
  });

  it("con asyncOptions.searchable no deshabilita el combobox mientras el loader corre (evita perder el foco al tipear)", async () => {
    let resolveLoader!: (v: { options: unknown[] }) => void;
    const loader = vi.fn(
      () =>
        new Promise<{ options: unknown[] }>((resolve) => {
          resolveLoader = resolve;
        }),
    );

    renderInProvider(
      <SelectField
        name="color"
        inputType="select"
        isVisible
        value={undefined}
        onChange={vi.fn()}
        asyncOptions={{ id: "remote", searchable: true }}
        {...({} as any)}
      />,
      { remote: loader },
    );

    // El loader corre al montar y queda pendiente (loading:true en el store).
    await waitFor(() => expect(loader).toHaveBeenCalledTimes(1));

    // Mientras carga, el combobox NO debe deshabilitarse: mezclar disabled con loading le hace
    // perder el foco al usuario en cada letra (el spinner de `loading` ya comunica el estado).
    expect(screen.getByRole("combobox")).not.toBeDisabled();

    await act(async () => {
      resolveLoader({ options: [] });
    });
  });

  it("respeta minSearchLength: no dispara el loader hasta alcanzar el umbral de caracteres", async () => {
    const user = userEvent.setup();
    const loader = vi.fn(async () => ({ options: [] }));

    renderInProvider(
      <SelectField
        name="color"
        inputType="select"
        isVisible
        value={undefined}
        onChange={vi.fn()}
        asyncOptions={{ id: "remote", searchable: true, minSearchLength: 3 }}
        {...({} as any)}
      />,
      { remote: loader },
    );

    // Carga inicial al montar.
    await waitFor(() => expect(loader).toHaveBeenCalledTimes(1));

    const combobox = screen.getByRole("combobox");
    await user.click(combobox);
    await user.type(combobox, "ro"); // 2 caracteres, por debajo del umbral

    // Tiempo de sobra al debounce (250ms): no debe disparar el loader.
    await new Promise((r) => setTimeout(r, 400));
    expect(loader).toHaveBeenCalledTimes(1);

    await user.type(combobox, "j"); // 3 caracteres, alcanza el umbral
    await waitFor(() => expect(loader).toHaveBeenCalledTimes(2));
  });
});
