import { useState, useCallback, useMemo } from 'react'
import { Radio, Space } from 'antd'
import { ErrorMessage, FieldLabel } from '../commons'
import type { RadioFieldProps } from '../../types'
import styles from './Field.module.css'

export function RadioField({
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
  options,
  size,
  optionType,
  buttonStyle,
  ...antdProps
}: RadioFieldProps) {
  const [internalTouched, setInternalTouched] = useState(false)
  const isTouched = touched ?? internalTouched

  const handleChange = useCallback((e: any) => {
    if (!internalTouched) setInternalTouched(true)
    onChange(name, e.target.value)
  }, [name, onChange, internalTouched])

  const handleBlur = useCallback(() => {
    if (!internalTouched) setInternalTouched(true)
    onBlur?.(name)
  }, [name, onBlur, internalTouched])

  // Procesar las opciones
  const radioOptions = useMemo(() => {
    if (!options || !Array.isArray(options)) return []
    
    return options.map((option: any) => {
      if (typeof option === 'object' && option !== null) {
        return {
          label: option.label || option.title || String(option.value),
          value: option.value,
          disabled: option.disabled || disabled,
          ...option
        }
      }
      return {
        label: String(option),
        value: option,
        disabled: disabled
      }
    })
  }, [options, disabled])

  if (!isVisible) return null

  const radioProps = {
    value: value,
    onChange: handleChange,
    onBlur: handleBlur,
    disabled,
    size,
    optionType,
    buttonStyle,
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
        description={description}
      />
      
      <Radio.Group {...radioProps}>
        <Space direction="vertical">
          {radioOptions.map((option, index) => (
            <Radio 
              key={`${name}-${index}`} 
              value={option.value}
              disabled={option.disabled}
              className={styles.radioOption}
            >
              {option.label}
            </Radio>
          ))}
        </Space>
      </Radio.Group>
      
      {(isTouched || submitted) && (
        <ErrorMessage error={error} fieldName={name} />
      )}
    </div>
  )
}