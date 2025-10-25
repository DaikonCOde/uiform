import React, { useState, useCallback } from 'react'
import { Input } from 'antd'
import { ErrorMessage, FieldLabel } from '../commons'
import type { TextareaFieldProps } from '../../types'
import styles from './Field.module.css'

const { TextArea } = Input

export function TextareaField({
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
  rows = 4,
  autoSize,
  showCount,
  ...antdProps
}: TextareaFieldProps) {
  const [internalTouched, setInternalTouched] = useState(false)
  const isTouched = touched ?? internalTouched

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!internalTouched) setInternalTouched(true)
    onChange(name, e.target.value)
  }, [name, onChange, internalTouched])

  const handleBlur = useCallback(() => {
    if (!internalTouched) setInternalTouched(true)
    onBlur?.(name)
  }, [name, onBlur, internalTouched])

  if (!isVisible) return null

  const textareaProps = {
    id: name,
    value: value || '',
    onChange: handleChange,
    onBlur: handleBlur,
    placeholder,
    disabled,
    maxLength,
    rows,
    autoSize,
    showCount,
    status: error && (isTouched || submitted) ? ("error" as "" | "error" | "warning") : undefined,
    'aria-invalid': !!error,
    'aria-describedby': error ? `${name}-error` : undefined,
    'aria-required': required,
    ...antdProps
  }

  return (
    <div className={`${styles.field} ${className || ''}`} style={style}>
      <FieldLabel 
        label={label} 
        required={required} 
        htmlFor={name}
        description={description}
      />
      
      <TextArea {...textareaProps} />
      
      {(isTouched || submitted) && (
        <ErrorMessage error={error} fieldName={name} />
      )}
    </div>
  )
}