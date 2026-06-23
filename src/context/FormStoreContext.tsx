// Context que guarda SOLO la referencia al store (estable → nunca re-renderiza por sí mismo) + Provider y hook base. (ARCHITECTURE_V2.md §4)

import {
  createContext,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
// Zustand 5 quitó el arg de igualdad de `useStore`; el idiom v5 con equalityFn opcional vive en /traditional.
import { useStoreWithEqualityFn } from "zustand/traditional";
import type { StoreApi } from "zustand/vanilla";

import { createFormStore } from "../store/createFormStore";
import type {
  FormState,
  FormStoreOptions,
  JsfObjectSchema,
  UiSchema,
} from "../store/types";

// El valor del Context es la ref al store (no el estado): así el Context nunca dispara re-renders. (§4)
const FormStoreContext = createContext<StoreApi<FormState> | null>(null);

/** Props del Provider: los dos documentos (schema + uiSchema) y las opciones del store. */
export interface FormProviderProps extends FormStoreOptions {
  schema: JsfObjectSchema;
  uiSchema?: UiSchema;
  children: ReactNode;
}

/** Crea UN store por instancia y lo expone vía Context; lo recrea solo si cambia la key por valor. */
export function FormProvider({
  schema,
  uiSchema = {},
  children,
  ...opts
}: FormProviderProps) {
  const storeRef = useRef<StoreApi<FormState> | null>(null);

  // Key por valor: recrear el store solo si schema/uiSchema/initialValues cambian de verdad (no por refs nuevas). (§4, riesgo #3)
  const key = useMemo(
    () => JSON.stringify({ schema, uiSchema, initialValues: opts.initialValues }),
    [schema, uiSchema, opts.initialValues],
  );
  const prevKey = useRef(key);

  // useRef evita recrear el store en el doble render de StrictMode. (ARCHITECTURE_V2.md riesgo #2)
  if (!storeRef.current) storeRef.current = createFormStore(schema, uiSchema, opts);
  if (prevKey.current !== key) {
    storeRef.current = createFormStore(schema, uiSchema, opts);
    prevKey.current = key;
  }

  return (
    <FormStoreContext.Provider value={storeRef.current}>
      {children}
    </FormStoreContext.Provider>
  );
}

/** Hook base: conecta un selector al store de esta instancia (suscripción granular). (ARCHITECTURE_V2.md §5) */
export function useFormStore<T>(
  selector: (s: FormState) => T,
  eq?: (a: T, b: T) => boolean,
): T {
  const store = useContext(FormStoreContext);
  if (!store) {
    throw new Error("useFormStore debe usarse dentro de <FormProvider>");
  }
  return useStoreWithEqualityFn(store, selector, eq);
}

// Export interno para tests/hooks que necesiten la ref cruda del store. No es API pública.
export { FormStoreContext };
