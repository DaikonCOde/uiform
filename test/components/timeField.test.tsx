// Tests del widget `time` (TimePicker): display configurable, store wall-clock (HH:mm / HH:mm:ss), keyword del schema.

import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import React from "react";

import { FormProvider } from "../../src/context/FormStoreContext";
import { Field } from "../../src/components/form/Field";
import type { JsfObjectSchema } from "@laus/json-schema-form";
import type { UiSchema } from "../../src/store/types";

afterEach(cleanup);

const schema: JsfObjectSchema = {
  type: "object",
  properties: { hora: { type: "string", title: "Hora", format: "time" } },
} as JsfObjectSchema;

function renderTime(ui: UiSchema, initialValues?: Record<string, any>) {
  render(
    <FormProvider schema={schema} uiSchema={ui} initialValues={initialValues}>
      <Field name="hora" />
    </FormProvider>,
  );
  return document.querySelector(".ant-picker input") as HTMLInputElement;
}

describe("widget time", () => {
  it("renderiza un TimePicker", () => {
    renderTime({ hora: { "ui:widget": "time" } });
    expect(document.querySelector(".ant-picker")).toBeInTheDocument();
  });

  it("muestra el value en HH:mm por default", () => {
    const input = renderTime({ hora: { "ui:widget": "time" } }, { hora: "14:30:00" });
    expect(input.value).toBe("14:30");
  });

  it("ui:options.format controla el formato de display (HH:mm:ss)", () => {
    const input = renderTime(
      { hora: { "ui:widget": "time", "ui:options": { format: "HH:mm:ss" } } },
      { hora: "09:05:30" },
    );
    expect(input.value).toBe("09:05:30");
  });

  it("NO usa el keyword format:'time' del schema como display (evita basura)", () => {
    // field.format = 'time' (keyword del schema) → se ignora como display → cae al default HH:mm.
    const input = renderTime({ hora: { "ui:widget": "time" } }, { hora: "23:15:00" });
    expect(input.value).toBe("23:15");
  });
});
