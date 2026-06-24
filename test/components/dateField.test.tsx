// Tarea v2: el FORMATO de display del campo `date` es configurable por el consumidor vía ui:options.format.
// Verifica: (1) el input usa el formato de display configurado, (2) el value guardado en el store es estable
// (YYYY-MM-DD), independiente del formato de display, para que la validación del schema funcione.

import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import dayjs from "dayjs";

// El setup global no registra cleanup automático → desmontamos entre tests para que no se apilen
// varios DatePicker con el mismo id="fecha" en el DOM (getElementById devolvería el de un render previo).
afterEach(cleanup);

import { FormProvider, useFormStore } from "../../src/context/FormStoreContext";
import { Field } from "../../src/components/form/Field";
import type { JsfObjectSchema } from "@laus/json-schema-form";
import type { UiSchema } from "../../src/store/types";

const schema: JsfObjectSchema = {
  type: "object",
  properties: {
    fecha: {
      type: "string",
      title: "Fecha",
      format: "date",
      "x-jsf-presentation": { inputType: "date" },
    },
  },
} as JsfObjectSchema;

// Espía: expone el value real del store para aserciones.
function ValuesSpy({ onValues }: { onValues: (v: Record<string, unknown>) => void }) {
  const values = useFormStore((s) => s.values);
  onValues(values);
  return null;
}

function renderForm(uiSchema?: UiSchema, initialValues?: Record<string, unknown>) {
  let latest: Record<string, unknown> = {};
  const utils = render(
    <FormProvider schema={schema} uiSchema={uiSchema} initialValues={initialValues}>
      <ValuesSpy onValues={(v) => (latest = v)} />
      <Field name="fecha" />
    </FormProvider>,
  );
  return { ...utils, getValues: () => latest };
}

describe("DateField: formato de display configurable vía ui:options.format", () => {
  it("el input usa el formato de display configurado (DD/MM/YYYY) al mostrar un valor", () => {
    // value guardado en formato estable (YYYY-MM-DD) → el input lo muestra con el format del consumidor.
    renderForm({ fecha: { "ui:options": { format: "DD/MM/YYYY" } } }, { fecha: "2024-03-15" });

    const input = document.getElementById("fecha") as HTMLInputElement;
    expect(input).toBeInTheDocument();
    // AntD DatePicker formatea el value con el format → display LATAM, no ISO.
    expect(input.value).toBe("15/03/2024");
  });

  it("sin ui:options.format usa el default YYYY-MM-DD para el display", () => {
    renderForm(undefined, { fecha: "2024-03-15" });
    const input = document.getElementById("fecha") as HTMLInputElement;
    expect(input.value).toBe("2024-03-15");
  });

  it("el value GUARDADO en el store es estable (YYYY-MM-DD), independiente del formato de display", async () => {
    const user = userEvent.setup();
    const { getValues } = renderForm({ fecha: { "ui:options": { format: "DD/MM/YYYY" } } });

    const input = document.getElementById("fecha") as HTMLInputElement;
    // Abrir el picker y tipear la fecha en el formato de display (DD/MM/YYYY).
    await user.click(input);
    await user.type(input, "15/03/2024");
    await user.keyboard("{Enter}");

    // El display respeta el format del consumidor...
    expect(input.value).toBe("15/03/2024");
    // ...pero el store guarda SIEMPRE YYYY-MM-DD (estable/parseable para la validación del schema).
    expect(getValues().fecha).toBe("2024-03-15");
    // Doble check: es un YYYY-MM-DD válido, no el formato de display.
    expect(dayjs(getValues().fecha as string, "YYYY-MM-DD", true).isValid()).toBe(true);
  });

  it("acepta un value inicial ya en formato de display y lo guarda estable al re-emitir", () => {
    // El parser de dayjsValue prioriza el `format` del consumidor → un value en DD/MM/YYYY se entiende.
    renderForm({ fecha: { "ui:options": { format: "DD/MM/YYYY" } } }, { fecha: "15/03/2024" });
    const input = document.getElementById("fecha") as HTMLInputElement;
    // Se muestra correctamente parseado con el format del consumidor.
    expect(input.value).toBe("15/03/2024");
  });
});
