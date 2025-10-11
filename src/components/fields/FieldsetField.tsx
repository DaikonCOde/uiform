import React from 'react'
import { Card } from 'antd'
import { ErrorMessage, FieldLabel } from '../commons'
import type { FieldsetFieldProps } from '../../types'

interface FieldsetFieldPropsExtended extends FieldsetFieldProps {
  renderField: (field: any, index: number) => React.ReactNode
}

export function FieldsetField({
  name,
  label,
  description,
  value,
  inputType,
  required,
  isVisible,
  error,
  submitted,
  touched,
  onChange,
  onBlur,
  className,
  style,
  disabled,
  fields = [],
  renderField,
  // Props específicos de Card/Fieldset
  size = 'default',
  ...cardProps
}: FieldsetFieldPropsExtended) {

  if (!isVisible) return null

  const hasTitle = label || description
  const cardTitle = label ? (
    <FieldLabel 
      label={label} 
      required={required}
      description={description}
    />
  ) : undefined

  return (
    <div className={className} style={style}>
      <Card
        title={cardTitle}
        size={size}
        style={{
          marginBottom: '16px',
          ...(error && (touched || submitted) ? { borderColor: '#ff4d4f' } : {})
        }}
        {...Object.fromEntries(
          Object.entries(cardProps).filter(
            ([key]) => key !== 'type' && key !== 'jsonType' && key !== 'accept' && key !== 'errorMessage'
          )
        )}
      >
        {!hasTitle && description && (
          <div 
            style={{
              fontSize: '12px',
              color: 'rgba(0, 0, 0, 0.45)',
              marginBottom: '12px',
              lineHeight: '1.3'
            }}
          >
            {description}
          </div>
        )}
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {fields.map((field, index) => {
            // Crear un campo con el name prefijado para objetos anidados
            const nestedField = {
              ...field,
              name: `${name}.${field.name}`,
              // Pasar el valor anidado
              value: value && typeof value === 'object' ? value[field.name] : undefined,
              // Pasar errores anidados
              error: error && typeof error === 'object' ? error[field.name] : undefined,
              submitted,
              touched,
              disabled: disabled || field.disabled,
              // Wrapper para manejar cambios anidados
              onChange: (fieldName: string, fieldValue: any) => {
                const newValue = { ...value }
                const fieldKey = fieldName.replace(`${name}.`, '')
                newValue[fieldKey] = fieldValue
                onChange(name, newValue)
              }
            }
            
            return renderField ? renderField(nestedField, index) : (
              <div key={`${name}-${field.name}-${index}`}>
                <pre>{JSON.stringify(nestedField, null, 2)}</pre>
              </div>
            )
          })}
        </div>
      </Card>
      
      {(touched || submitted) && error && typeof error === 'string' && (
        <ErrorMessage error={error} fieldName={name} />
      )}
    </div>
  )
}