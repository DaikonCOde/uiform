// Tests de casos de uso dinámicos (fix de revisión de casos de uso):
// 1) visibilidad condicional (if/then/else) — el campo aparece/desaparece al cambiar otro valor.
// 2) registry de widgets custom — el consumidor reemplaza/agrega componentes por ui:widget.

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { FormProvider } from "../../src/context/FormStoreContext";
import { Field } from "../../src/components/form/Field";
import type { JsfObjectSchema } from "@laus/json-schema-form";
import type { UiSchema } from "../../src/store/types";

describe("visibilidad condicional (if/then/else)", () => {
  // hasPet === 'yes' → petName visible; si no, oculto (else: properties.petName false).
  const schema: JsfObjectSchema = {
    type: "object",
    additionalProperties: false,
    properties: {
      hasPet: {
        type: "string",
        oneOf: [
          { const: "yes", title: "Sí" },
          { const: "no", title: "No" },
        ],
        "x-jsf-presentation": { inputType: "radio" },
      },
      petName: {
        type: "string",
        title: "Nombre de la mascota",
        "x-jsf-presentation": { inputType: "text" },
      },
    },
    required: ["hasPet"],
    allOf: [
      {
        if: { properties: { hasPet: { const: "yes" } }, required: ["hasPet"] },
        then: { required: ["petName"] },
        else: { properties: { petName: false } },
      },
    ],
  } as JsfObjectSchema;

  it("el campo condicional aparece al cumplirse la condición (DOM, no solo el store)", async () => {
    const user = userEvent.setup();
    render(
      <FormProvider schema={schema}>
        <Field name="hasPet" />
        <Field name="petName" />
      </FormProvider>,
    );

    // Inicialmente hasPet no es 'yes' → petName OCULTO.
    expect(document.getElementById("petName")).toBeNull();

    // Elijo "Sí" → la condición se cumple → petName debe APARECER en el DOM (no quedar congelado).
    await user.click(screen.getByRole("radio", { name: "Sí" }));

    expect(document.getElementById("petName")).toBeInTheDocument();
  });
});

describe("registry de widgets custom", () => {
  function StarRating(props: { value?: number }) {
    return <div data-testid="star-rating">RATING:{props.value ?? "-"}</div>;
  }
  function MyText(props: { value?: string }) {
    return <div data-testid="my-text">{props.value ?? ""}</div>;
  }

  const schema: JsfObjectSchema = {
    type: "object",
    properties: {
      score: { type: "number", title: "Puntaje" },
      nombre: { type: "string", title: "Nombre" },
    },
  } as JsfObjectSchema;

  it("renderiza un widget custom desconocido (ui:widget no está en el mapa default)", () => {
    const uiSchema: UiSchema = { score: { "ui:widget": "rating" } };
    render(
      <FormProvider schema={schema} uiSchema={uiSchema} components={{ rating: StarRating }}>
        <Field name="score" />
      </FormProvider>,
    );
    // Sin el registry caería en el Fallback "Unsupported field type: rating".
    expect(screen.getByTestId("star-rating")).toBeInTheDocument();
  });

  it("el registry OVERRIDE-ea un widget built-in (text → componente propio)", () => {
    const uiSchema: UiSchema = { nombre: { "ui:widget": "text" } };
    render(
      <FormProvider schema={schema} uiSchema={uiSchema} components={{ text: MyText }}>
        <Field name="nombre" />
      </FormProvider>,
    );
    // El TextField default NO se usa; se usa MyText.
    expect(screen.getByTestId("my-text")).toBeInTheDocument();
  });
});
