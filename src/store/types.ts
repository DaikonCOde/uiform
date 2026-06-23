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
  // Hijos anidados (fieldset): cada clave es el name de un hijo con sus propias UiFieldOptions.
  [childOrUiKey: string]: unknown;
}

/** Una sección: agrupa campos por name. Es presentación pura → vive en el uiSchema. */
export interface UiSection {
  id: string;
  title?: string;
  description?: string;
  fields: string[]; // names de los campos, en orden
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
  layout: import("@laus/json-schema-form").JsfLayoutConfig | null;

  // ── Estado mutable ──
  values: Record<string, any>;
  errors: FormErrors;
  touched: Record<string, boolean>;
  submitted: boolean;
  isSubmitting: boolean;

  // ── Cache de opciones async (reemplaza asyncOptionsCache del contexto v1) ──
  async: Record<string, AsyncOptionState>;

  // ── Acciones (referencias estables) ──
  setValue: (name: string, value: any) => void; // soporta paths: "address.street"
  setValues: (values: Record<string, any>) => void;
  setTouched: (name: string) => void;
  validate: () => FormErrors;
  submit: () => Promise<void>;
  reset: (values?: Record<string, any>) => void;
  loadAsyncOptions: (loaderId: string, search?: string) => Promise<void>;
}

export type { Field, FormErrors, JsfObjectSchema, AsyncOptionsLoader };
