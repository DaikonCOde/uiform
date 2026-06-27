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

  // value-checkbox = el motor le puso un checkboxValue NO booleano (un const string/number). Un
  // checkbox booleano lleva checkboxValue===true (lo inyecta el motor) o ninguno → la presencia sola
  // NO distingue; hay que mirar el TIPO. (probe browser: boolean destildaba a undefined en vez de false)
  const isValueCheckbox = checkboxValue !== undefined && typeof checkboxValue !== "boolean"

  const handleChange = useCallback((e: any) => {
    if (!internalTouched) setInternalTouched(true)

    // - value-checkbox (const no-booleano): el value al marcar; `undefined` al destildar (se OMITE del payload).
    // - checkbox booleano: true/false → destildar emite `false`, no null/undefined, para no romper validación.
    const newValue = isValueCheckbox
      ? (e.target.checked ? checkboxValue : undefined)
      : e.target.checked

    onChange(name, newValue)
  }, [name, onChange, internalTouched, checkboxValue, isValueCheckbox])

  const handleBlur = useCallback(() => {
    if (!internalTouched) setInternalTouched(true)
    onBlur?.(name)
  }, [name, onBlur, internalTouched])

  if (isVisible === false) return null

  // Checked: value-checkbox compara contra su const; booleano usa la veracidad del value.
  const isChecked = isValueCheckbox ? value === checkboxValue : Boolean(value)

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