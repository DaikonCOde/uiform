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
  // 0) Compilar uiSchema → x-jsf-* (única vía de presentación) + inyectar mensajes de error globales. (§1 ter)
  const internalSchema = compileUiSchema(schema, uiSchema, opts.errorMessages);

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
    formLayout: opts.layout ?? null,

    // ── Estado mutable ──
    values: getDefaultValuesFromFields(fields, opts.initialValues),
    errors: {},
    touched: {},
    submitted: false,
    isSubmitting: false,
    submitError: null,
    async: {},

    setValue: (name, value) => {
      // setPath clona la raíz y solo la rama tocada (inmutable, preserva refs de hermanos). (paths.ts)
      const newValues = setPath(get().values, name, value);
      // Re-derivamos los fields en CADA cambio: el motor muta isVisible/computedAttributes in-place según
      // los valores. Sin esto, la visibilidad condicional (if/then) queda congelada. (fix casos de uso)
      const json = formValuesToJsonValues(newValues, get().fields);
      const { formErrors } = handleValidation(json);
      const fresh = formErrors ?? {};
      // Lo que se MUESTRA (store.errors) se gobierna por validateTrigger; pero onChange recibe SIEMPRE
      // los errores frescos (para "deshabilitar submit si inválido"). Un solo set → un solo notify.
      const display =
        opts.config?.validateTrigger === "onChange" ? fresh : get().errors;
      set({ values: newValues, errors: display });
      opts.onChange?.(json, fresh);
    },
    // MERGE parcial (no replace) + re-derivación. (fix casos de uso: setValues pisaba todo)
    setValues: (values) => {
      const merged = { ...get().values, ...values };
      handleValidation(formValuesToJsonValues(merged, get().fields));
      set({ values: merged });
    },
    // Hidratación para edición async: aplica `values` SIN pisar lo que el usuario ya tocó. (fix casos de uso)
    hydrate: (values) => {
      const s = get();
      const next = { ...s.values };
      for (const key of Object.keys(values)) {
        if (!s.touched[key]) next[key] = values[key];
      }
      handleValidation(formValuesToJsonValues(next, s.fields));
      set({ values: next });
    },
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
      set({ submitted: true, isSubmitting: true, submitError: null });
      try {
        const errors = get().validate();
        // Cortamos antes de onSubmit si hay errores: no se envía un payload inválido. (ARCHITECTURE_V2.md §9)
        if (errors && Object.keys(errors).length) return;
        const json = formValuesToJsonValues(get().values, get().fields);
        await opts.onSubmit?.(json, errors);
      } catch (e) {
        // NO re-lanzamos (submit suele ser fire-and-forget desde un onClick → evita unhandled rejection).
        // Guardamos el error para feedback vía useFormApi().submitError. (fix casos de uso)
        set({ submitError: e instanceof Error ? e.message : String(e) });
      } finally {
        set({ isSubmitting: false });
      }
    },

    reset: (values) => {
      const next = getDefaultValuesFromFields(get().fields, values ?? {});
      // Re-derivamos visibilidad/computed para el estado reseteado. (fix casos de uso)
      handleValidation(formValuesToJsonValues(next, get().fields));
      set({ values: next, errors: {}, touched: {}, submitted: false, submitError: null });
    },

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
