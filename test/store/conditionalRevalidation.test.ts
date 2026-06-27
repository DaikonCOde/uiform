// Al togglear la visibilidad, el JSON validado se arma con la visibilidad NUEVA (no la vieja): ocultar un
// campo con valor NO debe disparar "Not allowed"; y su valor se LIMPIA del estado.
import { describe, it, expect } from "vitest";
import { createFormStore } from "../../src/store/createFormStore";
import type { JsfObjectSchema } from "@laus/json-schema-form";
import type { UiSchema } from "../../src/store/types";

const schema: JsfObjectSchema = {
  type: "object",
  additionalProperties: false,
  properties: { A: { type: "boolean" }, field2: { type: "string" } },
  allOf: [
    // A=true → field2 visible; A=false → field2 oculto (no permitido).
    {
      if: { properties: { A: { const: true } }, required: ["A"] },
      then: {},
      else: { properties: { field2: false } },
    },
  ],
} as JsfObjectSchema;
const uiSchema: UiSchema = {
  "ui:sections": [{ id: "s", fields: ["A", "field2"] }],
  A: { "ui:widget": "checkbox" },
  field2: { "ui:widget": "text" },
};

describe("re-validación al togglear visibilidad", () => {
  it("ocultar un campo con valor lo limpia y NO dispara 'Not allowed'", () => {
    const store = createFormStore(schema, uiSchema, { config: { validateTrigger: "onChange" } } as any);
    const s = () => store.getState();
    const errF2 = () => (s().errors as Record<string, any>).field2 ?? null;

    s().setValue("A", true);
    s().setValue("field2", "VALOR2");
    expect(errF2()).toBeNull(); // visible con valor → ok

    s().setValue("A", false); // field2 se oculta
    expect(s().values.field2).toBe(""); // ✅ valor limpiado al ocultar
    expect(errF2()).toBeNull(); // ✅ sin "Not allowed" (JSON con visibilidad nueva)
  });
});
