import React, { useMemo, useCallback } from 'react'
import type { Field } from '@remoteoss/json-schema-form'
import {
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
  GroupArrayField
} from '../components/fields'

// Mapeo de tipos de campo a componentes
const FIELD_COMPONENT_MAP = {
  text: TextField,
  email: TextField,
  hidden: TextField,
  number: NumberField,
  money: NumberField,
  textarea: TextareaField,
  select: SelectField,
  autocomplete: AutocompleteField,
  country: SelectField,
  radio: RadioField,
  checkbox: CheckboxField,
  date: DateField,
  file: FileField,
  fieldset: FieldsetField,
  'group-array': GroupArrayField,
} as const

export interface UseFieldRendererOptions {
  // Permitir componentes personalizados
  customComponents?: Partial<typeof FIELD_COMPONENT_MAP>
  // Configuración global
  globalConfig?: {
    disabled?: boolean
    size?: 'small' | 'middle' | 'large'
    validateTrigger?: 'onChange' | 'onBlur' | 'onSubmit'
  }
  // Callbacks globales
  onFieldChange?: (fieldName: string, value: any, field: Field) => void
  onFieldBlur?: (fieldName: string, field: Field) => void
}

export function useFieldRenderer(options: UseFieldRendererOptions = {}) {
  const {
    customComponents = {},
    globalConfig = {},
    onFieldChange,
    onFieldBlur
  } = options

  // Combinar componentes por defecto con personalizados
  const componentMap = useMemo(() => ({
    ...FIELD_COMPONENT_MAP,
    ...customComponents
  }), [customComponents])

  // Función para renderizar un campo individual
  const renderField = useCallback((field: any, index?: number): React.ReactNode => {
    const { inputType, name } = field

    // Buscar el componente apropiado
    const FieldComponent = componentMap[inputType as keyof typeof componentMap]

    if (!FieldComponent) {
      console.warn(`No component found for field type: ${inputType}`)
      return (
        <div key={`${name}-${index || 0}`} style={{ 
          padding: '8px', 
          border: '1px dashed #ff4d4f', 
          borderRadius: '4px',
          color: '#ff4d4f'
        }}>
          Unsupported field type: {inputType}
          <pre style={{ fontSize: '10px', marginTop: '4px' }}>
            {JSON.stringify(field, null, 2)}
          </pre>
        </div>
      )
    }

    // Props base que se pasan a todos los campos
    const baseProps = {
      // key: `${name}-${index || 0}`,
      ...field,
      // Aplicar configuración global
      disabled: globalConfig.disabled || field.disabled,  
      size: globalConfig.size || field.size,
    }

    // Props específicos para campos complejos (fieldset y group-array)
    if (inputType === 'fieldset' || inputType === 'group-array') {
      return (
        <FieldComponent
          {...baseProps}
          renderField={renderField} // Pasar la función de renderizado recursivamente
        />
      )
    }

    return <FieldComponent {...baseProps} />
  }, [componentMap, globalConfig])

  // Función para renderizar múltiples campos
  const renderFields = useMemo(() => {
    return (fields: Field[]): React.ReactNode[] => {
      return fields.map((field, index) => renderField(field, index))
    }
  }, [renderField])

  // Función para obtener el componente de un tipo específico
  const getFieldComponent = useMemo(() => {
    return (inputType: string) => {
      return componentMap[inputType as keyof typeof componentMap]
    }
  }, [componentMap])

  return {
    renderField,
    renderFields,
    getFieldComponent,
    componentMap
  }
}

export default useFieldRenderer