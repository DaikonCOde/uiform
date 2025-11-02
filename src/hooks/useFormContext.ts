import { useContext } from 'react'
import { FormContext, type FormContextValue } from '../context/reduce'

/**
 * Hook para acceder al contexto del formulario
 * 
 * @throws Error si se usa fuera de FormProvider
 * @returns FormContextValue con el estado y métodos del formulario
 * 
 * @example
 * const { formValues, updateFormValue, setAsyncOptions } = useFormContext()
 */
export function useFormContext(): FormContextValue {
  const context = useContext(FormContext)
  
  if (context === undefined) {
    throw new Error('useFormContext must be used within a FormProvider')
  }
  
  return context
}
