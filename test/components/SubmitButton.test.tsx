// Tests de <SubmitButton>: dispara submit del store y muestra loading durante el envío. (ROADMAP_V2.md Fase 6)

import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { FormProvider } from "../../src/context/FormStoreContext";
import { SubmitButton } from "../../src/components/form/SubmitButton";
import { Field } from "../../src/components/form/Field";
import type { JsfObjectSchema } from "@laus/json-schema-form";

// Schema mínimo válido: un campo de texto requerido para poder forzar válido/invalido en submit.
const schema: JsfObjectSchema = {
  type: "object",
  properties: {
    nombre: { type: "string", title: "Nombre", "x-jsf-presentation": { inputType: "text" } },
  },
  required: ["nombre"],
} as JsfObjectSchema;

describe("<SubmitButton> (Fase 6)", () => {
  it("al hacer click llama a onSubmit del provider con el payload válido", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <FormProvider schema={schema} onSubmit={onSubmit} initialValues={{ nombre: "Ada" }}>
        <SubmitButton />
      </FormProvider>,
    );

    await user.click(screen.getByRole("button"));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toEqual({ nombre: "Ada" });
  });

  it("usa 'Enviar' como label por defecto y respeta children custom", () => {
    const { rerender } = render(
      <FormProvider schema={schema}>
        <SubmitButton />
      </FormProvider>,
    );
    expect(screen.getByRole("button", { name: "Enviar" })).toBeInTheDocument();

    rerender(
      <FormProvider schema={schema}>
        <SubmitButton>Guardar</SubmitButton>
      </FormProvider>,
    );
    expect(screen.getByRole("button", { name: "Guardar" })).toBeInTheDocument();
  });

  it("muestra loading mientras el submit está en curso", async () => {
    const user = userEvent.setup();
    // onSubmit que no resuelve hasta que lo liberamos: durante esa ventana isSubmitting=true.
    let release!: () => void;
    const onSubmit = vi.fn(
      () => new Promise<void>((resolve) => (release = resolve)),
    );

    render(
      <FormProvider schema={schema} onSubmit={onSubmit} initialValues={{ nombre: "Ada" }}>
        <SubmitButton />
      </FormProvider>,
    );

    const button = screen.getByRole("button");
    await user.click(button);

    // AntD marca el botón con la clase ant-btn-loading mientras isSubmitting es true.
    await waitFor(() => expect(button).toHaveClass("ant-btn-loading"));

    release();
    await waitFor(() => expect(button).not.toHaveClass("ant-btn-loading"));
  });

  it("acepta props extra de Button (se spreadean al AntD Button)", () => {
    render(
      <FormProvider schema={schema}>
        <SubmitButton disabled data-testid="submit-extra" />
      </FormProvider>,
    );
    const button = screen.getByTestId("submit-extra");
    expect(button).toBeDisabled();
  });

  it("evita el isolation de Field: el botón vive junto a un Field y dispara submit igual", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <FormProvider schema={schema} onSubmit={onSubmit}>
        <Field name="nombre" />
        <SubmitButton />
      </FormProvider>,
    );

    // Sin valor: required falla → no se llama onSubmit.
    await user.click(screen.getByRole("button", { name: "Enviar" }));
    await waitFor(() => expect(onSubmit).not.toHaveBeenCalled());

    // Tipeamos y reintentamos: ahora es válido → se llama.
    await user.type(document.getElementById("nombre") as HTMLInputElement, "Ada");
    await user.click(screen.getByRole("button", { name: "Enviar" }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
  });
});
