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
      // i18n a nivel librería: mensajes de validación en español por defecto (overridable a "en").
      locale: opts.locale ?? "es",
    },
  );

  // 2) Resolver secciones desde el x-jsf-sections que dejó el compilador. (ARCHITECTURE_V2.md §6)
  const sections = resolveSections(internalSchema, fields);

  // 2 bis) colSpan ESTÁTICO por campo, del schema compilado (x-jsf-layout). El motor pone/saca field.layout
  // según visibilidad (lo borra al ocultar), así que un campo condicional perdía su colSpan al mostrarse.
  // Esta versión estática persiste y la usa el grid. (fix colSpan de campo oculto)
  const fieldColSpans: FormState["fieldColSpans"] = {};
  // Valor "vacío" ESTÁTICO por campo, leído del schema (el motor corrompe field.jsonType al ocultar:
  // string → boolean), para limpiar el valor cuando el campo se oculta. (fix: limpiar valor al ocultar)
  const fieldEmptyValues: Record<string, any> = {};
  const compiledProps = (internalSchema.properties ?? {}) as Record<string, Record<string, unknown>>;
  for (const name of Object.keys(compiledProps)) {
    const prop = compiledProps[name];
    const lay = prop?.["x-jsf-layout"] as FormState["fieldColSpans"][string] | undefined;
    if (lay) fieldColSpans[name] = lay;
    const rawType = prop?.type as string | string[] | undefined;
    const ty = Array.isArray(rawType) ? rawType[0] : rawType;
    const it = (prop?.["x-jsf-presentation"] as Record<string, unknown> | undefined)?.inputType as string | undefined;
    fieldEmptyValues[name] =
      it === "checkbox" || ty === "boolean" ? false
      : it === "number" || it === "money" || ty === "number" || ty === "integer" ? null
      : it === "group-array" || ty === "array" ? []
      : it === "fieldset" || ty === "object" ? {}
      : ""; // strings y demás
  }

  // Token de secuencia por loader: descarta respuestas async fuera de orden (la lenta vieja no pisa
  // a la nueva). Sin esto, dos cargas concurrentes del mismo id ganan por orden de RESOLUCIÓN. (fix de revisión)
  const loadSeq: Record<string, number> = {};

  // Valida re-derivando la visibilidad ANTES de armar el JSON final. formValuesToJsonValues OMITE el valor
  // de los campos ocultos (field.isVisible===false); si armáramos el JSON con la visibilidad VIEJA, un campo
  // que justo se vuelve visible perdería su valor → "Required" falso (y uno que se oculta → "Not allowed").
  // 1ª pasada: asienta isVisible según los nuevos valores. Si la visibilidad cambió, 2ª pasada con el JSON ya
  // correcto. Si no cambió (tipeo normal), una sola pasada. (fix required/not-allowed al togglear visibilidad)
  const deriveAndValidate = (
    values: Record<string, any>,
    flds: any[],
  ): { json: any; errors: Record<string, any> } => {
    const visBefore = flds.map((f) => f?.isVisible).join(",");
    const json1 = formValuesToJsonValues(values, flds);
    const res1 = handleValidation(json1);
    const visAfter = flds.map((f) => f?.isVisible).join(",");
    if (visBefore === visAfter) return { json: json1, errors: res1.formErrors ?? {} };
    // La visibilidad cambió por este set → el JSON anterior usó la vieja; lo rearmamos y revalidamos.
    const json2 = formValuesToJsonValues(values, flds);
    const res2 = handleValidation(json2);
    return { json: json2, errors: res2.formErrors ?? {} };
  };

  // Limpia en el estado el valor de los campos OCULTOS (isVisible===false), al vacío ESTÁTICO según el tipo.
  // Así un campo que se oculta no arrastra su valor viejo (al re-mostrarse queda vacío). (fix: limpiar al ocultar)
  const clearHiddenValues = (values: Record<string, any>, flds: any[]): Record<string, any> => {
    let out = values;
    for (const f of flds) {
      if (f?.isVisible === false) {
        const empty = f?.name in fieldEmptyValues ? fieldEmptyValues[f.name] : "";
        const current = out[f?.name];
        if (current !== undefined && current !== empty && current !== "") {
          out = setPath(out, f.name, empty);
        }
      }
    }
    return out;
  };

  return createStore<FormState>((set, get) => ({
    // ── Estructura (inmutable tras crear) ──
    fields,
    fieldsByName: indexByName(fields),
    sections,
    layout: layout ?? null,
    formLayout: opts.layout ?? null,
    fieldColSpans,

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
      // los valores. deriveAndValidate asienta la visibilidad ANTES de armar el JSON (ver su comentario).
      const { json, errors: fresh } = deriveAndValidate(newValues, get().fields);
      // Limpiamos el valor de los campos que quedaron ocultos (con la visibilidad ya asentada).
      const cleared = clearHiddenValues(newValues, get().fields);
      // Lo que se MUESTRA (store.errors) se gobierna por validateTrigger; pero onChange recibe SIEMPRE
      // los errores frescos (para "deshabilitar submit si inválido"). Un solo set → un solo notify.
      const display =
        opts.config?.validateTrigger === "onChange" ? fresh : get().errors;
      set({ values: cleared, errors: display });
      opts.onChange?.(json, fresh);
    },
    // MERGE parcial (no replace) + re-derivación. (fix casos de uso: setValues pisaba todo)
    setValues: (values) => {
      const merged = { ...get().values, ...values };
      deriveAndValidate(merged, get().fields);
      set({ values: clearHiddenValues(merged, get().fields) });
    },
    // Hidratación para edición async: aplica `values` SIN pisar lo que el usuario ya tocó. (fix casos de uso)
    hydrate: (values) => {
      const s = get();
      const next = { ...s.values };
      for (const key of Object.keys(values)) {
        if (!s.touched[key]) next[key] = values[key];
      }
      deriveAndValidate(next, s.fields);
      set({ values: clearHiddenValues(next, s.fields) });
    },
    setTouched: (name) =>
      set((s) => ({ touched: { ...s.touched, [name]: true } })),

    validate: () => {
      // Validación sale del JSON Schema puro: UI → JSON y delega en el motor, re-derivando visibilidad
      // antes de armar el JSON (mismo motivo que setValue). (ARCHITECTURE_V2.md §9)
      const { errors } = deriveAndValidate(get().values, get().fields);
      set({ errors });
      return errors;
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
      deriveAndValidate(next, get().fields);
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
