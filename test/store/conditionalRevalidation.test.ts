// Al togglear la visibilidad, el JSON validado debe armarse con la visibilidad NUEVA, no la vieja:
// un campo que reaparece con su valor NO debe disparar "Required", y uno que se oculta NO "Not allowed".
import { describe, it, expect } from "vitest";
import { createFormStore } from "../../src/store/createFormStore";
import type { JsfObjectSchema } from "@laus/json-schema-form";
import type { UiSchema } from "../../src/store/types";

const schema: JsfObjectSchema = {
  type: "object",
  additionalProperties: false,
  properties: { A: { type: "boolean" }, field1: { type: "string" }, field2: { type: "string" } },
  allOf: [
    { if: { properties: { A: { const: true } }, required: ["A"] }, then: { required: ["field2"] }, else: { properties: { field2: false } } },
    { if: { properties: { A: { const: true } }, required: ["A"] }, then: { properties: { field1: false } }, else: { required: ["field1"] } },
  ],
} as JsfObjectSchema;
const uiSchema: UiSchema = {
  "ui:sections": [{ id: "s", fields: ["A", "field1", "field2"] }],
  A: { "ui:widget": "checkbox" }, field1: { "ui:widget": "text" }, field2: { "ui:widget": "text" },
};

describe("re-validación al togglear visibilidad", () => {
  it("un campo que reaparece con su valor no dispara required ni not-allowed", () => {
    const store = createFormStore(schema, uiSchema, { config: { validateTrigger: "onChange" } } as any);
    const s = () => store.getState();
    const errF2 = () => (s().errors as Record<string, any>).field2 ?? null;

    s().setValue("A", true);
    s().setValue("field2", "VALOR2");
    expect(errF2()).toBeNull(); // visible con valor → ok

    s().setValue("A", false); // field2 se oculta (conserva valor)
    expect(s().values.field2).toBe("VALOR2");
    expect(errF2()).toBeNull(); // oculto → NO "Not allowed"

    s().setValue("field1", "VALOR1");
    s().setValue("A", true); // field2 reaparece con su valor
    expect(s().values.field2).toBe("VALOR2");
    expect(errF2()).toBeNull(); // ✅ antes: "Required field"
  });
});
