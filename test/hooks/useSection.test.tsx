// Tests de useSections/useSection (ARCHITECTURE_V2.md §5/§6): metadata de secciones, id inexistente → warn sin romper.

import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, render, act } from "@testing-library/react";
import React from "react";

import { FormProvider, useFormStore } from "../../src/context/FormStoreContext";
import { useSection } from "../../src/hooks/useSection";
import { useSections } from "../../src/hooks/useSections";
import type { JsfObjectSchema } from "@laus/json-schema-form";
import type { UiSchema } from "../../src/store/types";

// Schema (solo dato) + uiSchema con DOS secciones autoradas en ui:sections (presentación pura). (§6)
const schema: JsfObjectSchema = {
  type: "object",
  properties: {
    firstName: { type: "string", "x-jsf-presentation": { inputType: "text" } },
    lastName: { type: "string", "x-jsf-presentation": { inputType: "text" } },
    street: { type: "string", "x-jsf-presentation": { inputType: "text" } },
  },
} as JsfObjectSchema;

const uiSchema: UiSchema = {
  "ui:sections": [
    { id: "personal", title: "Datos personales", fields: ["firstName", "lastName"] },
    { id: "address", title: "Dirección", fields: ["street"] },
  ],
};

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <FormProvider schema={schema} uiSchema={uiSchema}>
      {children}
    </FormProvider>
  );
}

afterEach(() => vi.restoreAllMocks());

describe("useSections", () => {
  it("devuelve las secciones autoradas, en orden", () => {
    const { result } = renderHook(() => useSections(), { wrapper });
    expect(result.current.map((s) => s.id)).toEqual(["personal", "address"]);
  });
});

describe("useSection", () => {
  it("devuelve la sección por id con sus fields resueltos", () => {
    const { result } = renderHook(() => useSection("personal"), { wrapper });
    expect(result.current.section?.id).toBe("personal");
    expect(result.current.section?.title).toBe("Datos personales");
    expect(result.current.fields.map((f) => f.name)).toEqual([
      "firstName",
      "lastName",
    ]);
  });

  it("id inexistente → console.warn y { section: undefined, fields: [] } sin throw", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { result } = renderHook(() => useSection("nope-unico"), { wrapper });

    expect(result.current.section).toBeUndefined();
    expect(result.current.fields).toEqual([]);
    expect(warn).toHaveBeenCalled();
  });
});

// El claim central de la Fase 5: la metadata de secciones es estructura estable → tipear NO re-renderiza.
describe("aislamiento de re-render (§5/§6)", () => {
  it("tipear un campo NO re-renderiza a un consumidor de useSection", () => {
    const renders = { n: 0 };
    let setValue!: (name: string, v: unknown) => void;

    function Capture() {
      setValue = useFormStore((s) => s.setValue);
      return null;
    }
    function SectionConsumer() {
      renders.n += 1;
      const { section } = useSection("personal");
      return <span>{section?.id}</span>;
    }

    render(
      <FormProvider schema={schema} uiSchema={uiSchema}>
        <Capture />
        <SectionConsumer />
      </FormProvider>,
    );

    const before = renders.n;
    act(() => setValue("firstName", "Lautaro"));
    expect(renders.n).toBe(before); // sections es ref estable → cero re-render por tipeo
  });
});
