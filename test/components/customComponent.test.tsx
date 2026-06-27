// Componente CUSTOM compuesto: compone componentes de la librería + se suscribe al estado vía hooks +
// embebe otros <Field>, y todo respeta las reglas del schema (if/then/else). (feature: componentes custom)

import { describe, it, expect, afterEach } from "vitest";
import { render, act, cleanup } from "@testing-library/react";
import React from "react";

import { FormProvider, useFormStore } from "../../src/context/FormStoreContext";
import { Field } from "../../src/components/form/Field";
import { FormSection } from "../../src/components/form/FormSection";
import { CheckboxField } from "../../src/components/fields/CheckboxField";
import { useWatch } from "../../src/hooks/useWatch";
import type { JsfObjectSchema } from "@laus/json-schema-form";
import type { UiSchema } from "../../src/store/types";

afterEach(cleanup);

// El custom: header (label + checkbox de la librería) + el campo que corresponda EMBEBIDO vía <Field>.
// El schema decide si abajo va el texto (A=false) o el select (A=true).
function ToggleCard({ name, value, onChange, label }: any) {
  const activo = useWatch(name); // suscripción al estado por hook
  return (
    <div data-testid="card">
      <strong>{label ?? name}</strong>
      <CheckboxField name={name} value={value} onChange={(_n: string, v: any) => onChange(name, v)} />
      <Field name="detalleTexto" />
      <Field name="detalleOpcion" />
    </div>
  );
}

const schema: JsfObjectSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    usarLista: { type: "boolean", title: "¿Usar lista?" },
    detalleTexto: { type: "string", title: "Detalle (texto)" },
    detalleOpcion: { type: "string", title: "Detalle (opción)", oneOf: [{ const: "a", title: "A" }] },
  },
  allOf: [
    // usarLista=true → muestra el select (detalleOpcion), oculta el texto; y viceversa.
    {
      if: { properties: { usarLista: { const: true } }, required: ["usarLista"] },
      then: { properties: { detalleTexto: false } },
      else: { properties: { detalleOpcion: false } },
    },
  ],
} as JsfObjectSchema;

const uiSchema: UiSchema = {
  "ui:sections": [{ id: "s", fields: ["usarLista"] }], // solo el checkbox; los dependientes los embebe el custom
  usarLista: { "ui:widget": "toggleCard" },
  detalleTexto: { "ui:widget": "text" },
  detalleOpcion: { "ui:widget": "select" },
};

function setup() {
  let setValue!: (n: string, v: any) => void;
  const Cap = () => {
    setValue = useFormStore((s) => s.setValue);
    return null;
  };
  render(
    <FormProvider schema={schema} uiSchema={uiSchema} components={{ toggleCard: ToggleCard }}>
      <Cap />
      <FormSection id="s" />
    </FormProvider>,
  );
  return () => setValue;
}

describe("componente custom compuesto", () => {
  it("renderiza, compone CheckboxField y embebe campos dependientes", () => {
    setup();
    expect(document.querySelector('[data-testid="card"]')).toBeInTheDocument();
    // el CheckboxField de la librería, compuesto dentro del custom
    expect(document.querySelector('[data-testid="card"] input[type="checkbox"]')).toBeInTheDocument();
  });

  it("el schema decide qué campo embebido se ve (texto vs select)", () => {
    const getSet = setup();
    // A=false (default) → se ve el TEXTO, no el select
    expect(document.getElementById("detalleTexto")).toBeInTheDocument();
    expect(document.querySelector(".ant-select")).toBeNull();
    // tildar → se ve el SELECT, no el texto
    act(() => getSet()("usarLista", true));
    expect(document.getElementById("detalleTexto")).toBeNull();
    expect(document.querySelector(".ant-select")).toBeInTheDocument();
    // destildar → vuelve el texto
    act(() => getSet()("usarLista", false));
    expect(document.getElementById("detalleTexto")).toBeInTheDocument();
    expect(document.querySelector(".ant-select")).toBeNull();
  });
});
