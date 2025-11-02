import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { AutoComplete, Spin } from 'antd'
import { ErrorMessage, FieldLabel } from '../commons'
import { useFormContext } from '../../hooks/useFormContext'
import type { AutocompleteFieldProps } from '../../types'
import styles from './Field.module.css'

export const AutocompleteField = React.memo(function AutocompleteField({
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
  options,
  allowClear = true,
  asyncOptions,
  ...antdProps
}: AutocompleteFieldProps) {
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

  // Estado local para el texto que se muestra en el input
  const [inputValue, setInputValue] = useState<string>('')
  
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
  
  // Cargar opciones async al montar (si no es searchable)
  useEffect(() => {
    if (!hasAsyncOptions || !asyncLoaderId) return
    
    const asyncConfig = asyncOptions
    if (!asyncConfig?.loader || asyncConfig.searchable) return
    
    // Verificar si ya se cargó y las dependencias no cambiaron
    const depsChanged = prevDepsRef.current !== dependencyValuesStr
    
    if (hasLoadedRef.current && !depsChanged) {
      return // Ya se cargó y no hay cambios en dependencias
    }
    
    // Si hay opciones en cache y no cambiaron las dependencias, no recargar
    if (cachedOptions && cachedOptions.length > 0 && !depsChanged) {
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

  // Mapa de value -> label para encontrar el label cuando tenemos solo el value
  const valueToLabelMap = useMemo(() => {
    const map = new Map<string, string>()
    
    if (hasAsyncOptions && cachedOptions && cachedOptions.length > 0) {
      cachedOptions.forEach((option: any) => {
        if (typeof option === 'object' && option !== null) {
          map.set(String(option.value), option.label || option.title || String(option.value))
        } else {
          map.set(String(option), String(option))
        }
      })
    } else if (options && Array.isArray(options)) {
      options.forEach((option: any) => {
        if (typeof option === 'object' && option !== null) {
          map.set(String(option.value), option.label || option.title || String(option.value))
        } else {
          map.set(String(option), String(option))
        }
      })
    }
    
    return map
  }, [options, hasAsyncOptions, cachedOptions])

  // Referencia para saber si estamos escribiendo o si se seleccionó una opción
  const isSelectingRef = useRef(false)
  
  // Inicializar inputValue solo cuando se monta o cuando value cambia desde fuera
  const isFirstRender = useRef(true)
  
  useEffect(() => {
    // Solo actualizar en el primer render o si el value cambia desde un valor guardado
    if (isFirstRender.current) {
      isFirstRender.current = false
      if (value) {
        const label = valueToLabelMap.get(String(value))
        setInputValue(label || String(value))
      }
      return
    }
    
    // Solo actualizar si no estamos en medio de una selección
    if (isSelectingRef.current) {
      isSelectingRef.current = false
      return
    }
    
    // Si se limpia el value desde fuera (ej: reset del form), limpiar el input
    if (!value && inputValue) {
      setInputValue('')
    }
  }, [value]) // Solo depender de value

  // Handler para búsqueda en async options
  const handleSearch = useCallback(async (searchValue: string) => {
    const asyncConfig = asyncOptions
    
    // Si no hay configuración async o no es searchable, no hacer nada
    if (!asyncConfig?.loader || !asyncLoaderId) return
    
    // Si el searchValue está vacío y no es searchable, no buscar
    if (!searchValue && !asyncConfig.searchable) return

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
  
  // Handler cuando se selecciona una opción
  const handleSelect = useCallback((selectedValue: string, option: any) => {
    if (!internalTouched) setInternalTouched(true)
    
    // Marcar que estamos seleccionando para evitar que useEffect sobrescriba
    isSelectingRef.current = true
    
    // Actualizar el input con el label primero
    const label = option?.label || selectedValue
    setInputValue(label)
    
    // Guardar el value en el form state
    onChange(name, selectedValue)
  }, [name, onChange, internalTouched])
  
  // Handler cuando se cambia el input manualmente (sin seleccionar)
  const handleChange = useCallback((val: string) => {
    // NO actualizar el form state mientras se escribe
    // Solo actualizar el estado local del input
    setInputValue(val)
    
    // Solo limpiar el form value si el input se vacía completamente
    if (!val && value) {
      if (!internalTouched) setInternalTouched(true)
      onChange(name, '')
    }
  }, [name, onChange, value, internalTouched])

  const handleBlur = useCallback(() => {
    if (!internalTouched) setInternalTouched(true)
    onBlur?.(name)
  }, [name, onBlur, internalTouched])

  // Determinar las opciones a usar
  const autocompleteOptions = useMemo(() => {
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
          value: String(option)
        }
      })
    }
    
    return []
  }, [options, hasAsyncOptions, cachedOptions])

  if (!isVisible) return null

  const isSearchable = hasAsyncOptions ? asyncOptions?.searchable : true

  
  const {_rootLayout,jsonType, ...filteredAntdProps} = antdProps

  const autocompleteProps = {
    id: name,
    value: inputValue, // Usar inputValue en lugar de value del form
    onChange: handleChange,
    onSelect: handleSelect, // Agregar onSelect para cuando se elige una opción
    onBlur: handleBlur,
    onSearch: isSearchable ? handleSearch : undefined,
    placeholder: placeholder || `Search...`,
    disabled: disabled || loading,
    allowClear,
    options: autocompleteOptions,
    filterOption: false, // Desactivar filtrado local porque usamos búsqueda async
    getPopupContainer: (trigger: any) => trigger.parentElement,
    status: (error || asyncError) && (isTouched || submitted) ? ("error" as "" | "error" | "warning") : undefined,
    notFoundContent: loading ? <Spin size="small" /> : (asyncError ? asyncError : 'No results'),
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
      
      <AutoComplete {...autocompleteProps} />
      
      {(isTouched || submitted) && (
        <ErrorMessage error={error || asyncError} fieldName={name} />
      )}
    </div>
  )
})
