import React, { useMemo, useEffect } from 'react'
import { Card } from 'antd'
import { ErrorMessage, FieldLabel } from '../commons'
import type { FieldsetFieldProps } from '../../types'
import {
  generateContainerResponsiveCSS,
  generateFieldResponsiveCSS,
  injectResponsiveCSS,
  cleanupResponsiveCSS
} from '../../utils/responsive-layout'
import styles from './Field.module.css'

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
  // Generar ID único para este fieldset
  const fieldsetId = useMemo(() => `fieldset-${name}-${Math.random().toString(36).substr(2, 9)}`, [name])

  // Obtener layout del fieldset desde _rootLayout (que viene procesado por json-schema-form)
  const rootLayout = (cardProps as any)._rootLayout

  // Obtener columns del schema (puede venir como columns o dentro del layout)
  const schemaColumns = (cardProps as any).columns

  // Calcular columnas del grid interno del fieldset
  const containerLayout = useMemo(() => {
    // Prioridad: 1) columns del schema, 2) columns del layout, 3) default 1
    const columns = schemaColumns ?? rootLayout?.columns

    if (!columns) {
      return { columns: 1, gap: '16px' }
    }

    // Si columns es un objeto (responsivo), crear layout responsivo
    if (typeof columns === 'object') {
      return {
        responsive: columns,
        gap: '16px'
      }
    }

    // Si es un número simple
    return {
      columns: columns,
      gap: '16px'
    }
  }, [rootLayout, schemaColumns])

  // Generar CSS responsivo para el grid interno
  const css = useMemo(() => {
    let generatedCSS = ''

    // CSS del contenedor
    generatedCSS += generateContainerResponsiveCSS(
      containerLayout,
      `${fieldsetId}-container`
    )

    // CSS de cada campo hijo
    fields.forEach((field: any) => {
      const fieldCSS = generateFieldResponsiveCSS(
        field,
        `${fieldsetId}-field-${field.name}`
      )
      if (fieldCSS) {
        generatedCSS += fieldCSS + '\n'
      }
    })

    return generatedCSS
  }, [containerLayout, fields, fieldsetId])

  // Inyectar CSS al montar y limpiar al desmontar
  useEffect(() => {
    if (css) {
      injectResponsiveCSS(css, `${fieldsetId}-styles`)
    }

    return () => cleanupResponsiveCSS(`${fieldsetId}-styles`)
  }, [css, fieldsetId])

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
    <div className={`${styles.field} ${className || ''}`} style={style}>
      <Card
        title={cardTitle}
        size={size}
        className={styles.fieldsetCard}
        style={{
          ...(error && (touched || submitted) ? { borderColor: '#ff4d4f' } : {})
        }}
        {...Object.fromEntries(
          Object.entries(cardProps).filter(
            ([key]) => key !== 'type' && key !== 'jsonType' && key !== 'accept' && key !== 'errorMessage'
          )
        )}
      >
        {!hasTitle && description && (
          <div className={styles.fieldsetDescription}>
            {description}
          </div>
        )}
        
        <div className={`${styles.fieldsetContainer} ${fieldsetId}-container`}>
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

            // Clase para el layout del campo
            const fieldClassName = `${fieldsetId}-field-${field.name}`

            return (
              <div key={`${name}-${field.name}`} className={fieldClassName}>
                {renderField ? renderField(nestedField, index) : (
                  <pre>{JSON.stringify(nestedField, null, 2)}</pre>
                )}
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