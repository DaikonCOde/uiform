// Aislamiento de re-render en CONTENEDORES (fix): cambiar un campo dentro de un fieldset/group-array NO
// debe re-renderizar a sus hermanos. Cada hijo se suscribe granularmente vía su propio <Field>.

import { describe, it, expect, afterEach } from "vitest";
import { render, act, cleanup } from "@testing-library/react";
import React from "react";

import { FormProvider, useFormStore } from "../../src/context/FormStoreContext";
import { FormSection } from "../../src/components/form/FormSection";
import type { JsfObjectSchema } from "@laus/json-schema-form";
import type { UiSchema } from "../../src/store/types";

afterEach(cleanup as any);

// Widget que cuenta renders por name (inyectado vía el registry `components`).
const counts: Record<string, number> = {};
function Counter(props: any) {
  counts[props.name] = (counts[props.name] || 0) + 1;
  return <input data-name={props.name} value={props.value ?? ""} onChange={() => {}} />;
}

const schema: JsfObjectSchema = {
  type: "object",
  properties: {
    nombre: { type: "string", "x-jsf-presentation": { inputType: "text" } },
    apellido: { type: "string", "x-jsf-presentation": { inputType: "text" } },
    direccion: {
      type: "object",
      "x-jsf-presentation": { inputType: "fieldset" },
      properties: {
        calle: { type: "string", "x-jsf-presentation": { inputType: "text" } },
        numero: { type: "string", "x-jsf-presentation": { inputType: "text" } },
      },
    },
  },
} as JsfObjectSchema;
const uiSchema: UiSchema = { "ui:sections": [{ id: "s", fields: ["nombre", "apellido", "direccion"] }] };

function setup() {
  Object.keys(counts).forEach((k) => delete counts[k]);
  let setValue!: (n: string, v: any) => void;
  const Capture = () => {
    setValue = useFormStore((s) => s.setValue);
    return null;
  };
  render(
    <FormProvider schema={schema} uiSchema={uiSchema} components={{ text: Counter }}>
      <Capture />
      <FormSection id="s" />
    </FormProvider>,
  );
  const delta = (base: Record<string, number>) =>
    Object.fromEntries(
      ["nombre", "apellido", "direccion.calle", "direccion.numero"].map((k) => [k, (counts[k] || 0) - (base[k] || 0)]),
    );
  return { setValue, delta };
}

describe("aislamiento de re-render en contenedores", () => {
  it("cambiar un campo top-level no re-renderiza al fieldset ni a sus hijos", () => {
    const { setValue, delta } = setup();
    const base = { ...counts };
    act(() => setValue("nombre", "X"));
    expect(delta(base)).toEqual({
      nombre: 1,
      apellido: 0,
      "direccion.calle": 0,
      "direccion.numero": 0,
    });
  });

  it("cambiar un campo DENTRO del fieldset NO re-renderiza al hermano (numero)", () => {
    const { setValue, delta } = setup();
    const base = { ...counts };
    act(() => setValue("direccion.calle", "Y"));
    expect(delta(base)).toEqual({
      nombre: 0,
      apellido: 0,
      "direccion.calle": 1,
      "direccion.numero": 0, // <-- antes daba 1 (el bug)
    });
  });
});
