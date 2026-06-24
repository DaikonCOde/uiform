// Tests de <FormSection> (ARCHITECTURE_V2.md §7): render default, render-prop custom, id inexistente sin romper.

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

import { FormProvider } from "../../src/context/FormStoreContext";
import { FormSection } from "../../src/components/form/FormSection";
import type { JsfObjectSchema } from "@laus/json-schema-form";
import type { Field } from "../../src/store/types";
import type { UiSchema } from "../../src/store/types";

// Schema (solo dato) + uiSchema con DOS secciones (presentación). Cada campo tiene title → label visible.
const schema: JsfObjectSchema = {
  type: "object",
  properties: {
    firstName: {
      type: "string",
      title: "First name",
      "x-jsf-presentation": { inputType: "text" },
    },
    lastName: {
      type: "string",
      title: "Last name",
      "x-jsf-presentation": { inputType: "text" },
    },
    street: {
      type: "string",
      title: "Street",
      "x-jsf-presentation": { inputType: "text" },
    },
  },
} as JsfObjectSchema;

const uiSchema: UiSchema = {
  "ui:sections": [
    { id: "personal", title: "Datos personales", fields: ["firstName", "lastName"] },
    { id: "address", title: "Dirección", fields: ["street"] },
  ],
};

function renderWith(children: React.ReactNode) {
  return render(
    <FormProvider schema={schema} uiSchema={uiSchema}>
      {children}
    </FormProvider>,
  );
}

afterEach(() => vi.restoreAllMocks());

describe("<FormSection>", () => {
  describe("render default", () => {
    it("renderiza el encabezado y los inputs de la sección", () => {
      renderWith(<FormSection id="personal" />);

      expect(screen.getByText("Datos personales")).toBeInTheDocument();
      // Inputs presentes: el render default monta un <Field> por cada name (id = name del campo).
      expect(document.getElementById("firstName")).toBeInTheDocument();
      expect(document.getElementById("lastName")).toBeInTheDocument();
    });

    it("solo renderiza los campos de SU sección (no los de otra)", () => {
      renderWith(<FormSection id="personal" />);
      expect(document.getElementById("street")).toBeNull();
    });

    it("muestra la description de la sección cuando está presente", () => {
      const ui: UiSchema = {
        "ui:sections": [
          { id: "personal", title: "Datos personales", description: "Completá tus datos", fields: ["firstName"] },
        ],
      };
      render(
        <FormProvider schema={schema} uiSchema={ui}>
          <FormSection id="personal" />
        </FormProvider>,
      );
      expect(screen.getByText("Completá tus datos")).toBeInTheDocument();
    });
  });

  describe("render-prop custom", () => {
    it("recibe los fields y renderiza el layout custom", () => {
      let received: Field[] = [];
      renderWith(
        <FormSection id="address">
          {(fields) => {
            received = fields;
            return <div data-testid="custom">{fields.length} campos</div>;
          }}
        </FormSection>,
      );

      expect(screen.getByTestId("custom")).toHaveTextContent("1 campos");
      expect(received.map((f) => f.name)).toEqual(["street"]);
    });
  });

  describe("id inexistente", () => {
    it("no rompe ni renderiza nada", () => {
      vi.spyOn(console, "warn").mockImplementation(() => {});
      const { container } = renderWith(<FormSection id="nope" />);
      expect(container).toBeEmptyDOMElement();
    });
  });
});
