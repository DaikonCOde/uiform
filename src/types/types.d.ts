 
import type { Field, FieldType as JSFFieldType, SchemaValue } from "@laus/json-schema-form"
import type { 
  InputProps, 
  SelectProps, 
  CheckboxProps, 
  RadioGroupProps, 
  DatePickerProps,
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

// Tipo para async loaders
export type AsyncOptionsLoader = (context: any) => Promise<{ options: any[] }>

// Props del componente principal JForm
export interface UIFormProps {
  schema: any // JsfObjectSchema from json-schema-form
  initialValues?: Record<string, any>
  asyncLoaders?: Record<string, AsyncOptionsLoader> // Mapeador de funciones async
  onSubmit?: (values: any, errors?: any) => void | Promise<void>
  onChange?: (values: any, errors?: any) => void
  config?: UIFormConfig
  className?: string
  style?: React.CSSProperties
}
