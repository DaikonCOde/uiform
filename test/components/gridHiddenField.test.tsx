// Fix celda fantasma: un campo oculto (if/then/else) NO debe dejar su wrapper de grid vacío en el DOM.

import { describe, it, expect, afterEach } from "vitest";
import { render, act, cleanup } from "@testing-library/react";
import React from "react";

import { FormProvider, useFormStore } from "../../src/context/FormStoreContext";
import { FormSection } from "../../src/components/form/FormSection";
import type { JsfObjectSchema } from "@laus/json-schema-form";
import type { UiSchema, FormLayout } from "../../src/store/types";

afterEach(cleanup);

const schema: JsfObjectSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    facturaElectronica: { type: "boolean", title: "Factura" },
    cuit: { type: "string", title: "CUIT" },
  },
  allOf: [
    {
      if: { properties: { facturaElectronica: { const: true } }, required: ["facturaElectronica"] },
      then: { required: ["cuit"] },
      else: { properties: { cuit: false } },
    },
  ],
} as JsfObjectSchema;

const uiSchema: UiSchema = {
  "ui:sections": [{ id: "s", fields: ["facturaElectronica", "cuit"] }],
  facturaElectronica: { "ui:widget": "checkbox" },
  cuit: { "ui:widget": "text" },
};
const layout: FormLayout = { columns: 2 };

const cuitWrapper = () => document.querySelector('[class*="field-cuit"]');

describe("campo oculto en grid no deja celda fantasma", () => {
  it("oculto (checkbox sin tildar) → NO existe el wrapper de grid del campo", () => {
    render(
      <FormProvider schema={schema} uiSchema={uiSchema} layout={layout}>
        <FormSection id="s" />
      </FormProvider>,
    );
    expect(cuitWrapper()).toBeNull();
  });

  it("visible (checkbox tildado) → el wrapper SÍ existe", () => {
    render(
      <FormProvider schema={schema} uiSchema={uiSchema} layout={layout} initialValues={{ facturaElectronica: true }}>
        <FormSection id="s" />
      </FormProvider>,
    );
    expect(cuitWrapper()).not.toBeNull();
  });

  it("toggle: el wrapper aparece y desaparece reactivamente", () => {
    let setValue!: (n: string, v: any) => void;
    const Cap = () => {
      setValue = useFormStore((s) => s.setValue);
      return null;
    };
    render(
      <FormProvider schema={schema} uiSchema={uiSchema} layout={layout}>
        <Cap />
        <FormSection id="s" />
      </FormProvider>,
    );
    expect(cuitWrapper()).toBeNull(); // arranca oculto
    act(() => setValue("facturaElectronica", true));
    expect(cuitWrapper()).not.toBeNull(); // aparece
    act(() => setValue("facturaElectronica", false));
    expect(cuitWrapper()).toBeNull(); // vuelve a desaparecer
  });
});

// El motor pone/saca field.layout según visibilidad → un campo condicional perdía su colSpan al mostrarse.
// Usamos el colSpan ESTÁTICO del schema, así la regla del grid existe desde el arranque (oculto o visible).
describe("colSpan se conserva en campo condicional", () => {
  const schemaCS: JsfObjectSchema = {
    type: "object",
    additionalProperties: false,
    properties: { factura: { type: "boolean" }, detalle: { type: "string" } },
    allOf: [
      {
        if: { properties: { factura: { const: true } }, required: ["factura"] },
        then: { required: ["detalle"] },
        else: { properties: { detalle: false } },
      },
    ],
  } as JsfObjectSchema;
  const uiSchemaCS: UiSchema = {
    "ui:sections": [{ id: "s", fields: ["factura", "detalle"] }],
    factura: { "ui:widget": "checkbox" },
    detalle: { "ui:widget": "text", "ui:colSpan": 2 },
  };
  const hasColSpanRule = () =>
    Array.from(document.querySelectorAll("style"))
      .map((s) => s.textContent || "")
      .join("\n")
      .replace(/\s+/g, " ")
      .includes("field-detalle { grid-column: span 2");

  it("la regla de colSpan existe ya con el campo OCULTO (y al mostrarlo)", () => {
    let setValue!: (n: string, v: any) => void;
    const Cap = () => {
      setValue = useFormStore((s) => s.setValue);
      return null;
    };
    render(
      <FormProvider schema={schemaCS} uiSchema={uiSchemaCS} layout={{ columns: 2 }}>
        <Cap />
        <FormSection id="s" />
      </FormProvider>,
    );
    expect(hasColSpanRule()).toBe(true); // oculto, pero la regla ya está
    act(() => setValue("factura", true));
    expect(hasColSpanRule()).toBe(true); // visible, sigue
  });
});
