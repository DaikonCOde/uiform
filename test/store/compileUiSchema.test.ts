// Tests del compilador uiSchema → x-jsf-* (ARCHITECTURE_V2.md §1 ter): cada regla de la tabla de mapeo aislada.

import { describe, it, expect, vi, afterEach } from "vitest";
import { compileUiSchema } from "../../src/store/compileUiSchema";
import type { JsfObjectSchema } from "@laus/json-schema-form";
import type { UiSchema } from "../../src/store/types";

/** Schema base reusable: un objeto con dos campos simples. */
function baseSchema(): JsfObjectSchema {
  return {
    type: "object",
    properties: {
      name: { type: "string", title: "Nombre" },
      avatar: { type: "string" },
    },
  };
}

function presentationOf(schema: JsfObjectSchema, field: string): Record<string, unknown> {
  const prop = schema.properties?.[field] as { "x-jsf-presentation"?: Record<string, unknown> };
  return prop["x-jsf-presentation"] ?? {};
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("compileUiSchema", () => {
  describe("sin uiSchema", () => {
    it("devuelve un clon estructuralmente igual al input cuando no hay uiSchema", () => {
      const schema = baseSchema();
      const out = compileUiSchema(schema);

      expect(out).toEqual(schema);
      expect(out).not.toBe(schema); // es un clon, no la misma referencia
    });

    it("devuelve un clon igual cuando el uiSchema está vacío", () => {
      const schema = baseSchema();
      const out = compileUiSchema(schema, {});

      expect(out).toEqual(schema);
      expect(out).not.toBe(schema);
    });
  });

  describe("inmutabilidad del input", () => {
    it("no muta el schema original al compilar", () => {
      const schema = baseSchema();
      const snapshot = structuredClone(schema);

      compileUiSchema(schema, {
        name: { "ui:widget": "text", "ui:placeholder": "Tu nombre" },
        "ui:order": ["name", "avatar"],
      } as UiSchema);

      expect(schema).toEqual(snapshot);
    });
  });

  describe("tabla de mapeo por campo", () => {
    it("ui:widget → x-jsf-presentation.inputType", () => {
      const out = compileUiSchema(baseSchema(), {
        name: { "ui:widget": "textarea" },
      } as UiSchema);

      expect(presentationOf(out, "name").inputType).toBe("textarea");
    });

    it("ui:placeholder → x-jsf-presentation.placeholder", () => {
      const out = compileUiSchema(baseSchema(), {
        name: { "ui:placeholder": "Escribí acá" },
      } as UiSchema);

      expect(presentationOf(out, "name").placeholder).toBe("Escribí acá");
    });

    it("ui:autofocus → x-jsf-presentation.autofocus", () => {
      const out = compileUiSchema(baseSchema(), {
        name: { "ui:autofocus": true },
      } as UiSchema);

      expect(presentationOf(out, "name").autofocus).toBe(true);
    });

    it("ui:disabled → x-jsf-presentation.disabled", () => {
      const out = compileUiSchema(baseSchema(), {
        name: { "ui:disabled": true },
      } as UiSchema);

      expect(presentationOf(out, "name").disabled).toBe(true);
    });

    it("ui:description → x-jsf-presentation.description", () => {
      const out = compileUiSchema(baseSchema(), {
        name: { "ui:description": "Tu nombre legal" },
      } as UiSchema);

      expect(presentationOf(out, "name").description).toBe("Tu nombre legal");
    });

    it("ui:title → property.title (override del label, semántica RJSF)", () => {
      const out = compileUiSchema(baseSchema(), {
        name: { "ui:title": "Nombre completo" },
      } as UiSchema);

      const prop = out.properties?.name as { title?: string };
      expect(prop.title).toBe("Nombre completo");
    });

    it("ui:options.* se splatea clave por clave en x-jsf-presentation", () => {
      const out = compileUiSchema(baseSchema(), {
        avatar: {
          "ui:widget": "file",
          "ui:options": { accept: "image/*", maxFileSize: 1024, multiple: true },
        },
      } as UiSchema);

      const p = presentationOf(out, "avatar");
      expect(p.inputType).toBe("file");
      expect(p.accept).toBe("image/*");
      expect(p.maxFileSize).toBe(1024);
      expect(p.multiple).toBe(true);
    });

    it("preserva el x-jsf-presentation previo y deja que el uiSchema tenga precedencia al mergear", () => {
      const schema = baseSchema();
      (schema.properties!.name as Record<string, unknown>)["x-jsf-presentation"] = {
        inputType: "text",
        accept: "viejo",
      };

      const out = compileUiSchema(schema, {
        name: { "ui:widget": "textarea" }, // override de inputType
      } as UiSchema);

      const p = presentationOf(out, "name");
      expect(p.inputType).toBe("textarea"); // gana el uiSchema
      expect(p.accept).toBe("viejo"); // lo previo no se pierde
    });
  });

  describe("nivel raíz", () => {
    it("ui:sections → schema['x-jsf-sections'] (copia verbatim)", () => {
      const sections = [{ id: "personal", title: "Datos", fields: ["name"] }];
      const out = compileUiSchema(baseSchema(), {
        "ui:sections": sections,
      } as UiSchema);

      expect((out as Record<string, unknown>)["x-jsf-sections"]).toEqual(sections);
    });

    it("ui:order → schema['x-jsf-order']", () => {
      const out = compileUiSchema(baseSchema(), {
        "ui:order": ["avatar", "name"],
      } as UiSchema);

      expect(out["x-jsf-order"]).toEqual(["avatar", "name"]);
    });
  });

  describe("fieldsets anidados", () => {
    it("baja las claves ui:* de hijos de un objeto a su x-jsf-presentation", () => {
      const schema: JsfObjectSchema = {
        type: "object",
        properties: {
          address: {
            type: "object",
            properties: {
              street: { type: "string" },
              city: { type: "string" },
            },
          },
        },
      };

      const out = compileUiSchema(schema, {
        address: {
          "ui:order": ["street", "city"],
          street: { "ui:widget": "text", "ui:placeholder": "Calle" },
          city: { "ui:widget": "select" },
        },
      } as UiSchema);

      const address = out.properties?.address as JsfObjectSchema;
      expect(address["x-jsf-order"]).toEqual(["street", "city"]);

      const street = address.properties?.street as { "x-jsf-presentation"?: Record<string, unknown> };
      expect(street["x-jsf-presentation"]?.inputType).toBe("text");
      expect(street["x-jsf-presentation"]?.placeholder).toBe("Calle");

      const city = address.properties?.city as { "x-jsf-presentation"?: Record<string, unknown> };
      expect(city["x-jsf-presentation"]?.inputType).toBe("select");
    });
  });

  describe("robustez", () => {
    it("avisa (console.warn) y no lanza cuando el uiSchema referencia un name inexistente", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

      const call = () =>
        compileUiSchema(baseSchema(), {
          inexistente: { "ui:widget": "text" },
        } as UiSchema);

      expect(call).not.toThrow();
      expect(warn).toHaveBeenCalledOnce();
      expect(warn.mock.calls[0][0]).toContain("inexistente");
    });

    it("no toca campos no referenciados por el uiSchema", () => {
      const out = compileUiSchema(baseSchema(), {
        name: { "ui:widget": "text" },
      } as UiSchema);

      const avatar = out.properties?.avatar as { "x-jsf-presentation"?: unknown };
      expect(avatar["x-jsf-presentation"]).toBeUndefined();
    });
  });
});
