import { useState, useCallback, useMemo } from 'react'
import { DatePicker } from 'antd'
import dayjs from 'dayjs'
import { ErrorMessage, FieldLabel } from '../commons'
import type { DateFieldProps } from '../../types'

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

  const handleChange = useCallback((date: dayjs.Dayjs | null, dateString: string | string[]) => {
    if (!internalTouched) setInternalTouched(true)
    
    // Enviar el valor como string en formato ISO o el formato especificado
    let newValue = null
    if (date) {
      newValue = showTime ? date.toISOString() : Array.isArray(dateString) ? dateString[0] : dateString
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
      // Intentar parsear como fecha
      return dayjs(value)
    } catch {
      return null
    }
  }, [value])

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

  if (!isVisible) return null

  const datePickerProps = {
    id: name,
    value: dayjsValue,
    onChange: handleChange,
    onBlur: handleBlur,
    placeholder: placeholder || `Select ${picker}...`,
    disabled,
    format,
    showTime,
    picker,
    allowClear,
    disabledDate,
    status: error && (isTouched || submitted) ? ("error" as "" | "error" | "warning") : undefined,
    'aria-invalid': !!error,
    'aria-describedby': error ? `${name}-error` : undefined,
    'aria-required': required,
    style: { width: '100%' },
    ...antdProps
  }

  return (
    <div className={className} style={style}>
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