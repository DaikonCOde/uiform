/* eslint-disable @typescript-eslint/no-explicit-any */
// Select presentacional sobre Ant Design: async autocontenido vía useAsyncOptions (sin FormContext). (ARCHITECTURE_V2.md §8)

import { useState, useCallback, useMemo, useRef } from 'react'
import { Select, Spin } from 'antd'
import { ErrorMessage, FieldLabel } from '../commons'
import { useAsyncOptions } from '../../hooks/useAsyncOptions'
import type { SelectFieldProps } from '../../types'
import styles from './Field.module.css'

// Normaliza una opción (objeto u escalar) al shape { label, value } que espera Ant Design.
function toOption(option: any) {
  if (typeof option === 'object' && option !== null) {
    return {
      label: option.label || option.title || String(option.value),
      value: option.value,
      disabled: option.disabled,
      ...option,
    }
  }
  return { label: String(option), value: option }
}

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
  showSearch = false,
  filterOption,
  asyncOptions,
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

  // El async vive en el store: activo solo si el field trae asyncOptions.id (lo splatea el motor). (ARCHITECTURE_V2.md §8)
  const asyncLoaderId = asyncOptions?.id
  const hasAsyncOptions = !!asyncLoaderId
  const searchable = (asyncOptions as any)?.searchable

  // Suscripción granular a async[loaderId] + recarga al cambiar deps; inerte si no hay loaderId.
  const {
    options: asyncLoadedOptions,
    loading,
    error: asyncError,
    reload,
  } = useAsyncOptions(asyncLoaderId, asyncOptions?.dependencies)

  // Búsqueda async: re-invoca el loader del store con el término (debounce simple para no spamear). (ARCHITECTURE_V2.md §8)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const handleSearch = useCallback((searchValue: string) => {
    if (!hasAsyncOptions || !searchable) return
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => reload(searchValue), 250)
  }, [hasAsyncOptions, searchable, reload])

  // Si el field es async, la fuente es SIEMPRE el store (aunque venga vacío): así una búsqueda con 0
  // resultados muestra notFoundContent y no cae a las estáticas (opciones stale). Estáticas solo sin async.
  const selectOptions = useMemo(() => {
    const source = hasAsyncOptions
      ? asyncLoadedOptions
      : Array.isArray(options)
        ? options
        : []
    return source.map(toOption)
  }, [hasAsyncOptions, asyncLoadedOptions, options])

  const defaultFilterOption = useCallback((input: string, option?: any) => {
    const optionLabel = option?.label || ''
    return optionLabel.toLowerCase().includes(input.toLowerCase())
  }, [])

  if (isVisible === false) return null

  const isSearchable = hasAsyncOptions ? !!searchable : showSearch

  // Stripping de props internas del motor (no son props válidas de <Select>). (ARCHITECTURE_V2.md §1 bis)
  const { type, jsonType, _rootLayout, errorMessage, getFormValues, ...filteredAntdProps } = antdProps

  const selectProps = {
    id: name,
    value,
    onChange: handleChange,
    onBlur: handleBlur,
    placeholder: placeholder || `Seleccioná ${inputType === 'country' ? 'un país' : 'una opción'}...`,
    disabled: disabled || loading,
    mode: multiple ? ('multiple' as const) : undefined,
    allowClear,
    showSearch: isSearchable,
    // En búsqueda async el filtrado lo hace el loader (server-side) → desactivamos el filtro local.
    filterOption: hasAsyncOptions && searchable ? false : (filterOption || defaultFilterOption),
    onSearch: hasAsyncOptions && searchable ? handleSearch : undefined,
    loading,
    notFoundContent: loading ? <Spin size="small" /> : (asyncError ?? undefined),
    options: selectOptions,
    getPopupContainer: (trigger: any) => trigger.parentElement,
    status:
      (error || asyncError) && (isTouched || submitted)
        ? ('error' as '' | 'error' | 'warning')
        : undefined,
    'aria-invalid': !!(error || asyncError),
    'aria-describedby': (error || asyncError) ? `${name}-error` : undefined,
    'aria-required': required,
    style: { width: '100%' },
    ...filteredAntdProps,
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
        <ErrorMessage error={error || asyncError} fieldName={name} />
      )}
    </div>
  )
}
