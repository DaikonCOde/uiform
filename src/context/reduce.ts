import { createContext } from "react"

// Tipos para el contexto
export interface AsyncOptionsCache {
  [loaderId: string]: {
    options: any[]
    timestamp: number
    isLoading: boolean
    error: string | null
  }
}

export interface FormContextState {
  formValues: Record<string, any>
  asyncOptionsCache: AsyncOptionsCache
}

export interface FormContextValue extends FormContextState {
  // Métodos para actualizar valores del formulario
  updateFormValue: (name: string, value: any) => void
  setFormValues: (values: Record<string, any>) => void
  getFormValues: () => Record<string, any>

  // Métodos para gestionar cache de async options
  setAsyncOptions: (loaderId: string, options: any[]) => void
  getAsyncOptions: (loaderId: string) => any[] | undefined
  setAsyncLoading: (loaderId: string, isLoading: boolean) => void
  setAsyncError: (loaderId: string, error: string | null) => void
  isAsyncLoading: (loaderId: string) => boolean
  getAsyncError: (loaderId: string) => string | null

  // Método para limpiar cache
  clearAsyncCache: (loaderId?: string) => void
}

// Acciones del reducer
type FormAction =
  | { type: 'UPDATE_FORM_VALUE'; payload: { name: string; value: any } }
  | { type: 'SET_FORM_VALUES'; payload: Record<string, any> }
  | { type: 'SET_ASYNC_OPTIONS'; payload: { loaderId: string; options: any[] } }
  | { type: 'SET_ASYNC_LOADING'; payload: { loaderId: string; isLoading: boolean } }
  | { type: 'SET_ASYNC_ERROR'; payload: { loaderId: string; error: string | null } }
  | { type: 'CLEAR_ASYNC_CACHE'; payload?: string }

// Reducer
export function formReducer(state: FormContextState, action: FormAction): FormContextState {
  switch (action.type) {
    case 'UPDATE_FORM_VALUE':
      return {
        ...state,
        formValues: {
          ...state.formValues,
          [action.payload.name]: action.payload.value,
        },
      }
    
    case 'SET_FORM_VALUES':
      return {
        ...state,
        formValues: action.payload,
      }
    
    case 'SET_ASYNC_OPTIONS':
      return {
        ...state,
        asyncOptionsCache: {
          ...state.asyncOptionsCache,
          [action.payload.loaderId]: {
            ...state.asyncOptionsCache[action.payload.loaderId],
            options: action.payload.options,
            timestamp: Date.now(),
            isLoading: false,
            error: null,
          },
        },
      }
    
    case 'SET_ASYNC_LOADING':
      return {
        ...state,
        asyncOptionsCache: {
          ...state.asyncOptionsCache,
          [action.payload.loaderId]: {
            ...(state.asyncOptionsCache[action.payload.loaderId] || { options: [], timestamp: 0, error: null }),
            isLoading: action.payload.isLoading,
          },
        },
      }
    
    case 'SET_ASYNC_ERROR':
      return {
        ...state,
        asyncOptionsCache: {
          ...state.asyncOptionsCache,
          [action.payload.loaderId]: {
            ...(state.asyncOptionsCache[action.payload.loaderId] || { options: [], timestamp: 0, isLoading: false }),
            error: action.payload.error,
          },
        },
      }
    
    case 'CLEAR_ASYNC_CACHE':
      if (action.payload) {
        // Limpiar un loader específico
        const { [action.payload]: _, ...rest } = state.asyncOptionsCache
        return {
          ...state,
          asyncOptionsCache: rest,
        }
      }
      // Limpiar todo el cache
      return {
        ...state,
        asyncOptionsCache: {},
      }
    
    default:
      return state
  }
}

// Crear el contexto
export const FormContext = createContext<FormContextValue | undefined>(undefined)
