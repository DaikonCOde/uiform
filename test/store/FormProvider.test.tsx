// Tests del Provider (ARCHITECTURE_V2.md §4): el store sobrevive a re-renders idénticos y se recrea si cambia el schema.

import { describe, it, expect } from "vitest";
import { useContext } from "react";
import { render } from "@testing-library/react";
import {
  FormProvider,
  FormStoreContext,
} from "../../src/context/FormStoreContext";
import type { JsfObjectSchema } from "@laus/json-schema-form";
import type { StoreApi } from "zustand/vanilla";
import type { FormState } from "../../src/store/types";

const schemaA: JsfObjectSchema = {
  type: "object",
  properties: { a: { type: "string" } },
} as JsfObjectSchema;

const schemaB: JsfObjectSchema = {
  type: "object",
  properties: { b: { type: "string" } },
} as JsfObjectSchema;

/** Consumidor de prueba: captura la ref cruda del store en cada render. */
function Capture({ onStore }: { onStore: (s: StoreApi<FormState>) => void }) {
  const store = useContext(FormStoreContext);
  if (store) onStore(store);
  return null;
}

describe("FormProvider", () => {
  it("conserva la MISMA instancia de store ante un re-render con props idénticas", () => {
    const stores: StoreApi<FormState>[] = [];
    const onStore = (s: StoreApi<FormState>) => stores.push(s);

    const { rerender } = render(
      <FormProvider schema={schemaA}>
        <Capture onStore={onStore} />
      </FormProvider>,
    );

    rerender(
      <FormProvider schema={schemaA}>
        <Capture onStore={onStore} />
      </FormProvider>,
    );

    expect(stores.length).toBeGreaterThanOrEqual(2);
    expect(stores[stores.length - 1]).toBe(stores[0]);
  });

  it("RECREA el store cuando cambia el schema (key por valor distinta)", () => {
    const stores: StoreApi<FormState>[] = [];
    const onStore = (s: StoreApi<FormState>) => stores.push(s);

    const { rerender } = render(
      <FormProvider schema={schemaA}>
        <Capture onStore={onStore} />
      </FormProvider>,
    );
    const first = stores[stores.length - 1];

    rerender(
      <FormProvider schema={schemaB}>
        <Capture onStore={onStore} />
      </FormProvider>,
    );
    const second = stores[stores.length - 1];

    expect(second).not.toBe(first);
    // Prueba dura: el store nuevo refleja el schema nuevo (campo "b", no "a").
    expect(second.getState().fieldsByName).toHaveProperty("b");
    expect(second.getState().fieldsByName).not.toHaveProperty("a");
  });
});
