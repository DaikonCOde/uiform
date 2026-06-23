import { describe, it, expect, vi, afterEach } from "vitest";
import { resolveSections, indexByName } from "../../src/store/resolveSections";
import type { Field, JsfObjectSchema } from "../../src/store/types";

// Helper: Field mínimo; resolveSections solo usa `name`.
const f = (name: string) => ({ name, inputType: "text" } as unknown as Field);

// Construye un schema interno con la clave x-jsf-sections que emite el compilador.
const schemaWith = (
  sections?: Array<{
    id: string;
    title?: string;
    description?: string;
    fields: string[];
  }>
) =>
  ({
    type: "object",
    properties: {},
    ...(sections ? { "x-jsf-sections": sections } : {}),
  } as unknown as JsfObjectSchema);

afterEach(() => {
  vi.restoreAllMocks();
});

describe("indexByName", () => {
  it("arma un lookup por name de cada field", () => {
    const a = f("a");
    const b = f("b");
    const index = indexByName([a, b]);

    expect(index.a).toBe(a);
    expect(index.b).toBe(b);
    expect(Object.keys(index)).toEqual(["a", "b"]);
  });

  it("devuelve un objeto vacío sin fields", () => {
    expect(indexByName([])).toEqual({});
  });
});

describe("resolveSections", () => {
  it("preserva el orden de los fields dentro de una sección", () => {
    const fields = [f("email"), f("firstName"), f("lastName")];
    const schema = schemaWith([
      {
        id: "personal",
        title: "Datos personales",
        // Orden distinto al de `fields` → debe respetar el de la sección.
        fields: ["firstName", "lastName", "email"],
      },
    ]);

    const [section] = resolveSections(schema, fields);

    expect(section.id).toBe("personal");
    expect(section.title).toBe("Datos personales");
    expect(section.fieldNames).toEqual(["firstName", "lastName", "email"]);
    expect(section.fields.map((x) => x.name)).toEqual([
      "firstName",
      "lastName",
      "email",
    ]);
  });

  it("agrupa los fields no referenciados en una sección __default__ al final", () => {
    const fields = [f("a"), f("b"), f("c"), f("d")];
    const schema = schemaWith([{ id: "s1", fields: ["b", "a"] }]);

    const result = resolveSections(schema, fields);

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("s1");
    const trailing = result[1];
    expect(trailing.id).toBe("__default__");
    // Los sobrantes conservan su orden original (c antes que d).
    expect(trailing.fieldNames).toEqual(["c", "d"]);
    expect(trailing.fields.map((x) => x.name)).toEqual(["c", "d"]);
  });

  it("no agrega __default__ si todas las secciones cubren todos los fields", () => {
    const fields = [f("a"), f("b")];
    const schema = schemaWith([{ id: "s1", fields: ["a", "b"] }]);

    const result = resolveSections(schema, fields);

    expect(result).toHaveLength(1);
    expect(result.some((s) => s.id === "__default__")).toBe(false);
  });

  it("avisa con console.warn y saltea un name inexistente, manteniendo el resto", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const fields = [f("a"), f("b")];
    const schema = schemaWith([{ id: "s1", fields: ["a", "ghost", "b"] }]);

    const result = resolveSections(schema, fields);

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain("ghost");
    // El name fantasma se omite; el resto queda intacto y sin lanzar.
    expect(result[0].fieldNames).toEqual(["a", "b"]);
    expect(result[0].fields.map((x) => x.name)).toEqual(["a", "b"]);
  });

  it("no lanza cuando una sección referencia solo names inexistentes", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const fields = [f("a")];
    const schema = schemaWith([{ id: "empty", fields: ["x", "y"] }]);

    expect(() => resolveSections(schema, fields)).not.toThrow();
    const result = resolveSections(schema, fields);

    // La sección queda vacía; `a` cae en __default__.
    expect(result[0].id).toBe("empty");
    expect(result[0].fields).toEqual([]);
    expect(result[1].id).toBe("__default__");
    expect(result[1].fieldNames).toEqual(["a"]);
  });

  it("sección sin `fields` (malformada) → warn, no throw, el resto intacto", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const fields = [f("a"), f("b")];
    // Primera sección sin `fields` (uiSchema malformado); la segunda bien formada.
    const schema = schemaWith([
      { id: "broken" } as unknown as { id: string; fields: string[] },
      { id: "ok", fields: ["a", "b"] },
    ]);

    let result!: ReturnType<typeof resolveSections>;
    expect(() => {
      result = resolveSections(schema, fields);
    }).not.toThrow();

    expect(warn).toHaveBeenCalled();
    expect(warn.mock.calls.some((c) => String(c[0]).includes("broken"))).toBe(true);

    // La sección rota queda vacía; la sección válida conserva sus campos.
    const broken = result.find((s) => s.id === "broken")!;
    const ok = result.find((s) => s.id === "ok")!;
    expect(broken.fields).toEqual([]);
    expect(broken.fieldNames).toEqual([]);
    expect(ok.fieldNames).toEqual(["a", "b"]);
  });

  it("sección con `fields` no-array → warn, no throw", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const fields = [f("a")];
    const schema = schemaWith([
      { id: "bad", fields: "a" } as unknown as { id: string; fields: string[] },
    ]);

    expect(() => resolveSections(schema, fields)).not.toThrow();
    expect(warn).toHaveBeenCalled();
    const result = resolveSections(schema, fields);
    expect(result.find((s) => s.id === "bad")!.fields).toEqual([]);
  });

  it("sin x-jsf-sections → una única sección __default__ con todos los fields en orden", () => {
    const fields = [f("a"), f("b"), f("c")];

    const result = resolveSections(schemaWith(), fields);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("__default__");
    expect(result[0].fieldNames).toEqual(["a", "b", "c"]);
    expect(result[0].fields.map((x) => x.name)).toEqual(["a", "b", "c"]);
  });

  it("x-jsf-sections vacío se trata como ausente (un solo __default__)", () => {
    const fields = [f("a")];

    const result = resolveSections(schemaWith([]), fields);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("__default__");
    expect(result[0].fieldNames).toEqual(["a"]);
  });
});
