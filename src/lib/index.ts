// Main component export
export { UIForm } from '../components/form/UIForm'
export { default as UIFormDefault } from '../components/form/UIForm'

// Type exports
export type {
  UIFormProps,
  UIFormConfig,
  BaseFieldProps,
  TextFieldProps,
  NumberFieldProps,
  TextareaFieldProps,
  SelectFieldProps,
  AutocompleteFieldProps,
  RadioFieldProps,
  CheckboxFieldProps,
  DateFieldProps,
  FileFieldProps,
  FieldsetFieldProps,
  GroupArrayFieldProps,
  FieldProps,
  FieldOption,
  AsyncOptionsLoader,
} from '../types'

// Context exports
export { FormProvider, FormContext } from '../context/FormContext'
export type { FormContextState, FormContextValue, AsyncOptionsCache } from '../context/FormContext'

// Hook exports
export { useFormContext } from '../hooks/useFormContext'

// Utility exports (optional, but can be useful)
export { formValuesToJsonValues, getDefaultValuesFromFields } from '../utils/utils'

// Field components (optional, for advanced customization)
export {
  TextField,
  NumberField,
  TextareaField,
  SelectField,
  AutocompleteField,
  RadioField,
  CheckboxField,
  DateField,
  FileField,
  FieldsetField,
  GroupArrayField,
} from '../components/fields'

// Re-export commonly used types from json-schema-form
export type {
  Field,
  JsfObjectSchema,
  AsyncOptionsConfig,
  AsyncOptionsLoaderContext,
  AsyncOptionsLoaderResult,
  JsfLayoutConfig,
  ResponsiveBreakpoints,
} from '@laus/json-schema-form'

// CSS - users will need to import this separately
// import '@yourorg/uiform/dist/style.css'
