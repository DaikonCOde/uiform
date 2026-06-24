// Tests del grid responsivo (feature): layout global, override por sección, colSpan por campo, gap default.

import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";

import { FormProvider } from "../../src/context/FormStoreContext";
import { FormSection } from "../../src/components/form/FormSection";
import type { JsfObjectSchema } from "@laus/json-schema-form";
import type { UiSchema, FormLayout } from "../../src/store/types";

afterEach(cleanup);

const schema: JsfObjectSchema = {
  type: "object",
  properties: {
    a: { type: "string", title: "A", "x-jsf-presentation": { inputType: "text" } },
    b: { type: "string", title: "B", "x-jsf-presentation": { inputType: "text" } },
  },
} as JsfObjectSchema;

// Todo el CSS inyectado por useGridCSS (los <style> del <head>).
function injectedCSS(): string {
  return Array.from(document.querySelectorAll("style"))
    .map((s) => s.textContent || "")
    .join("\n");
}

describe("grid responsivo", () => {
  it("layout GLOBAL aplica grid (columnas + gap default 16px)", () => {
    const layout: FormLayout = { columns: 2 };
    const ui: UiSchema = { "ui:sections": [{ id: "s", title: "S", fields: ["a", "b"] }] };
    render(
      <FormProvider schema={schema} uiSchema={ui} layout={layout}>
        <FormSection id="s" />
      </FormProvider>,
    );
    const css = injectedCSS();
    expect(css).toContain("display: grid");
    expect(css).toContain("grid-template-columns: repeat(2, 1fr)");
    expect(css).toContain("gap: 16px"); // default
  });

  it("ui:colSpan por campo genera `grid-column: span N` (el motor surfacea field.layout.colSpan)", () => {
    const ui: UiSchema = {
      "ui:sections": [{ id: "s", fields: ["a", "b"] }],
      a: { "ui:colSpan": 2 },
    };
    render(
      <FormProvider schema={schema} uiSchema={ui} layout={{ columns: 2 }}>
        <FormSection id="s" />
      </FormProvider>,
    );
    expect(injectedCSS()).toContain("grid-column: span 2");
  });

  it("la SECCIÓN puede overridear el layout global (columnas + gap propios)", () => {
    const ui: UiSchema = {
      "ui:sections": [{ id: "s", fields: ["a", "b"], layout: { columns: 3, gap: "8px" } }],
    };
    render(
      <FormProvider schema={schema} uiSchema={ui} layout={{ columns: 2 }}>
        <FormSection id="s" />
      </FormProvider>,
    );
    const css = injectedCSS();
    expect(css).toContain("grid-template-columns: repeat(3, 1fr)");
    expect(css).toContain("gap: 8px");
  });

  it("sin layout, no inyecta grid (campos apilados)", () => {
    const ui: UiSchema = { "ui:sections": [{ id: "s", fields: ["a", "b"] }] };
    render(
      <FormProvider schema={schema} uiSchema={ui}>
        <FormSection id="s" />
      </FormProvider>,
    );
    expect(injectedCSS()).not.toContain("display: grid");
  });

  it("responsive: sm base (sin media query) + md con @media min-width 768px", () => {
    const ui: UiSchema = {
      "ui:sections": [{ id: "s", fields: ["a", "b"], layout: { responsive: { sm: 1, md: 2 } } }],
    };
    render(
      <FormProvider schema={schema} uiSchema={ui}>
        <FormSection id="s" />
      </FormProvider>,
    );
    const css = injectedCSS();
    expect(css).toContain("grid-template-columns: repeat(1, 1fr)"); // base móvil
    expect(css).toContain("@media (min-width: 768px)");
    expect(css).toContain("repeat(2, 1fr)"); // md
  });

  it("responsive SIN `sm` cae a 1 columna en la base (mobile-first)", () => {
    const ui: UiSchema = {
      "ui:sections": [{ id: "s", fields: ["a", "b"], layout: { responsive: { md: 2 } } }],
    };
    render(
      <FormProvider schema={schema} uiSchema={ui}>
        <FormSection id="s" />
      </FormProvider>,
    );
    const css = injectedCSS();
    expect(css).toContain("grid-template-columns: repeat(1, 1fr)"); // sm=1 por fallback
    expect(css).toContain("@media (min-width: 768px)");
  });

  it("colSpan responsive por campo genera media queries", () => {
    const ui: UiSchema = {
      "ui:sections": [{ id: "s", fields: ["a", "b"] }],
      a: { "ui:colSpan": { sm: 1, md: 2 } },
    };
    render(
      <FormProvider schema={schema} uiSchema={ui} layout={{ columns: 2 }}>
        <FormSection id="s" />
      </FormProvider>,
    );
    const css = injectedCSS();
    expect(css).toContain("grid-column: span 1"); // sm
    expect(css).toMatch(/@media \(min-width: 768px\)[\s\S]*grid-column: span 2/); // md
  });

  it("columns inválido (0/negativo) se sanea a 1 (sin CSS basura)", () => {
    render(
      <FormProvider schema={schema} uiSchema={{ "ui:sections": [{ id: "s", fields: ["a", "b"] }] }} layout={{ columns: 0 }}>
        <FormSection id="s" />
      </FormProvider>,
    );
    expect(injectedCSS()).toContain("repeat(1, 1fr)");
  });

  it("limpia el <style> inyectado al desmontar", () => {
    const { unmount } = render(
      <FormProvider schema={schema} uiSchema={{ "ui:sections": [{ id: "s", fields: ["a", "b"] }] }} layout={{ columns: 2 }}>
        <FormSection id="s" />
      </FormProvider>,
    );
    expect(injectedCSS()).toContain("display: grid");
    unmount();
    expect(injectedCSS()).not.toContain("display: grid");
  });
});
