import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { 
  createHeadlessForm, 
  generateCSSGridProperties,
  getFieldLayoutInfo 
} from '@remoteoss/json-schema-form'
import { Form, Button, Space, Alert } from 'antd'
import { useFieldRenderer } from '../../hooks/useFieldRenderer'
import { formValuesToJsonValues, getDefaultValuesFromFields } from '../../utils/utils'
import { useResponsiveCSS } from '../../utils/responsive-layout'
import type { UIFormProps } from '../../types'
import styles from './UIForm.module.css'

export function UIForm({
  schema,
  initialValues = {},
  asyncLoaders = {},
  onSubmit,
  onChange,
  config = {},
  className,
  style,
  children,
  ...formProps
}: UIFormProps & {
  children?: React.ReactNode
}) {
  const {
    showRequiredMark = true,
    validateTrigger = 'onChange',
    size = 'middle',
    layout = 'horizontal',
    disabled = false
  } = config

  // Crear formulario headless con json-schema-form
  const { fields, handleValidation, isError, error, layout: containerLayout } = useMemo(() => {
    try {
      return createHeadlessForm(schema, {
        strictInputType: false,
        initialValues,
        asyncLoaders,
      })
    } catch (err) {
      console.error('Error creating headless form:', err)
      return { 
        fields: [], 
        handleValidation: () => ({ formErrors: { '': 'Error initializing form' } }),
        isError: true,
        error: 'Failed to initialize form from schema',
        layout: null
      }
    }
  }, [schema, initialValues, asyncLoaders])

  // Estados del formulario
  const [values, setValues] = useState<Record<string, any>>(() =>
    getDefaultValuesFromFields(fields, initialValues)
  )
  const [errors, setErrors] = useState<Record<string, any>>({})
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Generar ID único para el formulario
  const formId = useMemo(() => Math.random().toString(36).substr(2, 9), [])
  

  // Hook para manejar CSS responsivo automáticamente
  const { containerClassName, getFieldClassName } = useResponsiveCSS(
    fields, 
    containerLayout, 
    formId
  )

  // Generar estilos CSS para el layout del contenedor
  const containerStyle = useMemo(() => {
    if (containerLayout) {
      return generateCSSGridProperties(containerLayout)
    }
    // Estilo por defecto si no hay layout definido
    return { display: 'flex', flexDirection: 'column' as const, gap: '16px' }
  }, [containerLayout])

  // Hook para renderizar campos
  const { renderField } = useFieldRenderer({
    globalConfig: {
      disabled,
      size,
      validateTrigger
    }
  })

  // Función para validar valores
  const validateValues = useCallback((valuesToValidate: Record<string, any>) => {
    try {
      const valuesForJson = formValuesToJsonValues(valuesToValidate, fields)
      const { formErrors } = handleValidation(valuesForJson)

      setErrors(formErrors || {})

      return {
        errors: formErrors,
        jsonValues: valuesForJson
      }
    } catch (err) {
      console.error('Validation error:', err)
      const errorMsg = 'Validation failed'
      setErrors({ '': errorMsg })
      return {
        errors: { '': errorMsg },
        jsonValues: valuesToValidate
      }
    }
  }, [fields, handleValidation])

  // Manejar cambios de campo
  const handleFieldChange = useCallback((fieldName: string, value: any) => {
    setValues((prevValues) => {
      const newValues = {
        ...prevValues,
        [fieldName]: value
      }
      
      // Validar según la configuración
      if (validateTrigger === 'onChange') {
        // Usar setTimeout para asegurar que la validación ocurre después del render
        setTimeout(() => {
          const validation = validateValues(newValues)
          // Llamar onChange si está definido
          onChange?.(validation.jsonValues, validation.errors)
        }, 0)
      }
      
      return newValues
    })
  }, [validateTrigger, validateValues, onChange])

  // Manejar blur de campo
  const handleFieldBlur = useCallback((_fieldName: string) => {
    if (validateTrigger === 'onBlur') {
      const validation = validateValues(values)
      onChange?.(validation.jsonValues, validation.errors)
    }
  }, [values, validateTrigger, validateValues, onChange])

  // Manejar envío del formulario
  const handleSubmit = useCallback(async () => {
    setSubmitted(true)
    setIsSubmitting(true)

    try {
      const validation = validateValues(values)

      // Si hay errores, no enviar
      if (validation.errors && Object.keys(validation.errors).length > 0) {
        setIsSubmitting(false)
        return
      }

      // Llamar onSubmit si está definido
      if (onSubmit) {
        await onSubmit(validation.jsonValues, validation.errors)
      }
    } catch (err) {
      console.error('Submit error:', err)
      setErrors({ '': 'Failed to submit form' })
    } finally {
      setIsSubmitting(false)
    }
  }, [values, validateValues, onSubmit])

  // Actualizar valores cuando cambian los initialValues
  useEffect(() => {
    if (Object.keys(initialValues).length > 0) {
      const newValues = getDefaultValuesFromFields(fields, initialValues)
      setValues(newValues)
    }
  }, [initialValues, fields])

  // Si hay error en la inicialización, mostrar mensaje
  if (isError) {
    return (
      <Alert
        message="Form Initialization Error"
        description={error || 'Failed to initialize form from schema'}
        type="error"
        showIcon
        className={className}
        style={style}
      />
    )
  }

  return (
    <div className={className} style={style}>
      <Form
        layout={layout}
        size={size}
        requiredMark={showRequiredMark}
        disabled={disabled}
        onFinish={handleSubmit}
        {...formProps}
      >
        {/* Error general del formulario */}
        {errors[''] && (
          <Alert
            message={errors['']}
            type="error"
            showIcon
            className={styles.formError}
          />
        )}

        {/* Renderizar campos con layout */}
        <div 
          style={containerStyle}
          className={containerClassName}
        >
          {fields.map((field, index) => {
            const fieldWithProps = {
              ...field,
              value: values[field.name],
              error: errors[field.name],
              submitted,
              onChange: handleFieldChange,
              onBlur: handleFieldBlur
            }

            // Obtener layout específico del campo
            const fieldLayout = getFieldLayoutInfo(field)
            const fieldStyle = fieldLayout ? generateCSSGridProperties(fieldLayout) : {}
            const fieldClassName = getFieldClassName(field.name)

            return (
              <Form.Item 
                key={field.name} 
                style={fieldStyle}
                className={`${styles.fieldItem} ${fieldClassName}`}
              >
                {renderField(fieldWithProps, index)}
              </Form.Item>
            )
          })}
        </div>

        {/* Botón de envío por defecto si se proporciona onSubmit */}
        {onSubmit && !children && (
          <Form.Item className={styles.submitContainer}>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={isSubmitting}
                disabled={disabled}
              >
                Submit
              </Button>
              {/* Botón de reset opcional */}
              <Button
                onClick={() => {
                  const resetValues = getDefaultValuesFromFields(fields, {})
                  setValues(resetValues)
                  setErrors({})
                  setSubmitted(false)
                }}
                disabled={disabled || isSubmitting}
              >
                Reset
              </Button>
            </Space>
          </Form.Item>
        )}

        {/* Contenido personalizado (botones, etc.) */}
        {children && (
          <Form.Item className={styles.submitContainer}>
            {children}
          </Form.Item>
        )}
      </Form>
    </div>
  )
}

export default UIForm