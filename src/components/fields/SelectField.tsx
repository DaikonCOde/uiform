import { useState, useCallback, useMemo } from 'react'
import { Select } from 'antd'
import { ErrorMessage, FieldLabel } from '../commons'
import type { SelectFieldProps } from '../../types'
import styles from './Field.module.css'

// Lista de países (simplificada para el ejemplo)
const COUNTRIES = [
  { label: 'Afghanistan', value: 'AF' },
  { label: 'Albania', value: 'AL' },
  { label: 'Algeria', value: 'DZ' },
  { label: 'Argentina', value: 'AR' },
  { label: 'Australia', value: 'AU' },
  { label: 'Austria', value: 'AT' },
  { label: 'Brazil', value: 'BR' },
  { label: 'Canada', value: 'CA' },
  { label: 'Chile', value: 'CL' },
  { label: 'China', value: 'CN' },
  { label: 'Colombia', value: 'CO' },
  { label: 'France', value: 'FR' },
  { label: 'Germany', value: 'DE' },
  { label: 'India', value: 'IN' },
  { label: 'Italy', value: 'IT' },
  { label: 'Japan', value: 'JP' },
  { label: 'Mexico', value: 'MX' },
  { label: 'Peru', value: 'PE' },
  { label: 'Spain', value: 'ES' },
  { label: 'United Kingdom', value: 'GB' },
  { label: 'United States', value: 'US' },
  { label: 'Venezuela', value: 'VE' },
]

export function SelectField({
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
  multiple,
  options,
  allowClear = true,
  showSearch = true,
  filterOption,
  ...antdProps
}: SelectFieldProps) {
  const [internalTouched, setInternalTouched] = useState(false)
  const isTouched = touched ?? internalTouched

  const handleChange = useCallback((val: any) => {
    if (!internalTouched) setInternalTouched(true)
    onChange(name, val)
  }, [name, onChange, internalTouched])

  const handleBlur = useCallback(() => {
    if (!internalTouched) setInternalTouched(true)
    onBlur?.(name)
  }, [name, onBlur, internalTouched])

  // Determinar las opciones a usar
  const selectOptions = useMemo(() => {
    if (inputType === 'country') {
      return COUNTRIES
    }
    
    if (options && Array.isArray(options)) {
      return options.map((option: any) => {
        if (typeof option === 'object' && option !== null) {
          return {
            label: option.label || option.title || String(option.value),
            value: option.value,
            disabled: option.disabled,
            ...option
          }
        }
        return {
          label: String(option),
          value: option
        }
      })
    }
    
    return []
  }, [inputType, options])

  const defaultFilterOption = useCallback((input: string, option?: any) => {
    const label = option?.label || ''
    return label.toLowerCase().includes(input.toLowerCase())
  }, [])

  if (!isVisible) return null


  const selectProps = {
    id: name,
    value: value,
    onChange: handleChange,
    onBlur: handleBlur,
    placeholder: placeholder || `Select ${inputType === 'country' ? 'country' : 'option'}...`,
    disabled,
    mode: multiple ? "multiple" as const : undefined,
    allowClear,
    showSearch,
    filterOption: filterOption || defaultFilterOption,
    options: selectOptions,
    status: error && (isTouched || submitted) ? ("error" as "" | "error" | "warning") : undefined,
    'aria-invalid': !!error,
    'aria-describedby': error ? `${name}-error` : undefined,
    'aria-required': required,
    style: { width: '100%' },
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
      
      <Select {...selectProps} />
      
      {(isTouched || submitted) && (
        <ErrorMessage error={error} fieldName={name} />
      )}
    </div>
  )
}