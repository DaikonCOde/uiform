// Smoke test de integración (Fase 4): los presentacionales renderizan y actualizan el store
// cuando se manejan por el controlador <Field>, no por context. (ROADMAP_V2.md Fase 4)

import { describe, it, expect } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

import { FormProvider, useFormStore } from "../../src/context/FormStoreContext";
import { Field } from "../../src/components/form/Field";
import type { JsfObjectSchema } from "@laus/json-schema-form";

// Schema chico pero real: el motor debe aceptarlo. inputType explícito por campo → el controlador resuelve el componente.
const schema: JsfObjectSchema = {
  type: "object",
  properties: {
    nombre: { type: "string", title: "Nombre", "x-jsf-presentation": { inputType: "text" } },
    edad: { type: "number", title: "Edad", "x-jsf-presentation": { inputType: "number" } },
    acepta: { type: "boolean", title: "Acepta", "x-jsf-presentation": { inputType: "checkbox" } },
    rol: {
      type: "string",
      title: "Rol",
      oneOf: [
        { const: "admin", title: "Admin" },
        { const: "user", title: "User" },
      ],
      "x-jsf-presentation": { inputType: "radio" },
    },
    fecha: { type: "string", title: "Fecha", "x-jsf-presentation": { inputType: "date" } },
    notas: { type: "string", title: "Notas", "x-jsf-presentation": { inputType: "textarea" } },
  },
} as JsfObjectSchema;

// Espía de valores: se suscribe a values y los expone para aserciones (lee el estado real del store).
function ValuesSpy({ onValues }: { onValues: (v: Record<string, unknown>) => void }) {
  const values = useFormStore((s) => s.values);
  onValues(values);
  return null;
}

// Form real montado por el controlador: cada campo pasa por <Field name>, que cablea el store.
function renderForm(initialValues?: Record<string, unknown>) {
  let latest: Record<string, unknown> = {};
  const utils = render(
    <FormProvider schema={schema} initialValues={initialValues}>
      <ValuesSpy onValues={(v) => (latest = v)} />
      <Field name="nombre" />
      <Field name="edad" />
      <Field name="acepta" />
      <Field name="rol" />
      <Field name="fecha" />
      <Field name="notas" />
    </FormProvider>,
  );
  return { ...utils, getValues: () => latest };
}

describe("vertical slice: presentacionales manejados por <Field> (Fase 4)", () => {
  it("renderiza cada tipo de campo (label/input presentes)", () => {
    renderForm();
    // Labels de cada campo (FieldLabel) → confirma que el controlador resolvió cada inputType.
    expect(screen.getByText("Nombre")).toBeInTheDocument();
    expect(screen.getByText("Edad")).toBeInTheDocument();
    expect(screen.getByText("Acepta")).toBeInTheDocument();
    expect(screen.getByText("Rol")).toBeInTheDocument();
    expect(screen.getByText("Fecha")).toBeInTheDocument();
    expect(screen.getByText("Notas")).toBeInTheDocument();

    // Inputs concretos por rol/role.
    expect(document.getElementById("nombre")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Admin" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "User" })).toBeInTheDocument();
  });

  it("tipear en el campo de texto actualiza el value en el store", async () => {
    const user = userEvent.setup();
    const { getValues } = renderForm();

    const input = document.getElementById("nombre") as HTMLInputElement;
    await user.type(input, "Ada");

    // El value llegó al store vía el adaptador onChange(name,value) → onChange(value) del hook.
    expect(getValues().nombre).toBe("Ada");
  });

  it("tipear en el campo numérico parsea y guarda un número en el store", async () => {
    const user = userEvent.setup();
    const { getValues } = renderForm();

    const input = screen.getByRole("spinbutton");
    await user.type(input, "42");

    expect(getValues().edad).toBe(42);
  });

  it("seleccionar un radio actualiza el value en el store", async () => {
    const user = userEvent.setup();
    const { getValues } = renderForm();

    await user.click(screen.getByRole("radio", { name: "Admin" }));
    expect(getValues().rol).toBe("admin");
  });

  it("tipear en el textarea actualiza el value en el store", async () => {
    const user = userEvent.setup();
    const { getValues } = renderForm();

    const textarea = document.getElementById("notas") as HTMLTextAreaElement;
    await user.type(textarea, "hola");
    expect(getValues().notas).toBe("hola");
  });

  it("togglear el checkbox guarda un booleano (true)", async () => {
    const user = userEvent.setup();
    const { getValues } = renderForm();

    const checkbox = screen.getByRole("checkbox");
    await user.click(checkbox);
    expect(getValues().acepta).toBe(true);
  });

  it("preserva false: un checkbox que arranca en false round-trips sin pisarse a vacío", () => {
    // initialValues con false explícito: el default usa `??` → false sobrevive (no se vuelve "").
    const { getValues } = renderForm({ acepta: false });
    expect(getValues().acepta).toBe(false);
    expect(screen.getByRole("checkbox")).not.toBeChecked();
  });

  it("preserva 0: un campo numérico que arranca en 0 round-trips (falsy válido)", () => {
    const { getValues } = renderForm({ edad: 0 });
    expect(getValues().edad).toBe(0);
  });

  it("el controlador adapta onChange(name,value) del presentacional al setValue(name,value) del store", async () => {
    const user = userEvent.setup();
    const { getValues } = renderForm();

    // Marcar y desmarcar: el value que emite el presentacional llega tal cual al store (el adaptador
    // no transforma el value, solo descarta el name). CheckboxField emite el checkboxValue del motor al
    // marcar y null al desmarcar; lo verificamos como round-trip de lo que emite el componente.
    const checkbox = screen.getByRole("checkbox");
    await user.click(checkbox);
    const checkedValue = getValues().acepta;
    expect(checkedValue).toBeTruthy(); // marcado: value de checked emitido por el presentacional
    await user.click(checkbox);
    expect(getValues().acepta).not.toBe(checkedValue); // desmarcado: el value cambió al estado off
    expect(screen.getByRole("checkbox")).not.toBeChecked();
  });

  it("setValue programático se refleja en el value del campo (store → presentacional)", () => {
    let setValue!: (name: string, value: unknown) => void;
    function Capture() {
      setValue = useFormStore((s) => s.setValue);
      return null;
    }
    render(
      <FormProvider schema={schema}>
        <Capture />
        <Field name="nombre" />
      </FormProvider>,
    );

    act(() => setValue("nombre", "desde el store"));
    expect((document.getElementById("nombre") as HTMLInputElement).value).toBe(
      "desde el store",
    );
  });
});
