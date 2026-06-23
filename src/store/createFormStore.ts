/* eslint-disable @typescript-eslint/no-explicit-any */
// Factory del store por instancia: compila uiSchema, parsea con el motor headless y expone estado + acciones. (ARCHITECTURE_V2.md §3)

import { createStore, type StoreApi } from "zustand/vanilla";
import { createHeadlessForm } from "@laus/json-schema-form";

import { compileUiSchema } from "./compileUiSchema";
import { resolveSections, indexByName } from "./resolveSections";
import { setPath } from "./paths";
import {
  formValuesToJsonValues,
  getDefaultValuesFromFields,
} from "../utils/utils";
import type {
  FormState,
  FormStoreOptions,
  JsfObjectSchema,
  UiSchema,
} from "./types";

/**
 * Crea un store Zustand vanilla para una instancia de formulario.
 * @param schema  JSON Schema puro (contrato de datos).
 * @param uiSchema  Documento de presentación (ui:*); opcional.
 * @param opts  Callbacks, valores iniciales, asyncLoaders y config (validateTrigger).
 * @returns StoreApi con el FormState completo (estructura inmutable + estado mutable + acciones).
 */
export function createFormStore(
  schema: JsfObjectSchema,
  uiSchema: UiSchema | undefined,
  opts: FormStoreOptions,
): StoreApi<FormState> {
  // 0) Compilar uiSchema → x-jsf-* (única vía de presentación). (ARCHITECTURE_V2.md §1 ter)
  const internalSchema = compileUiSchema(schema, uiSchema);

  // 1) Parsear una sola vez con el motor (ya con x-jsf-*); no usamos strictInputType para no exigir inputType en todo campo.
  const { fields, handleValidation, layout } = createHeadlessForm(
    internalSchema,
    {
      strictInputType: false,
      initialValues: opts.initialValues,
      asyncLoaders: opts.asyncLoaders,
    },
  );

  // 2) Resolver secciones desde el x-jsf-sections que dejó el compilador. (ARCHITECTURE_V2.md §6)
  const sections = resolveSections(internalSchema, fields);

  // Token de secuencia por loader: descarta respuestas async fuera de orden (la lenta vieja no pisa
  // a la nueva). Sin esto, dos cargas concurrentes del mismo id ganan por orden de RESOLUCIÓN. (fix de revisión)
  const loadSeq: Record<string, number> = {};

  return createStore<FormState>((set, get) => ({
    // ── Estructura (inmutable tras crear) ──
    fields,
    fieldsByName: indexByName(fields),
    sections,
    layout: layout ?? null,

    // ── Estado mutable ──
    values: getDefaultValuesFromFields(fields, opts.initialValues),
    errors: {},
    touched: {},
    submitted: false,
    isSubmitting: false,
    async: {},

    setValue: (name, value) => {
      // setPath clona la raíz y solo la rama tocada (inmutable, preserva refs de hermanos). (paths.ts)
      set((s) => ({ values: setPath(s.values, name, value) }));
      if (opts.config?.validateTrigger === "onChange") get().validate();
      opts.onChange?.(
        formValuesToJsonValues(get().values, get().fields),
        get().errors,
      );
    },
    setValues: (values) => set({ values }),
    setTouched: (name) =>
      set((s) => ({ touched: { ...s.touched, [name]: true } })),

    validate: () => {
      // Validación sale del JSON Schema puro: UI → JSON y delega en el motor. (ARCHITECTURE_V2.md §9)
      const json = formValuesToJsonValues(get().values, get().fields);
      const { formErrors } = handleValidation(json);
      set({ errors: formErrors ?? {} });
      return formErrors ?? {};
    },

    submit: async () => {
      set({ submitted: true, isSubmitting: true });
      try {
        const errors = get().validate();
        // Cortamos antes de onSubmit si hay errores: no se envía un payload inválido. (ARCHITECTURE_V2.md §9)
        if (errors && Object.keys(errors).length) return;
        const json = formValuesToJsonValues(get().values, get().fields);
        await opts.onSubmit?.(json, errors);
      } finally {
        set({ isSubmitting: false });
      }
    },

    reset: (values) =>
      set({
        values: getDefaultValuesFromFields(get().fields, values ?? {}),
        errors: {},
        touched: {},
        submitted: false,
      }),

    loadAsyncOptions: async (loaderId, search = "") => {
      const loader = opts.asyncLoaders?.[loaderId];
      if (!loader) return;
      // Reservamos un token: solo la respuesta de la ÚLTIMA llamada podrá escribir el resultado.
      const seq = (loadSeq[loaderId] = (loadSeq[loaderId] ?? 0) + 1);
      // Marcar loading preservando opciones previas para no parpadear la UI mientras recarga. (ARCHITECTURE_V2.md §3.2)
      set((s) => ({
        async: {
          ...s.async,
          [loaderId]: { ...s.async[loaderId], loading: true, error: null },
        },
      }));
      try {
        const res = await loader({ formValues: get().values, search });
        if (seq !== loadSeq[loaderId]) return; // llegó una carga más nueva → descartamos esta.
        set((s) => ({
          async: {
            ...s.async,
            [loaderId]: { options: res.options ?? [], loading: false, error: null },
          },
        }));
      } catch (e) {
        if (seq !== loadSeq[loaderId]) return;
        set((s) => ({
          async: {
            ...s.async,
            [loaderId]: { options: [], loading: false, error: String(e) },
          },
        }));
      }
    },
  }));
}
