import { useState, useCallback, useMemo, useEffect } from 'react'
import { Select, Spin } from 'antd'
import { ErrorMessage, FieldLabel } from '../commons'
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

  // Estado para async options
  const [asyncOptionsState, setAsyncOptionsState] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [asyncError, setAsyncError] = useState<string | null>(null)

  // Determinar si el campo usa async options
  const hasAsyncOptions = useMemo(() => {
    return !!asyncOptions?.loader
  }, [asyncOptions])

  // Cargar opciones async al montar o cuando cambien las dependencias
  useEffect(() => {
    const loadAsyncOptions = async () => {
      const asyncConfig = asyncOptions
      if (!asyncConfig?.loader) return

      setLoading(true)
      setAsyncError(null)
      
      try {
        const result = await asyncConfig.loader({formValues: {}})
        setAsyncOptionsState(result.options || [])
      } catch (err) {
        setAsyncError(err instanceof Error ? err.message : 'Failed to load options')
        setAsyncOptionsState([])
      } finally {
        setLoading(false)
      }
    }

    if (hasAsyncOptions) {
      loadAsyncOptions()
    }
  }, [hasAsyncOptions, asyncOptions])

  // Handler para búsqueda en async options
  const handleSearch = useCallback(async (searchValue: string) => {
    const asyncConfig = asyncOptions
    if (!asyncConfig?.loader || !asyncConfig.searchable) return

    setLoading(true)
    setAsyncError(null)
    
    try {
      const result = await asyncConfig.loader({search: searchValue, formValues: {}})
      setAsyncOptionsState(result.options || [])
    } catch (err) {
      setAsyncError(err instanceof Error ? err.message : 'Failed to search options')
      setAsyncOptionsState([])
    } finally {
      setLoading(false)
    }
  }, [asyncOptions])

  // Determinar las opciones a usar
  const selectOptions = useMemo(() => {
    // Si tiene async options, usar esas
    if (hasAsyncOptions && asyncOptionsState.length > 0) {
      return asyncOptionsState.map((option: any) => {
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
  }, [options, hasAsyncOptions, asyncOptionsState])

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
