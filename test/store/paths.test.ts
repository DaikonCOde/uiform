import { describe, it, expect } from "vitest";
import { getPath, setPath } from "../../src/store/paths";

describe("getPath", () => {
  it("lee un valor de nivel superior", () => {
    expect(getPath({ name: "ada" }, "name")).toBe("ada");
  });

  it("lee un valor anidado por dot-path", () => {
    expect(getPath({ address: { street: "main" } }, "address.street")).toBe(
      "main"
    );
  });

  it("lee un índice de array con notación [n] y .n", () => {
    const obj = { items: [{ price: 10 }, { price: 20 }] };
    expect(getPath(obj, "items[1].price")).toBe(20);
    expect(getPath(obj, "items.1.price")).toBe(20);
  });

  it("devuelve undefined si un segmento no existe (sin lanzar)", () => {
    expect(getPath({ a: {} }, "a.b.c")).toBeUndefined();
    expect(getPath({}, "x.y")).toBeUndefined();
  });
});

describe("setPath", () => {
  it("setea un valor anidado y lo devuelve en el nuevo objeto", () => {
    const next = setPath({ address: { street: "old" } }, "address.street", "new");
    expect(getPath(next, "address.street")).toBe("new");
  });

  it("no muta el original", () => {
    const original = { address: { street: "old" } };
    const next = setPath(original, "address.street", "new");
    expect(original.address.street).toBe("old");
    expect(next).not.toBe(original);
  });

  it("clona solo la rama tocada; los hermanos conservan su referencia", () => {
    const original = {
      address: { street: "old" },
      contact: { email: "a@b.com" },
    };
    const next = setPath(original, "address.street", "new");

    // La rama modificada tiene refs nuevas...
    expect(next.address).not.toBe(original.address);
    // ...pero el hermano intacto conserva su referencia (clave para suscripción granular).
    expect(next.contact).toBe(original.contact);
  });

  it("crea ramas de objeto faltantes (clave no numérica)", () => {
    const next = setPath({}, "a.b.c", 1);
    expect(next).toEqual({ a: { b: { c: 1 } } });
  });

  it("crea ramas de array faltantes (clave numérica)", () => {
    const next = setPath({}, "items.0.price", 5);
    expect(Array.isArray(next.items)).toBe(true);
    expect(next.items[0].price).toBe(5);
  });

  it("crea ramas de array con notación [n]", () => {
    const next = setPath({}, "items[0].price", 5);
    expect(Array.isArray(next.items)).toBe(true);
    expect(next.items[0].price).toBe(5);
  });

  it("preserva valores falsy (0, false, cadena vacía)", () => {
    expect(getPath(setPath({}, "a", 0), "a")).toBe(0);
    expect(getPath(setPath({}, "a", false), "a")).toBe(false);
    expect(getPath(setPath({}, "a", ""), "a")).toBe("");
  });
});
