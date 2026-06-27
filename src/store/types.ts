/* eslint-disable @typescript-eslint/no-explicit-any */
// Contrato compartido del store v2: tipos del uiSchema (RJSF), estado, opciones y secciones.
// Es la columna vertebral de la integración — todo lo demás (compilador, store, hooks) tipa contra esto.

import type {
  Field,
  FormErrors,
  JsfObjectSchema,
  AsyncOptionsLoader,
} from "@laus/json-schema-form";
import type { UIFormConfig } from "../types/types.d";

// ─────────────────────────────────────────────────────────────────────────────
// uiSchema (modelo RJSF de dos documentos) — lo que escribe el consumidor.
// El schema define el DATO; el uiSchema define la PRESENTACIÓN. (ARCHITECTURE_V2.md §1 ter)
// ─────────────────────────────────────────────────────────────────────────────

/** Columnas responsivas por breakpoint (mobile-first). Un número simple aplica a todos. */
export interface ResponsiveCols {
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
}

/** Config de grid: columnas (fijas o responsivas) + gap (default 16px). Global o por sección. */
export interface FormLayout {
  columns?: number; // columnas fijas
  responsive?: ResponsiveCols; // columnas por breakpoint (gana sobre `columns`)
  gap?: string; // separación entre celdas; default "16px"
}

/** Presentación de un campo: claves `ui:*` que el compilador baja a x-jsf-presentation. */
export interface UiFieldOptions {
  "ui:widget"?: string; // componente a renderizar → x-jsf-presentation.inputType (clave de FIELD_COMPONENT_MAP)
  "ui:placeholder"?: string;
  "ui:autofocus"?: boolean;
  "ui:disabled"?: boolean;
  "ui:title"?: string; // override del label
  "ui:description"?: string;
  "ui:options"?: Record<string, unknown>; // props arbitrarias → splat a x-jsf-presentation (accept, asyncOptions, etc.)
  "ui:order"?: string[]; // orden de hijos en un objeto anidado (fieldset)
  "ui:errorMessages"?: Record<string, string>; // mensajes custom por tipo de validación (required/format/...)
  "ui:colSpan"?: number | ResponsiveCols; // columnas del grid que ocupa el campo (default 1)
  // Hijos anidados (fieldset): cada clave es el name de un hijo con sus propias UiFieldOptions.
  [childOrUiKey: string]: unknown;
}

/** Una sección: agrupa campos por name. Es presentación pura → vive en el uiSchema. */
export interface UiSection {
  id: string;
  title?: string;
  description?: string;
  fields: string[]; // names de los campos, en orden
  layout?: FormLayout; // grid propio de la sección (override del global)
}

/** Documento de presentación. `ui:sections` y `ui:order` a nivel raíz; el resto por name de campo. */
export interface UiSchema {
  "ui:sections"?: UiSection[];
  "ui:order"?: string[];
  [fieldName: string]: UiFieldOptions | UiSection[] | string[] | undefined;
}

// ─────────────────────────────────────────────────────────────────────────────
// Secciones resueltas (output interno tras compilar + resolver).
// ─────────────────────────────────────────────────────────────────────────────

/** Sección ya resuelta: sus names mapeados a los Field del motor, en orden. */
export interface ResolvedSection {
  id: string;
  title?: string;
  description?: string;
  fieldNames: string[];
  fields: Field[];
  layout?: FormLayout; // grid propio de la sección (override del global)
}

// ─────────────────────────────────────────────────────────────────────────────
// Opciones de creación del store y estado.
// ─────────────────────────────────────────────────────────────────────────────

/** Estado async de un loader de opciones (Select/Autocomplete). */
export interface AsyncOptionState {
  options: any[];
  loading: boolean;
  error: string | null;
}

/** Opciones para crear el store (las pasa el FormProvider). */
export interface FormStoreOptions {
  initialValues?: Record<string, any>;
  asyncLoaders?: Record<string, AsyncOptionsLoader>;
  layout?: FormLayout; // grid GLOBAL del formulario (default de todas las secciones)
  // Mensajes de error globales (i18n): { [tipoDeValidación]: mensaje }. Se aplican a TODOS los campos;
  // un campo puede sobreescribirlos con `ui:errorMessages` en el uiSchema.
  errorMessages?: Record<string, string>;
  onSubmit?: (values: any, errors?: FormErrors) => void | Promise<void>;
  onChange?: (values: any, errors?: FormErrors) => void;
  config?: UIFormConfig;
}

/** Estado + acciones del store de un formulario (una instancia por <FormProvider>). */
export interface FormState {
  // ── Estructura (inmutable tras crear) ──
  fields: Field[];
  fieldsByName: Record<string, Field>; // índice O(1); soporta paths anidados "address.street"
  sections: ResolvedSection[];
  layout: import("@laus/json-schema-form").JsfLayoutConfig | null; // x-jsf-layout del motor (interno)
  formLayout: FormLayout | null; // grid GLOBAL provisto por el consumidor (FormProvider.layout)
  // colSpan ESTÁTICO por campo, leído del schema compilado (x-jsf-layout). El `field.layout` del motor
  // aparece/desaparece según la visibilidad (lo borra al ocultar), así que NO sirve para el grid de un
  // campo condicional; esta versión estática persiste y el grid la usa. (fix colSpan de campo oculto)
  fieldColSpans: Record<string, import("@laus/json-schema-form").JsfLayoutConfig>;

  // ── Estado mutable ──
  values: Record<string, any>;
  errors: FormErrors;
  touched: Record<string, boolean>;
  submitted: boolean;
  isSubmitting: boolean;
  submitError: string | null; // error que tiró onSubmit (para feedback); null si no hubo.

  // ── Cache de opciones async (reemplaza asyncOptionsCache del contexto v1) ──
  async: Record<string, AsyncOptionState>;

  // ── Acciones (referencias estables) ──
  setValue: (name: string, value: any) => void; // soporta paths: "address.street"
  setValues: (values: Record<string, any>) => void; // MERGE parcial sobre los valores actuales
  hydrate: (values: Record<string, any>) => void; // carga datos (edición async) sin pisar lo que el usuario tocó
  setTouched: (name: string) => void;
  validate: () => FormErrors;
  submit: () => Promise<void>;
  reset: (values?: Record<string, any>) => void;
  loadAsyncOptions: (loaderId: string, search?: string) => Promise<void>;
}

export type { Field, FormErrors, JsfObjectSchema, AsyncOptionsLoader };
