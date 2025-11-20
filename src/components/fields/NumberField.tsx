import { useState, useCallback } from 'react'
import { InputNumber } from 'antd'
import { ErrorMessage, FieldLabel } from '../commons'
import type { NumberFieldProps } from '../../types'
import styles from './Field.module.css'

export function NumberField({
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
  min,
  max,
  step,
  precision,
  ...antdProps
}: NumberFieldProps) {
  const [internalTouched, setInternalTouched] = useState(false)
  const isTouched = touched ?? internalTouched

  const handleChange = useCallback((val: string | number | null) => {
    if (!internalTouched) setInternalTouched(true)
    // Always convert to number or null for onChange
    const parsedValue = typeof val === 'string' ? (val === '' ? null : Number(val)) : val
    onChange(name, parsedValue)
  }, [name, onChange, internalTouched])

  const handleBlur = useCallback(() => {
    if (!internalTouched) setInternalTouched(true)
    onBlur?.(name)
  }, [name, onBlur, internalTouched])

  if (!isVisible) return null

  // Configuración específica para money
  const moneyConfig = inputType === 'money' ? {
    formatter: (value?: string | number) => 
      value ? `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '',
    parser: (value?: string) => 
      value?.replace(/\$\s?|(,*)/g, '') || '',
    precision: precision ?? 2,
  } : {}

  const {type, jsonType, _rootLayout, errorMessage, getFormValues,...filteredAntdProps} = antdProps

  const inputProps = {
    id: name,
    value: typeof value === 'number' ? value : value === null || value === undefined ? undefined : Number(value),
    onChange: handleChange,
    onBlur: handleBlur,
    placeholder,
    disabled,
    min,
    max,
    step,
    precision: inputType === 'money' ? 2 : precision,
    status: error && (isTouched || submitted) ? ("error" as "" | "error" | "warning") : undefined,
    'aria-invalid': !!error,
    'aria-describedby': error ? `${name}-error` : undefined,
    'aria-required': required,
    style: { width: '100%' },
    ...moneyConfig,
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
      
      <InputNumber {...inputProps} />
      
      {(isTouched || submitted) && (
        <ErrorMessage error={error} fieldName={name} />
      )}
    </div>
  )
}