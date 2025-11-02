import React, { useState, useCallback } from 'react'
import { Input } from 'antd'
import { ErrorMessage, FieldLabel } from '../commons'
import type { TextFieldProps } from '../../types'
import styles from './TextField.module.css'

export function TextField({
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
  maxLength,
  ...antdProps
}: TextFieldProps) {
  const [internalTouched, setInternalTouched] = useState(false)
  const isTouched = touched ?? internalTouched

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!internalTouched) setInternalTouched(true)
    onChange(name, e.target.value)
  }, [name, onChange, internalTouched])

  const handleBlur = useCallback(() => {
    if (!internalTouched) setInternalTouched(true)
    onBlur?.(name)
  }, [name, onBlur, internalTouched])

  if (!isVisible) return null

  // Campo oculto
  if (inputType === 'hidden') {
    return <input type="hidden" name={name} value={value || ''} />
  }

  const {type, jsonType, _rootLayout, errorMessage, ...filteredAntdProps} = antdProps

  const inputProps = {
    id: name,
    type: inputType === 'email' ? 'email' : 'text',
    value: value || '',
    onChange: handleChange,
    onBlur: handleBlur,
    placeholder,
    disabled,
    maxLength,
    status: error && (isTouched || submitted) ? ("error" as "" | "error" | "warning") : undefined,
    'aria-invalid': !!error,
    'aria-describedby': error ? `${name}-error` : undefined,
    'aria-required': required,
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
      
      <Input {...inputProps} />
      
      {(isTouched || submitted) && (
        <ErrorMessage error={error} fieldName={name} />
      )}
    </div>
  )
}