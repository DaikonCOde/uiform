/* eslint-disable @typescript-eslint/no-explicit-any */
// Tests de SelectField (ARCHITECTURE_V2.md §8): opciones estáticas + onChange, y opciones async desde el store (sin FormContext).

import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
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
});
