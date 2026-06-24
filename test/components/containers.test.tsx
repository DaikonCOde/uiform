// Cobertura de contenedores (fieldset / group-array): el código más riesgoso y hasta ahora sin tests.
// Verificamos el round-trip anidado real vía <FormProvider> + <Field> contra el store. (REVIEW_V2.md §1 🔵)

import { describe, it, expect } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import type { StoreApi } from "zustand/vanilla";

import {
  FormProvider,
  useFormStoreApi,
} from "../../src/context/FormStoreContext";
import { Field } from "../../src/components/form/Field";
import type { FormState } from "../../src/store/types";
import type { JsfObjectSchema } from "@laus/json-schema-form";

// Schema con un fieldset (objeto anidado, hijos text+number) y un group-array (items con hijos text+number).
const schema: JsfObjectSchema = {
  type: "object",
  properties: {
    address: {
      type: "object",
      title: "Address",
      "x-jsf-presentation": { inputType: "fieldset" },
      properties: {
        street: {
          type: "string",
          title: "Street",
          "x-jsf-presentation": { inputType: "text" },
        },
        zip: {
          type: "number",
          title: "Zip",
          "x-jsf-presentation": { inputType: "number" },
        },
      },
    },
    contacts: {
      type: "array",
      title: "Contacts",
      "x-jsf-presentation": { inputType: "group-array" },
      items: {
        type: "object",
        properties: {
          fullname: {
            type: "string",
            title: "Full name",
            "x-jsf-presentation": { inputType: "text" },
          },
          age: {
            type: "number",
            title: "Age",
            "x-jsf-presentation": { inputType: "number" },
          },
        },
      },
    },
  },
} as JsfObjectSchema;

// Captura la ref cruda del store para leer/escribir el estado real en las aserciones.
function StoreCapture({
  onStore,
}: {
  onStore: (s: StoreApi<FormState>) => void;
}) {
  const store = useFormStoreApi();
  onStore(store);
  return null;
}

// Monta los dos contenedores por el controlador. Devuelve un getter del store para inspeccionar values.
function renderForm(initialValues?: Record<string, unknown>) {
  let store!: StoreApi<FormState>;
  const utils = render(
    <FormProvider schema={schema} initialValues={initialValues}>
      <StoreCapture onStore={(s) => (store = s)} />
      <Field name="address" />
      <Field name="contacts" />
    </FormProvider>,
  );
  return { ...utils, getStore: () => store };
}

describe("contenedores manejados por <Field> (fieldset + group-array)", () => {
  describe("fieldset (objeto anidado)", () => {
    it("renderiza el contenedor y sus hijos (labels presentes)", () => {
      renderForm();
      expect(screen.getByText("Address")).toBeInTheDocument();
      expect(screen.getByText("Street")).toBeInTheDocument();
      expect(screen.getByText("Zip")).toBeInTheDocument();
    });

    it("reconstruye los valores anidados desde initialValues en el store", () => {
      const { getStore } = renderForm({ address: { street: "Calle 1", zip: 1414 } });
      expect(getStore().getState().values.address).toEqual({
        street: "Calle 1",
        zip: 1414,
      });
    });

    it("tipear en un hijo hace round-trip con el path prefijado (address.street)", async () => {
      const user = userEvent.setup();
      const { getStore } = renderForm();

      const street = document.getElementById("address.street") as HTMLInputElement;
      await user.type(street, "Av Siempreviva");

      // El wrapper del fieldset reconstruye el objeto y el store lo guarda bajo address.street.
      expect(getStore().getState().values.address?.street).toBe("Av Siempreviva");
    });

    it("editar un hijo NO pisa a sus hermanos del mismo objeto", async () => {
      const user = userEvent.setup();
      const { getStore } = renderForm({ address: { street: "Calle 1", zip: 1414 } });

      const street = document.getElementById("address.street") as HTMLInputElement;
      await user.clear(street);
      await user.type(street, "Calle 2");

      expect(getStore().getState().values.address).toEqual({
        street: "Calle 2",
        zip: 1414, // el hermano sobrevive al cambio
      });
    });

    it("preserva falsy (0) en un hijo numérico anidado", () => {
      const { getStore } = renderForm({ address: { street: "", zip: 0 } });
      expect(getStore().getState().values.address?.zip).toBe(0);
      expect(getStore().getState().values.address?.street).toBe("");
    });
  });

  describe("group-array (array de objetos)", () => {
    it("renderiza vacío y muestra el botón de agregar", () => {
      renderForm();
      expect(screen.getByText("Contacts")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /agregar/i }),
      ).toBeInTheDocument();
    });

    it("reconstruye los items anidados desde initialValues en el store", () => {
      const { getStore } = renderForm({
        contacts: [{ fullname: "Ada", age: 36 }],
      });
      expect(getStore().getState().values.contacts).toEqual([
        { fullname: "Ada", age: 36 },
      ]);
    });

    it("agregar un item lo refleja en el array del store", async () => {
      const user = userEvent.setup();
      const { getStore } = renderForm();

      await user.click(screen.getByRole("button", { name: /agregar/i }));

      const contacts = getStore().getState().values.contacts;
      expect(Array.isArray(contacts)).toBe(true);
      expect(contacts).toHaveLength(1);
    });

    it("tipear en un hijo del item hace round-trip con el path prefijado (contacts.0.fullname)", async () => {
      const user = userEvent.setup();
      const { getStore } = renderForm({ contacts: [{ fullname: "", age: null }] });

      const fullname = document.getElementById(
        "contacts.0.fullname",
      ) as HTMLInputElement;
      await user.type(fullname, "Grace");

      expect(getStore().getState().values.contacts?.[0]?.fullname).toBe("Grace");
    });

    it("editar un hijo del item NO pisa a los otros campos del mismo item", async () => {
      const user = userEvent.setup();
      const { getStore } = renderForm({
        contacts: [{ fullname: "Grace", age: 0 }],
      });

      const fullname = document.getElementById(
        "contacts.0.fullname",
      ) as HTMLInputElement;
      await user.clear(fullname);
      await user.type(fullname, "Hopper");

      expect(getStore().getState().values.contacts?.[0]).toEqual({
        fullname: "Hopper",
        age: 0, // hermano falsy (0) preservado
      });
    });

    it("remover un item lo saca del array del store", async () => {
      const user = userEvent.setup();
      const { getStore } = renderForm({
        contacts: [{ fullname: "A", age: 1 }, { fullname: "B", age: 2 }],
      });

      expect(getStore().getState().values.contacts).toHaveLength(2);

      // confirmDelete=true por default → el botón abre un Popconfirm; confirmamos con "Sí".
      const deleteButtons = screen.getAllByRole("button", { name: /eliminar/i });
      await user.click(deleteButtons[0]);
      await user.click(screen.getByRole("button", { name: /^sí$/i }));

      const contacts = getStore().getState().values.contacts;
      expect(contacts).toHaveLength(1);
      expect(contacts?.[0]?.fullname).toBe("B");
    });

    it("la React key del item es estable: editar el contenido no remonta la fila (mantiene foco)", async () => {
      const user = userEvent.setup();
      const { getStore } = renderForm();

      await user.click(screen.getByRole("button", { name: /agregar/i }));

      const fullname = document.getElementById(
        "contacts.0.fullname",
      ) as HTMLInputElement;
      fullname.focus();
      expect(document.activeElement).toBe(fullname);

      await user.type(fullname, "Linus");

      // Si la key dependiera de un valor editable, el input se remontaría y perdería el foco.
      expect(document.activeElement).toBe(
        document.getElementById("contacts.0.fullname"),
      );
      expect(getStore().getState().values.contacts?.[0]?.fullname).toBe("Linus");
    });

    it("key estable aunque el item tenga un campo `id` editable: editar `id` no remonta la fila", async () => {
      // Regresión directa: con la key vieja (`item.id || ...`) editar el campo `id` cambiaba la key y
      // remontaba el input, perdiendo el foco. Con la key sintética interna, el foco sobrevive.
      const idSchema: JsfObjectSchema = {
        type: "object",
        properties: {
          rows: {
            type: "array",
            title: "Rows",
            "x-jsf-presentation": { inputType: "group-array" },
            items: {
              type: "object",
              properties: {
                id: {
                  type: "string",
                  title: "ID",
                  "x-jsf-presentation": { inputType: "text" },
                },
              },
            },
          },
        },
      } as JsfObjectSchema;

      const user = userEvent.setup();
      let store!: StoreApi<FormState>;
      render(
        <FormProvider schema={idSchema}>
          <StoreCapture onStore={(s) => (store = s)} />
          <Field name="rows" />
        </FormProvider>,
      );

      await user.click(screen.getByRole("button", { name: /agregar/i }));
      const idInput = document.getElementById("rows.0.id") as HTMLInputElement;
      idInput.focus();
      await user.type(idInput, "abc");

      // El foco sigue en el mismo input físico (no se remontó pese a editar el valor que era la key).
      expect(document.activeElement).toBe(document.getElementById("rows.0.id"));
      expect(store.getState().values.rows?.[0]?.id).toBe("abc");
    });
  });

  describe("strip de props internas del motor (omitEngineProps en el controlador)", () => {
    it("no filtra props internas (type/jsonType/isVisible) al DOM de los hijos", () => {
      renderForm({ address: { street: "x", zip: 1 } });
      const street = document.getElementById("address.street") as HTMLInputElement;
      // Props internas del motor no deben aterrizar como atributos del input nativo.
      expect(street.getAttribute("jsonType")).toBeNull();
      expect(street.getAttribute("isVisible")).toBeNull();
    });
  });

  describe("setValue programático (store → contenedor)", () => {
    it("setear un path anidado se refleja en el value del hijo del fieldset", () => {
      const { getStore } = renderForm();
      act(() => getStore().getState().setValue("address.street", "Desde el store"));
      expect(
        (document.getElementById("address.street") as HTMLInputElement).value,
      ).toBe("Desde el store");
    });
  });
});
