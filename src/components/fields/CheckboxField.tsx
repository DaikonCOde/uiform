import { useState, useCallback } from 'react'
import { Checkbox } from 'antd'
import { ErrorMessage, FieldLabel } from '../commons'
import type { CheckboxFieldProps } from '../../types'
import styles from './Field.module.css'

export function CheckboxField({
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
  checkboxValue,
  children,
  indeterminate,
  autoFocus,
  ...antdProps
}: CheckboxFieldProps) {
  const [internalTouched, setInternalTouched] = useState(false)
  const isTouched = touched ?? internalTouched

  const handleChange = useCallback((e: any) => {
    if (!internalTouched) setInternalTouched(true)
    
    // Determinar el valor a enviar basado en checkboxValue
    let newValue: any
    
    if (checkboxValue !== undefined) {
      // Si hay un checkboxValue específico, usarlo cuando esté checked
      newValue = e.target.checked ? checkboxValue : null
    } else {
      // Comportamiento booleano estándar
      newValue = e.target.checked
    }
    
    onChange(name, newValue)
  }, [name, onChange, internalTouched, checkboxValue])

  const handleBlur = useCallback(() => {
    if (!internalTouched) setInternalTouched(true)
    onBlur?.(name)
  }, [name, onBlur, internalTouched])

  if (!isVisible) return null

  // Determinar si el checkbox está checked
  const isChecked = checkboxValue !== undefined 
    ? value === checkboxValue 
    : Boolean(value)

  const {type, jsonType, _rootLayout, errorMessage, getFormValues,...filteredAntdProps} = antdProps

  const checkboxProps = {
    id: name,
    checked: isChecked,
    onChange: handleChange,
    onBlur: handleBlur,
    disabled,
    indeterminate,
    autoFocus,
    'aria-invalid': !!error,
    'aria-describedby': error ? `${name}-error` : undefined,
    'aria-required': required,
    ...filteredAntdProps
  }

  // Para checkboxes, el label puede ser parte del children o separado
  const checkboxLabel = children || label
  const showSeparateLabel = label && children && label !== children

  return (
    <div className={`${styles.field} ${className || ''}`} style={style}>
      {showSeparateLabel && (
        <FieldLabel 
          label={label} 
          required={required}
          htmlFor={name}
          description={description}
        />
      )}
      
      <div className={styles.checkboxContainer}>
        <Checkbox {...checkboxProps}>
          {checkboxLabel}
        </Checkbox>
        
        {!showSeparateLabel && description && (
          <div className={styles.checkboxDescription}>
            {description}
          </div>
        )}
      </div>
      
      {(isTouched || submitted) && (
        <ErrorMessage error={error} fieldName={name} />
      )}
    </div>
  )
}