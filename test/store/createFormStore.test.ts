// Tests del store (ARCHITECTURE_V2.md §3): defaults falsy, paths anidados, validate, submit condicional, reset, async.

import { describe, it, expect, vi } from "vitest";
import { createFormStore } from "../../src/store/createFormStore";
import type { JsfObjectSchema } from "@laus/json-schema-form";
import type { FormStoreOptions } from "../../src/store/types";

/** Schema con un número (default 0), un booleano (default false) y un string requerido vacío. */
function schema(): JsfObjectSchema {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      age: { type: "number", default: 0, "x-jsf-presentation": { inputType: "number" } },
      accept: { type: "boolean", default: false, "x-jsf-presentation": { inputType: "checkbox" } },
      name: { type: "string", "x-jsf-presentation": { inputType: "text" } },
      address: {
        type: "object",
        "x-jsf-presentation": { inputType: "fieldset" },
        properties: {
          street: { type: "string", "x-jsf-presentation": { inputType: "text" } },
        },
      },
    },
    required: ["name"],
  } as JsfObjectSchema;
}

function makeStore(opts: FormStoreOptions = {}) {
  return createFormStore(schema(), undefined, opts);
}

describe("createFormStore", () => {
  it("incluye valores por defecto falsy (number 0, checkbox false)", () => {
    const store = makeStore();
    const { values } = store.getState();
    expect(values.age).toBe(0);
    expect(values.accept).toBe(false);
  });

  it("setValue con path anidado actualiza values de forma inmutable", () => {
    const store = makeStore();
    const before = store.getState().values;

    store.getState().setValue("address.street", "Av. Siempre Viva 742");

    const after = store.getState().values;
    expect(after.address.street).toBe("Av. Siempre Viva 742");
    // El objeto raíz y la rama tocada son refs nuevas (suscripción granular por igualdad referencial).
    expect(after).not.toBe(before);
    expect(after.address).not.toBe(before.address);
    expect(before.address.street).toBe("");
  });

  it("validate() puebla errores para un campo requerido vacío y los devuelve", () => {
    const store = makeStore();
    const errors = store.getState().validate();
    expect(Object.keys(errors).length).toBeGreaterThan(0);
    expect(errors).toHaveProperty("name");
    expect(store.getState().errors).toEqual(errors);
  });

  it("submit() llama onSubmit solo cuando NO hay errores", async () => {
    const onSubmit = vi.fn();
    const store = makeStore({ onSubmit });

    // name requerido sigue vacío → validación falla → no se envía.
    await store.getState().submit();
    expect(onSubmit).not.toHaveBeenCalled();
    expect(store.getState().submitted).toBe(true);
    expect(store.getState().isSubmitting).toBe(false);

    // Completamos el requerido → ahora sí debe enviar.
    store.getState().setValue("name", "Laus");
    await store.getState().submit();
    expect(onSubmit).toHaveBeenCalledTimes(1);
    const [payload] = onSubmit.mock.calls[0];
    expect(payload).toMatchObject({ name: "Laus", age: 0, accept: false });
  });

  it("reset() restaura defaults y limpia errors/touched/submitted", () => {
    const store = makeStore();
    store.getState().setValue("name", "temporal");
    store.getState().setTouched("name");
    store.getState().validate();
    store.getState().submit();

    store.getState().reset();
    const s = store.getState();
    expect(s.values.name).toBe("");
    expect(s.values.age).toBe(0);
    expect(s.errors).toEqual({});
    expect(s.touched).toEqual({});
    expect(s.submitted).toBe(false);
  });

  it("loadAsyncOptions puebla store.async[id].options vía el loader provisto", async () => {
    const loader = vi.fn(async () => ({
      options: [{ label: "Uno", value: 1 }],
    }));
    const store = makeStore({ asyncLoaders: { cities: loader } });

    await store.getState().loadAsyncOptions("cities", "u");

    expect(loader).toHaveBeenCalledWith({ formValues: expect.any(Object), search: "u" });
    const slice = store.getState().async.cities;
    expect(slice.loading).toBe(false);
    expect(slice.error).toBeNull();
    expect(slice.options).toEqual([{ label: "Uno", value: 1 }]);
  });

  it("validateTrigger 'onChange' valida en cada setValue", () => {
    const store = makeStore({ config: { validateTrigger: "onChange" } });
    // Tocar un campo cualquiera dispara validate → el requerido vacío genera error.
    store.getState().setValue("age", 5);
    expect(store.getState().errors).toHaveProperty("name");
  });

  it("con validateTrigger 'onChange' el onChange recibe errores FRESCOS tras tipear inválido", () => {
    const onChange = vi.fn();
    const store = makeStore({ onChange, config: { validateTrigger: "onChange" } });

    // name requerido sigue vacío; tipear otro campo dispara validate ANTES del onChange →
    // los errors entregados ya reflejan el requerido faltante. (contrato de createFormStore)
    store.getState().setValue("age", 7);

    expect(onChange).toHaveBeenCalledTimes(1);
    const [, errors] = onChange.mock.calls[0];
    expect(errors).toHaveProperty("name");
  });

  it("con validateTrigger 'onSubmit' el onChange NO valida en cada tecla (errors {} hasta submit)", async () => {
    const onChange = vi.fn();
    const store = makeStore({ onChange, config: { validateTrigger: "onSubmit" } });

    // Sin trigger onChange, setValue NO corre validate → errors quedan en su último valor ({}).
    store.getState().setValue("age", 7);
    store.getState().setValue("age", 8);

    expect(onChange).toHaveBeenCalledTimes(2);
    for (const call of onChange.mock.calls) {
      expect(call[1]).toEqual({});
    }
    expect(store.getState().errors).toEqual({});

    // Recién al hacer submit se valida y aparecen los errores del requerido vacío.
    await store.getState().submit();
    expect(store.getState().errors).toHaveProperty("name");
  });
});
