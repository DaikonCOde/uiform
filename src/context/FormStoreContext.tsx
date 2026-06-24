// Context que guarda SOLO la referencia al store (estable → nunca re-renderiza por sí mismo) + Provider y hook base. (ARCHITECTURE_V2.md §4)

import {
  createContext,
  useContext,
  useMemo,
  useRef,
  type ComponentType,
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

/** Registry de componentes custom por `ui:widget`/inputType: el consumidor reemplaza/agrega widgets. */
export type FieldComponents = Partial<Record<string, ComponentType<any>>>;

// El valor del Context es la ref al store (no el estado): así el Context nunca dispara re-renders. (§4)
const FormStoreContext = createContext<StoreApi<FormState> | null>(null);
// Registry de componentes custom (vacío por default). Lo lee el controlador <Field>. (fix casos de uso: widgets)
const FieldComponentsContext = createContext<FieldComponents>({});

/** Devuelve el registry de componentes custom de esta instancia (los que NO se pasan caen al mapa default). */
export function useFieldComponents(): FieldComponents {
  return useContext(FieldComponentsContext);
}

/** Props del Provider: los dos documentos (schema + uiSchema), las opciones del store y widgets custom. */
export interface FormProviderProps extends FormStoreOptions {
  schema: JsfObjectSchema;
  uiSchema?: UiSchema;
  /** Componentes custom por inputType/ui:widget (override del mapa default; también valen en contenedores). */
  components?: FieldComponents;
  children: ReactNode;
}

/** Crea UN store por instancia y lo expone vía Context; lo recrea solo si cambia la key por valor. */
export function FormProvider({
  schema,
  uiSchema = {},
  components,
  children,
  ...opts
}: FormProviderProps) {
  const storeRef = useRef<StoreApi<FormState> | null>(null);

  // Ref viva con las opciones de ESTE render: el store lee a través de ella, así handlers inline
  // (onSubmit/onChange) y asyncLoaders nuevos no quedan congelados en el closure de creación.
  const optsRef = useRef(opts);
  optsRef.current = opts;

  // Opciones ESTABLES (identidad fija) cuyos accesos delegan en la ref viva → el store nunca se
  // recrea por callbacks nuevos, pero siempre ejecuta el último. (fix: closures stale del Provider)
  const stableOptsRef = useRef<FormStoreOptions | null>(null);
  if (!stableOptsRef.current) {
    stableOptsRef.current = {
      get initialValues() {
        return optsRef.current.initialValues;
      },
      get config() {
        return optsRef.current.config;
      },
      get asyncLoaders() {
        return optsRef.current.asyncLoaders;
      },
      get errorMessages() {
        return optsRef.current.errorMessages;
      },
      get layout() {
        return optsRef.current.layout;
      },
      onSubmit: (json, errors) => optsRef.current.onSubmit?.(json, errors),
      onChange: (json, errors) => optsRef.current.onChange?.(json, errors),
    };
  }
  const stableOpts = stableOptsRef.current;

  // Key por valor: recrear el store SOLO si cambia schema/uiSchema. initialValues NO va en la key a
  // propósito: si fuera, un fetch de edición que llega tarde recrearía el store y borraría lo que el
  // usuario tipeó. Para cargar datos async usá `hydrate()`. (fix casos de uso: edición async)
  const key = useMemo(
    () => JSON.stringify({ schema, uiSchema }),
    [schema, uiSchema],
  );
  const prevKey = useRef(key);

  // useRef evita recrear el store en el doble render de StrictMode. (ARCHITECTURE_V2.md riesgo #2)
  if (!storeRef.current) storeRef.current = createFormStore(schema, uiSchema, stableOpts);
  if (prevKey.current !== key) {
    storeRef.current = createFormStore(schema, uiSchema, stableOpts);
    prevKey.current = key;
  }

  // Registry estable: si components no cambia de contenido, el Provider de contexto no re-renderiza hijos.
  const componentsValue = useMemo(() => components ?? {}, [components]);

  return (
    <FormStoreContext.Provider value={storeRef.current}>
      <FieldComponentsContext.Provider value={componentsValue}>
        {children}
      </FieldComponentsContext.Provider>
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

/**
 * Devuelve la ref CRUDA al store (StoreApi), estable y SIN suscripción.
 * Para leer valores on-demand sin re-renderizar (p. ej. getFormValues en el controlador).
 */
export function useFormStoreApi(): StoreApi<FormState> {
  const store = useContext(FormStoreContext);
  if (!store) {
    throw new Error("useFormStoreApi debe usarse dentro de <FormProvider>");
  }
  return store;
}

// Export interno para tests/hooks que necesiten la ref cruda del store. No es API pública.
export { FormStoreContext };
