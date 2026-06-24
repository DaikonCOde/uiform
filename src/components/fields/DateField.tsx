import { useState, useCallback, useMemo } from 'react'
import { DatePicker } from 'antd'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import { ErrorMessage, FieldLabel } from '../commons'
import type { DateFieldProps } from '../../types'
import styles from './Field.module.css'

// Asegurar que dayjs puede manejar formatos personalizados
dayjs.extend(customParseFormat)

export function DateField({
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
  placeholder,
  minDate,
  maxDate,
  format,
  showTime = false,
  picker = 'date',
  allowClear = true,
  ...antdProps
}: DateFieldProps) {
  const [internalTouched, setInternalTouched] = useState(false)
  const isTouched = touched ?? internalTouched

  // El motor splatea el keyword JSON Schema `format` ("date" | "date-time" | "time") sobre el field, que
  // colisiona con el `format` de DISPLAY del DatePicker (dayjs lo interpretaría como tokens → basura, p.ej.
  // 'date' → '5amte'). Solo aceptamos como formato de display un string que NO sea un keyword del schema;
  // el consumidor configura el display real vía ui:options.format (ej. 'DD/MM/YYYY'). (tarea v2)
  const JSON_SCHEMA_FORMAT_KEYWORDS = new Set(['date', 'date-time', 'time'])
  const displayFormatProp =
    typeof format === 'string' && !JSON_SCHEMA_FORMAT_KEYWORDS.has(format) ? format : undefined

  const handleChange = useCallback((date: dayjs.Dayjs | null) => {
    if (!internalTouched) setInternalTouched(true)
    
    // Enviar el valor como string en formato correcto
    let newValue = null
    if (date && date.isValid()) {
      if (showTime) {
        // Para fechas con hora, usar ISO string
        newValue = date.toISOString()
      } else {
        // Para fechas sin hora, usar formato YYYY-MM-DD para compatibilidad con JSON Schema
        newValue = date.format('YYYY-MM-DD')
      }
    }
    
    onChange(name, newValue)
  }, [name, onChange, internalTouched, showTime])

  const handleBlur = useCallback(() => {
    if (!internalTouched) setInternalTouched(true)
    onBlur?.(name)
  }, [name, onBlur, internalTouched])

  // Procesar el valor para dayjs
  const dayjsValue = useMemo(() => {
    if (!value) return null
    
    try {
      let parsed;
      
      if (typeof value === 'string') {
        // Formatos comunes que podemos recibir
        const commonFormats = [
          'DD/MM/YYYY',     // Latam format
          'YYYY-MM-DD',     // ISO date
          'MM/DD/YYYY',     // US format
          'DD-MM-YYYY',     // European format
          'YYYY/MM/DD',     // Alternative ISO
        ]
        
        // Si el valor tiene tiempo (ISO string), parsear como ISO
        if (value.includes('T')) {
          parsed = dayjs(value) // ISO string
        }
        // Intentar parsear con formatos comunes
        else {
          // Prioridad 1: formato de display configurado por el consumidor (ui:options.format)
          if (displayFormatProp && displayFormatProp !== 'YYYY-MM-DD') {
            parsed = dayjs(value, displayFormatProp, true)
            if (parsed.isValid()) {
              return parsed
            }
          }
          
          // Luego intentar con formatos comunes
          for (const fmt of commonFormats) {
            parsed = dayjs(value, fmt, true)
            if (parsed.isValid()) {
              return parsed
            }
          }
          
          // Último recurso: parsing automático
          parsed = dayjs(value)
        }
      } else {
        // Para valores no string (Date, number, etc.)
        parsed = dayjs(value)
      }
      
      // Verificar que la fecha sea válida
      if (parsed && parsed.isValid()) {
        return parsed
      }
      
      return null
    } catch {
      return null
    }
  }, [value, displayFormatProp])

  // Procesar las fechas mín y máx
  const disabledDate = useCallback((current: any) => {
    if (!current) return false
    
    const currentDate = current.startOf('day')
    let isDisabled = false
    
    if (minDate) {
      const min = dayjs(minDate).startOf('day')
      if (currentDate.isBefore(min)) {
        isDisabled = true
      }
    }
    
    if (maxDate) {
      const max = dayjs(maxDate).startOf('day')
      if (currentDate.isAfter(max)) {
        isDisabled = true
      }
    }
    
    return isDisabled
  }, [minDate, maxDate])

  // Determinar el formato de visualización
  const displayFormat = useMemo(() => {
    // Prioridad 1: formato de display configurado por el consumidor (ui:options.format)
    if (displayFormatProp && displayFormatProp !== 'YYYY-MM-DD') {
      return showTime ? `${displayFormatProp} HH:mm:ss` : displayFormatProp
    }

    // Formato por defecto (estable, ISO-like para el display)
    return showTime ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD'
  }, [displayFormatProp, showTime])

  if (!isVisible) return null

  const {type, jsonType, _rootLayout, errorMessage, getFormValues,...filteredAntdProps} = antdProps

  const datePickerProps = {
    id: name,
    value: dayjsValue,
    onChange: handleChange,
    onBlur: handleBlur,
    placeholder: placeholder || 'Seleccioná una fecha',
    disabled,
    format: displayFormat, // Formato flexible de visualización
    showTime,
    picker,
    allowClear,
    disabledDate,
    getPopupContainer: (trigger: any) => trigger.parentElement,
    status: error && (isTouched || submitted) ? ("error" as "" | "error" | "warning") : undefined,
    'aria-invalid': !!error,
    'aria-describedby': error ? `${name}-error` : undefined,
    'aria-required': required,
    style: { width: '100%' },
    ...filteredAntdProps
  }

  return (
    <div className={`${styles.field} ${className || ''}`} style={style}>
      <FieldLabel 
        label={label} 
        required={required} 
        htmlFor={name}
        description={description}
      />
      
      <DatePicker {...datePickerProps} />
      
      {(isTouched || submitted) && (
        <ErrorMessage error={error} fieldName={name} />
      )}
    </div>
  )
}