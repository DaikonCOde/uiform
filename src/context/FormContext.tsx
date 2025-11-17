import React, { useReducer, useCallback, useMemo, useRef, useEffect } from 'react'
import { FormContext, FormContextState, FormContextValue, formReducer } from './reduce'

// Reexportar tipos y contexto
export { FormContext, type FormContextState, type FormContextValue } from './reduce'
export type { AsyncOptionsCache } from './reduce'


// Estado inicial
const initialState: FormContextState = {
  formValues: {},
  asyncOptionsCache: {},
}

// Provider
interface FormProviderProps {
  children: React.ReactNode
  initialValues?: Record<string, any>
}

export function FormProvider({ children, initialValues = {} }: FormProviderProps) {
  const [state, dispatch] = useReducer(formReducer, {
    ...initialState,
    formValues: initialValues,
  })

  // Ref to hold latest formValues without triggering re-renders
  const formValuesRef = useRef(state.formValues)

  // Update ref whenever formValues change
  useEffect(() => {
    formValuesRef.current = state.formValues
  }, [state.formValues])

  // Métodos para actualizar valores del formulario
  const updateFormValue = useCallback((name: string, value: any) => {
    dispatch({ type: 'UPDATE_FORM_VALUE', payload: { name, value } })
  }, [])

  const setFormValues = useCallback((values: Record<string, any>) => {
    dispatch({ type: 'SET_FORM_VALUES', payload: values })
  }, [])

  // Métodos para gestionar cache de async options
  const setAsyncOptions = useCallback((loaderId: string, options: any[]) => {
    dispatch({ type: 'SET_ASYNC_OPTIONS', payload: { loaderId, options } })
  }, [])

  const getAsyncOptions = useCallback((loaderId: string) => {
    return state.asyncOptionsCache[loaderId]?.options
  }, [state.asyncOptionsCache])

  const setAsyncLoading = useCallback((loaderId: string, isLoading: boolean) => {
    dispatch({ type: 'SET_ASYNC_LOADING', payload: { loaderId, isLoading } })
  }, [])

  const setAsyncError = useCallback((loaderId: string, error: string | null) => {
    dispatch({ type: 'SET_ASYNC_ERROR', payload: { loaderId, error } })
  }, [])

  const isAsyncLoading = useCallback((loaderId: string) => {
    return state.asyncOptionsCache[loaderId]?.isLoading || false
  }, [state.asyncOptionsCache])

  const getAsyncError = useCallback((loaderId: string) => {
    return state.asyncOptionsCache[loaderId]?.error || null
  }, [state.asyncOptionsCache])

  const clearAsyncCache = useCallback((loaderId?: string) => {
    dispatch({ type: 'CLEAR_ASYNC_CACHE', payload: loaderId })
  }, [])

  // Getter function to access formValues without subscribing to state changes
  // This uses ref so it doesn't cause re-renders when called
  const getFormValues = useCallback(() => {
    return formValuesRef.current
  }, [])

  // Memoizar el valor del contexto
  // NOTA: Incluimos state completo por compatibilidad con SelectField
  // AutocompleteField usa getFormValues() para evitar re-renders
  const contextValue = useMemo<FormContextValue>(
    () => ({
      ...state,
      updateFormValue,
      setFormValues,
      getFormValues,
      setAsyncOptions,
      getAsyncOptions,
      setAsyncLoading,
      setAsyncError,
      isAsyncLoading,
      getAsyncError,
      clearAsyncCache,
    }),
    [
      state,
      updateFormValue,
      setFormValues,
      getFormValues,
      setAsyncOptions,
      getAsyncOptions,
      setAsyncLoading,
      setAsyncError,
      isAsyncLoading,
      getAsyncError,
      clearAsyncCache,
    ]
  )

  return <FormContext.Provider value={contextValue}>{children}</FormContext.Provider>
}
