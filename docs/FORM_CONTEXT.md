# Form Context - Sistema de Estado Global

## 📋 Descripción

El formulario ahora incluye un **sistema de contexto global** implementado con `useContext` de React que gestiona:

- ✅ Estado completo del formulario (`formValues`)
- ✅ Cache automático de opciones async
- ✅ Estados de carga por loader
- ✅ Manejo de errores por loader

## 🎯 Beneficios

### 1. AsyncLoaders con contexto completo

Antes:
```typescript
const loader: AsyncOptionsLoader = async (context) => {
  const { formValues } = context
  // formValues estaba vacío: {}
}
```

Ahora:
```typescript
const loader: AsyncOptionsLoader = async (context) => {
  const { formValues } = context
  // formValues contiene el estado completo del formulario
  // { country: 'US', state: 'CA', description: '...' }
}
```

### 2. Cache automático

Las opciones async se cachean automáticamente por `loaderId`. No se recargan innecesariamente.

### 3. Campos dependientes

Ahora es fácil crear campos que dependen de otros:

```typescript
const statesLoader: AsyncOptionsLoader = async (context) => {
  const { formValues } = context
  const countryCode = formValues.country
  
  if (!countryCode) {
    return { options: [] }
  }
  
  // Cargar estados basados en el país seleccionado
  const states = await fetchStates(countryCode)
  return { options: states }
}
```

## 🔧 Uso Básico

### Formulario Simple

```typescript
import { UIForm } from './components/form'
import type { AsyncOptionsLoader } from '@remoteoss/json-schema-form'

const countriesLoader: AsyncOptionsLoader = async (context) => {
  console.log('Form values:', context.formValues)
  
  const countries = await fetchCountries()
  return { options: countries }
}

const schema = {
  type: 'object',
  properties: {
    country: {
      type: 'string',
      title: 'Country',
      'x-jsf-presentation': {
        inputType: 'select',
        asyncOptions: {
          id: 'countries-loader', // ⚠️ El ID es obligatorio
        },
      },
    },
  },
}

function MyForm() {
  return (
    <UIForm
      schema={schema}
      asyncLoaders={{
        'countries-loader': countriesLoader,
      }}
    />
  )
}
```

## 🚀 Uso Avanzado

### Acceder al contexto en componentes personalizados

Si necesitas acceder al contexto del formulario en tus propios componentes:

```typescript
import { useFormContext } from './components/form'

function MyCustomComponent() {
  const { 
    formValues,           // Estado completo del formulario
    updateFormValue,      // Actualizar un valor
    setFormValues,        // Actualizar múltiples valores
    getAsyncOptions,      // Obtener opciones del cache
    setAsyncOptions,      // Guardar opciones en cache
    isAsyncLoading,       // Verificar si está cargando
    getAsyncError,        // Obtener error si existe
  } = useFormContext()
  
  return (
    <div>
      <p>País seleccionado: {formValues.country}</p>
    </div>
  )
}
```

### Cache Manual

```typescript
import { useFormContext } from './components/form'

function MyComponent() {
  const { setAsyncOptions, getAsyncOptions } = useFormContext()
  
  // Guardar opciones en cache
  setAsyncOptions('my-loader-id', [
    { label: 'Option 1', value: '1' },
    { label: 'Option 2', value: '2' },
  ])
  
  // Obtener opciones del cache
  const options = getAsyncOptions('my-loader-id')
}
```

## 📊 API del Contexto

### FormContextValue

```typescript
interface FormContextValue {
  // Estado
  formValues: Record<string, any>
  asyncOptionsCache: AsyncOptionsCache
  
  // Métodos para valores del formulario
  updateFormValue: (name: string, value: any) => void
  setFormValues: (values: Record<string, any>) => void
  
  // Métodos para async options
  setAsyncOptions: (loaderId: string, options: any[]) => void
  getAsyncOptions: (loaderId: string) => any[] | undefined
  setAsyncLoading: (loaderId: string, isLoading: boolean) => void
  setAsyncError: (loaderId: string, error: string | null) => void
  isAsyncLoading: (loaderId: string) => boolean
  getAsyncError: (loaderId: string) => string | null
  
  // Utilidades
  clearAsyncCache: (loaderId?: string) => void
}
```

### AsyncOptionsCache

```typescript
interface AsyncOptionsCache {
  [loaderId: string]: {
    options: any[]
    timestamp: number
    isLoading: boolean
    error: string | null
  }
}
```

## 🎨 Ejemplo Completo

Ver `examples/AsyncContextExample.tsx` para un ejemplo completo funcional.

## ⚠️ Notas Importantes

1. **LoaderId obligatorio**: El `id` en `asyncOptions` ahora es obligatorio para el cache
2. **No usar fuera de FormProvider**: El hook `useFormContext` solo funciona dentro de un `UIForm`
3. **Cache persistente**: Las opciones se cachean durante toda la vida del formulario

## 🔄 Migración

Si ya usabas `asyncLoaders`, no necesitas cambiar nada. El sistema es compatible hacia atrás, solo que ahora:

1. Los loaders reciben `formValues` reales
2. Las opciones se cachean automáticamente
3. No hay recargas innecesarias

## 🐛 Debugging

Para ver el contexto en acción, añade logs en tus loaders:

```typescript
const myLoader: AsyncOptionsLoader = async (context) => {
  console.log('🔍 Loader context:', context)
  console.log('📝 Form values:', context.formValues)
  
  // ...
}
```

## 📚 Recursos

- Ver `examples/AsyncContextExample.tsx` para pruebas
- Ver `examples/AsyncSelectPracticalExample.tsx` para casos de uso reales
- Ver `src/context/FormContext.tsx` para la implementación
