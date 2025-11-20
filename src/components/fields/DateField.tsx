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
  format = 'YYYY-MM-DD',
  showTime = false,
  picker = 'date',
  allowClear = true,
  ...antdProps
}: DateFieldProps) {
  const [internalTouched, setInternalTouched] = useState(false)
  const isTouched = touched ?? internalTouched

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
          // Prioridad 1: Formato pasado como prop
          if (format && format !== 'YYYY-MM-DD') {
            parsed = dayjs(value, format, true)
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
  }, [value, format])

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
    // Prioridad 1: Formato pasado como prop
    if (format && format !== 'YYYY-MM-DD') {
      return showTime ? `${format} HH:mm:ss` : format
    }
    
    // Formato por defecto
    return showTime ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD'
  }, [format, showTime])

  if (!isVisible) return null

  const {type, jsonType, _rootLayout, errorMessage, getFormValues,...filteredAntdProps} = antdProps

  const datePickerProps = {
    id: name,
    value: dayjsValue,
    onChange: handleChange,
    onBlur: handleBlur,
    placeholder: placeholder || `Select ${picker}...`,
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