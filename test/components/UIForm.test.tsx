// Tests de <UIForm>: render por secciones por default, tipeo, submit válido/invalido y children custom. (ROADMAP_V2.md Fase 6)

import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { UIForm } from "../../src/components/form/UIForm";
import type { JsfObjectSchema } from "@laus/json-schema-form";
import type { UiSchema } from "../../src/store/types";

// Schema con dos campos: text requerido + number. Suficiente para validación end-to-end.
const schema: JsfObjectSchema = {
  type: "object",
  properties: {
    nombre: { type: "string", title: "Nombre", "x-jsf-presentation": { inputType: "text" } },
    edad: { type: "number", title: "Edad", "x-jsf-presentation": { inputType: "number" } },
  },
  required: ["nombre"],
} as JsfObjectSchema;

// uiSchema con dos secciones autoradas: confirma que UIForm renderiza por sección. (ARCHITECTURE_V2.md §6)
const uiSchema: UiSchema = {
  "ui:sections": [
    { id: "datos", title: "Datos", fields: ["nombre"] },
    { id: "extra", title: "Extra", fields: ["edad"] },
  ],
};

describe("<UIForm> (Fase 6)", () => {
  it("renderiza los campos de las secciones por default", () => {
    render(<UIForm schema={schema} uiSchema={uiSchema} />);

    // Labels de cada campo presentes.
    expect(screen.getByText("Nombre")).toBeInTheDocument();
    expect(screen.getByText("Edad")).toBeInTheDocument();
    // Títulos de sección renderizados por FormSection.
    expect(screen.getByText("Datos")).toBeInTheDocument();
    expect(screen.getByText("Extra")).toBeInTheDocument();
    // Inputs concretos.
    expect(document.getElementById("nombre")).toBeInTheDocument();
    expect(screen.getByRole("spinbutton")).toBeInTheDocument();
  });

  it("sin uiSchema renderiza todos los campos en la sección implícita", () => {
    render(<UIForm schema={schema} />);
    expect(document.getElementById("nombre")).toBeInTheDocument();
    expect(screen.getByRole("spinbutton")).toBeInTheDocument();
  });

  it("muestra la barra de submit por defecto (Enviar + Reset) cuando no hay children", () => {
    render(<UIForm schema={schema} />);
    expect(screen.getByRole("button", { name: "Enviar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reset" })).toBeInTheDocument();
  });

  it("tipear actualiza y un submit válido llama a onSubmit con el payload", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<UIForm schema={schema} onSubmit={onSubmit} />);

    await user.type(document.getElementById("nombre") as HTMLInputElement, "Ada");
    await user.type(screen.getByRole("spinbutton"), "42");

    await user.click(screen.getByRole("button", { name: "Enviar" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toEqual({ nombre: "Ada", edad: 42 });
  });

  it("un submit inválido (required vacío) NO llama a onSubmit", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<UIForm schema={schema} onSubmit={onSubmit} />);

    // nombre requerido vacío → submit no debe disparar onSubmit.
    await user.click(screen.getByRole("button", { name: "Enviar" }));

    await waitFor(() => expect(onSubmit).not.toHaveBeenCalled());
  });

  it("el botón Reset limpia los valores tipeados", async () => {
    const user = userEvent.setup();
    render(<UIForm schema={schema} />);

    const nombre = document.getElementById("nombre") as HTMLInputElement;
    await user.type(nombre, "Ada");
    expect(nombre.value).toBe("Ada");

    await user.click(screen.getByRole("button", { name: "Reset" }));
    await waitFor(() => expect(nombre.value).toBe(""));
  });

  it("con children custom los muestra en vez de la barra default", () => {
    render(
      <UIForm schema={schema}>
        <button type="button">Mi botón custom</button>
      </UIForm>,
    );

    expect(screen.getByRole("button", { name: "Mi botón custom" })).toBeInTheDocument();
    // La barra default no se renderiza.
    expect(screen.queryByRole("button", { name: "Reset" })).not.toBeInTheDocument();
  });
});
