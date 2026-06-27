// Punto de entrada público de @laus/uiform (API v2).
// Modelo de dos documentos: schema (dato) + uiSchema (presentación). Ver docs/usage/index.md.

// ── Componentes ──
export { FormProvider, useFieldComponents } from '../context/FormStoreContext'
export type { FormProviderProps, FieldComponents } from '../context/FormStoreContext'
export { Field } from '../components/form/Field'
export { FormSection } from '../components/form/FormSection'
export { SubmitButton } from '../components/form/SubmitButton'
export { UIForm, default as UIFormDefault } from '../components/form/UIForm'
export type { UIFormProps } from '../components/form/UIForm'

// ── Hooks ──
export { useFormStore, useFormStoreApi } from '../context/FormStoreContext'
export { useField } from '../hooks/useField'
export { useWatch } from '../hooks/useWatch'
export { useFormApi } from '../hooks/useFormApi'
export { useAsyncOptions } from '../hooks/useAsyncOptions'
export { useSection } from '../hooks/useSection'
export { useSections } from '../hooks/useSections'

// ── Tipos del store/uiSchema ──
export type {
  UiSchema,
  UiFieldOptions,
  UiSection,
  ResolvedSection,
  FormState,
  FormStoreOptions,
  AsyncOptionState,
  FormLayout,
  ResponsiveCols,
} from '../store/types'

// ── Tipos de presentación (props de los campos) + config ──
export type {
  BaseFieldProps,
  TextFieldProps,
  NumberFieldProps,
  TextareaFieldProps,
  SelectFieldProps,
  AutocompleteFieldProps,
  RadioFieldProps,
  CheckboxFieldProps,
  DateFieldProps,
  TimeFieldProps,
  FileFieldProps,
  FieldsetFieldProps,
  GroupArrayFieldProps,
  FieldProps,
  FieldOption,
  UIFormConfig,
} from '../types'

// ── Componentes de campo (para override / customización avanzada) ──
export {
  TextField,
  NumberField,
  TextareaField,
  SelectField,
  AutocompleteField,
  RadioField,
  CheckboxField,
  DateField,
  TimeField,
  FileField,
  FieldsetField,
  GroupArrayField,
} from '../components/fields'
export { FIELD_COMPONENT_MAP } from '../components/form/fieldComponentMap'

// ── Building blocks para COMPONER widgets custom (label + error consistentes con los built-in) ──
export { FieldLabel, ErrorMessage } from '../components/commons'

// ── Utilidades ──
export { formValuesToJsonValues, getDefaultValuesFromFields } from '../utils/utils'

// ── Re-export de tipos del motor (Field se re-exporta como FieldDef para no chocar con el componente Field) ──
export type {
  Field as FieldDef,
  JsfObjectSchema,
  JsfLayoutConfig,
  AsyncOptionsConfig,
  AsyncOptionsLoader,
  AsyncOptionsLoaderContext,
  AsyncOptionsLoaderResult,
  ResponsiveBreakpoints,
  FormErrors,
} from '@laus/json-schema-form'

// CSS: importar por separado → import '@laus/uiform/style.css'
