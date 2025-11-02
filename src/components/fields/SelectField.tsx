import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { Select, Spin } from 'antd'
import { ErrorMessage, FieldLabel } from '../commons'
import { useFormContext } from '../../hooks/useFormContext'
import type { SelectFieldProps } from '../../types'
import styles from './Field.module.css'

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
  // Obtener contexto del formulario
  const { 
    formValues, 
    getAsyncOptions, 
    setAsyncOptions, 
    isAsyncLoading, 
    setAsyncLoading,
    getAsyncError,
    setAsyncError 
  } = useFormContext()
  
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

  // Determinar si el campo usa async options y su ID
  const asyncLoaderId = asyncOptions?.id
  const hasAsyncOptions = useMemo(() => {
    return !!asyncOptions?.loader && !!asyncLoaderId
  }, [asyncOptions, asyncLoaderId])
  
  // Obtener opciones y estado desde el contexto
  const cachedOptions = asyncLoaderId ? getAsyncOptions(asyncLoaderId) : undefined
  const loading = asyncLoaderId ? isAsyncLoading(asyncLoaderId) : false
  const asyncError = asyncLoaderId ? getAsyncError(asyncLoaderId) : null

  // Ref para tracking de carga inicial
  const hasLoadedRef = useRef(false)
  const prevDepsRef = useRef<string>('')
  
  // Obtener valores de dependencias si existen
  const dependencies = asyncOptions?.dependencies || []
  const dependencyValuesStr = JSON.stringify(dependencies.map(dep => formValues[dep]))
  
  // Cargar opciones async al montar o cuando cambien las dependencias
  useEffect(() => {
    if (!hasAsyncOptions || !asyncLoaderId) return
    
    const asyncConfig = asyncOptions
    if (!asyncConfig?.loader) return
    
    // Verificar si ya se cargó y las dependencias no cambiaron
    const depsChanged = prevDepsRef.current !== dependencyValuesStr
    
    if (hasLoadedRef.current && !depsChanged && !asyncConfig.searchable) {
      return // Ya se cargó y no hay cambios en dependencias
    }
    
    // Si hay opciones en cache y no cambiaron las dependencias, no recargar
    if (cachedOptions && cachedOptions.length > 0 && !depsChanged && !asyncConfig.searchable) {
      hasLoadedRef.current = true
      return
    }
    
    const loadAsyncOptions = async () => {
      if (!asyncConfig.loader) return // Extra safety check
      
      setAsyncLoading(asyncLoaderId, true)
      setAsyncError(asyncLoaderId, null)
      
      try {
        // Pasar el contexto completo al loader
        const result = await asyncConfig.loader({ formValues, search: '' })
        setAsyncOptions(asyncLoaderId, result.options || [])
        hasLoadedRef.current = true
        prevDepsRef.current = dependencyValuesStr
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to load options'
        setAsyncError(asyncLoaderId, errorMsg)
        setAsyncOptions(asyncLoaderId, [])
      } finally {
        setAsyncLoading(asyncLoaderId, false)
      }
    }

    loadAsyncOptions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasAsyncOptions, asyncLoaderId, dependencyValuesStr])

  // Handler para búsqueda en async options
  const handleSearch = useCallback(async (searchValue: string) => {
    const asyncConfig = asyncOptions
    if (!asyncConfig?.loader || !asyncConfig.searchable || !asyncLoaderId) return

    setAsyncLoading(asyncLoaderId, true)
    setAsyncError(asyncLoaderId, null)
    
    try {
      // Pasar el contexto completo al loader
      const result = await asyncConfig.loader({ search: searchValue, formValues })
      setAsyncOptions(asyncLoaderId, result.options || [])
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to search options'
      setAsyncError(asyncLoaderId, errorMsg)
      setAsyncOptions(asyncLoaderId, [])
    } finally {
      setAsyncLoading(asyncLoaderId, false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asyncOptions, asyncLoaderId, formValues])

  // Determinar las opciones a usar
  const selectOptions = useMemo(() => {
    // Si tiene async options, usar las del cache
    if (hasAsyncOptions && cachedOptions && cachedOptions.length > 0) {
      return cachedOptions.map((option: any) => {
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
  }, [options, hasAsyncOptions, cachedOptions])

  const defaultFilterOption = useCallback((input: string, option?: any) => {
    const label = option?.label || ''
    return label.toLowerCase().includes(input.toLowerCase())
  }, [])

  if (!isVisible) return null

  const asyncConfig = asyncOptions
  const isSearchable = hasAsyncOptions ? asyncConfig?.searchable : showSearch


  
  const {jsonType, _rootLayout, errorMessage, ...filteredAntdProps} = antdProps


  const selectProps = {
    id: name,
    value: value,
    onChange: handleChange,
    onBlur: handleBlur,
    placeholder: placeholder || `Select ${inputType === 'country' ? 'country' : 'option'}...`,
    disabled: disabled || loading,
    mode: multiple ? "multiple" as const : undefined,
    allowClear,
    showSearch: isSearchable,
    filterOption: hasAsyncOptions && asyncConfig?.searchable ? false : (filterOption || defaultFilterOption),
    onSearch: hasAsyncOptions && asyncConfig?.searchable ? handleSearch : undefined,
    loading,
    notFoundContent: loading ? <Spin size="small" /> : (asyncError ? asyncError : undefined),
    options: selectOptions,
    getPopupContainer: (trigger: any) => trigger.parentElement,
    status: (error || asyncError) && (isTouched || submitted) ? ("error" as "" | "error" | "warning") : undefined,
    'aria-invalid': !!(error || asyncError),
    'aria-describedby': (error || asyncError) ? `${name}-error` : undefined,
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
      
      <Select {...selectProps} />
      
      {(isTouched || submitted) && (
        <ErrorMessage error={error || asyncError} fieldName={name} />
      )}
    </div>
  )
}
