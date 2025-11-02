# AsyncOptions - Quick Start

Guía rápida para usar opciones asíncronas en UIForm.

## En 3 Pasos

### 1️⃣ Define el Schema

```typescript
const schema = {
  type: 'object',
  properties: {
    country: {
      type: 'string',
      title: 'Country',
      'x-jsf-presentation': {
        inputType: 'select',
        asyncOptions: {
          id: 'countries-loader',  // ID único
        },
      },
    },
  },
}
```

### 2️⃣ Crea el Loader

```typescript
import type { AsyncOptionsLoader } from '@remoteoss/json-schema-form'

const countriesLoader: AsyncOptionsLoader = async (context) => {
  const response = await fetch('/api/countries')
  const data = await response.json()
  
  return {
    options: data.map(country => ({
      label: country.name,
      value: country.code,
    })),
  }
}
```

### 3️⃣ Usa UIForm

```typescript
<UIForm
  schema={schema}
  asyncLoaders={{
    'countries-loader': countriesLoader,  // El ID debe coincidir
  }}
  onSubmit={(values) => console.log(values)}
/>
```

## Características

### ✅ Búsqueda

```typescript
// En el schema
asyncOptions: {
  id: 'cities-loader',
  searchable: true,
  debounceMs: 500,
}

// En el loader
const citiesLoader: AsyncOptionsLoader = async (context) => {
  const { search } = context
  const response = await fetch(`/api/cities?search=${search || ''}`)
  return { options: await response.json() }
}
```

### ✅ Dependencias

```typescript
// Schema
{
  country: {
    'x-jsf-presentation': {
      inputType: 'select',
      asyncOptions: { id: 'countries-loader' },
    },
  },
  state: {
    'x-jsf-presentation': {
      inputType: 'select',
      asyncOptions: {
        id: 'states-loader',
        dependencies: ['country'],  // Depende de country
      },
    },
  },
}

// Loader
const statesLoader: AsyncOptionsLoader = async (context) => {
  const { formValues } = context
  const countryCode = formValues.country
  
  if (!countryCode) return { options: [] }
  
  const response = await fetch(`/api/states?country=${countryCode}`)
  return { options: await response.json() }
}
```

### ✅ Manejo de Errores

```typescript
const loader: AsyncOptionsLoader = async (context) => {
  const response = await fetch('/api/data')
  
  if (!response.ok) {
    throw new Error('Failed to load options')
  }
  
  return { options: await response.json() }
}
```

## Ejemplo Completo

Ver `examples/AsyncSelectPracticalExample.tsx` para un ejemplo funcional con:
- Carga asíncrona automática
- Búsqueda en tiempo real
- Campos dependientes
- Estados de carga

## Comportamiento

El componente `SelectField` automáticamente:
- ✅ Carga opciones al montar
- ✅ Muestra spinner mientras carga
- ✅ Deshabilita el campo durante la carga
- ✅ Maneja errores y los muestra
- ✅ Filtra en servidor si `searchable: true`

## Más Información

- [Documentación completa](./ASYNC_OPTIONS.md)
- [Documentación oficial de json-schema-form](../../../json-schema-form/docs/ASYNC_SELECT.md)
