 
import type { Field, FieldType as JSFFieldType, SchemaValue } from "@laus/json-schema-form"
import type {
  InputProps,
  SelectProps,
  CheckboxProps,
  RadioGroupProps,
  DatePickerProps,
  TimePickerProps,
  UploadProps,
  InputNumberProps,
  AutoCompleteProps
} from "antd"
import type { TextAreaProps } from "antd/es/input"

// Base interface para todos los campos
export interface BaseFieldProps extends Field {
  value?: any
  error?: string | Record<string, any>
  submitted?: boolean
  touched?: boolean
  onChange: (name: string, value: any) => void
  onBlur?: (name: string) => void
  className?: string
  style?: React.CSSProperties
  getFormValues?: () => Record<string, any>
}

// Props específicos para cada tipo de campo
export interface TextFieldProps extends BaseFieldProps, Omit<InputProps, 'onChange' | 'value'> {
  inputType: 'text' | 'email' | 'hidden'
}

export interface NumberFieldProps extends BaseFieldProps, Omit<InputNumberProps, 'onChange' | 'value'> {
  inputType: 'number' | 'money'
}

export interface TextareaFieldProps extends BaseFieldProps, Omit<TextAreaProps, 'onChange' | 'value'> {
  inputType: 'textarea'
  rows?: number
}

export interface SelectFieldProps extends BaseFieldProps, Omit<SelectProps, 'onChange' | 'value' | 'options'> {
  inputType: 'select' | 'country'
  multiple?: boolean
}

export interface AutocompleteFieldProps extends BaseFieldProps, Omit<AutoCompleteProps, 'onChange' | 'value' | 'options'> {
  inputType: 'autocomplete'
}

export interface RadioFieldProps extends BaseFieldProps, Omit<RadioGroupProps, 'onChange' | 'value' | 'options'> {
  inputType: 'radio'
}

export interface CheckboxFieldProps extends BaseFieldProps, Omit<CheckboxProps, 'onChange' | 'checked'> {
  inputType: 'checkbox'
  checkboxValue?: any
}

export interface DateFieldProps extends BaseFieldProps, Omit<DatePickerProps, 'onChange' | 'value'> {
  inputType: 'date'
  minDate?: string
  maxDate?: string
}

// `time` no es un FieldType nativo del motor → definimos las props explícitas (no derivamos de BaseFieldProps
// para esquivar su index signature `[key:string]: unknown`, que vuelve unknown a value/onChange). (widget time)
export interface TimeFieldProps extends Omit<TimePickerProps, 'onChange' | 'value' | 'status' | 'format'> {
  name: string
  label?: string
  description?: string
  value?: any
  error?: string | Record<string, any>
  submitted?: boolean
  touched?: boolean
  required?: boolean
  isVisible?: boolean
  inputType?: string
  format?: string
  onChange: (name: string, value: any) => void
  onBlur?: (name: string) => void
  className?: string
  style?: React.CSSProperties
}

export interface FileFieldProps extends BaseFieldProps, Omit<UploadProps, 'onChange'> {
  inputType: 'file'
  accept?: string
  maxFileSize?: number
  multiple?: boolean
}

export interface FieldsetFieldProps extends BaseFieldProps {
  inputType: 'fieldset'
  fields?: Field[]
  size?: 'default' | 'small'
}

export interface GroupArrayFieldProps extends BaseFieldProps {
  inputType: 'group-array'
  fields?: Field[]
}

// Union type para todos los props de campos
export type FieldProps = 
  | TextFieldProps 
  | NumberFieldProps 
  | TextareaFieldProps
  | SelectFieldProps 
  | AutocompleteFieldProps
  | RadioFieldProps 
  | CheckboxFieldProps 
  | DateFieldProps 
  | FileFieldProps 
  | FieldsetFieldProps 
  | GroupArrayFieldProps

// Tipo para las opciones de campo (para select, radio, etc.)
export interface FieldOption {
  label: string
  value: any
  disabled?: boolean
  [key: string]: any
}

// Configuración del formulario
export interface UIFormConfig {
  showRequiredMark?: boolean
  validateTrigger?: 'onChange' | 'onBlur' | 'onSubmit'
  size?: 'small' | 'middle' | 'large'
  layout?: 'horizontal' | 'vertical' | 'inline'
  disabled?: boolean
}

// NOTA: AsyncOptionsLoader y UIFormProps v1 se eliminaron en la Fase 7 (código muerto). La API v2
// usa AsyncOptionsLoader del motor (@laus/json-schema-form) y UIFormProps de components/form/UIForm.tsx.
