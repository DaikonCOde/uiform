# Async Options en UIForm

Esta guía explica cómo usar `asyncOptions` para cargar opciones de manera asíncrona en los campos select de UIForm.

## ¿Qué es asyncOptions?

`asyncOptions` permite que los campos `select` carguen sus opciones de forma dinámica desde APIs, servicios externos o cualquier fuente de datos asíncrona, en lugar de definirlas estáticamente en el schema.

## Características

✅ **Carga asíncrona**: Las opciones se cargan cuando el campo se monta  
✅ **Búsqueda en tiempo real**: Filtra opciones mientras el usuario escribe  
✅ **Estado de carga**: Muestra un spinner mientras carga las opciones  
✅ **Manejo de errores**: Muestra mensajes de error si falla la carga  
✅ **Dependencias**: Soporte para campos que dependen de otros  
✅ **Compatible**: Funciona con el SelectField existente, sin cambios

## Uso Básico

### 1. Define el Schema

Agrega `asyncOptions` a tu campo select:

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
          id: 'countries-loader',  // ID único del loader
        },
      },
    },
  },
}
```

### 2. Crea el Loader

Define una función que cargue las opciones:

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

### 3. Usa el Formulario con asyncLoaders

Pasa el loader directamente a UIForm:

```typescript
<UIForm
  schema={schema}
  asyncLoaders={{
    'countries-loader': countriesLoader,  // El ID debe coincidir
  }}
  onSubmit={(values) => {
    console.log('Form submitted:', values)
  }}
/>
```

## Características Avanzadas

### Búsqueda

Habilita búsqueda para filtrar opciones:

```typescript
// En el schema
{
  city: {
    type: 'string',
    title: 'City',
    'x-jsf-presentation': {
      inputType: 'select',
      asyncOptions: {
        id: 'cities-loader',
        searchable: true,       // Habilita búsqueda
        debounceMs: 500,        // Tiempo de espera antes de buscar
      },
    },
  },
}

// En el loader
const citiesLoader: AsyncOptionsLoader = async (context) => {
  const { search } = context
  
  const response = await fetch(`/api/cities?search=${search || ''}`)
  const data = await response.json()
  
  return {
    options: data.map(city => ({
      label: city.name,
      value: city.id,
    })),
  }
}
```

### Campos Dependientes

Crea opciones que dependen de otros campos:

```typescript
// En el schema
{
  country: {
    type: 'string',
    title: 'Country',
    'x-jsf-presentation': {
      inputType: 'select',
      asyncOptions: { id: 'countries-loader' },
    },
  },
  state: {
    type: 'string',
    title: 'State',
    'x-jsf-presentation': {
      inputType: 'select',
      asyncOptions: {
        id: 'states-loader',
        dependencies: ['country'],  // Depende del campo country
      },
    },
  },
}

// En el loader
const statesLoader: AsyncOptionsLoader = async (context) => {
  const { formValues } = context
  const countryCode = formValues.country
  
  if (!countryCode) {
    return { options: [] }
  }
  
  const response = await fetch(`/api/states?country=${countryCode}`)
  const data = await response.json()
  
  return {
    options: data.map(state => ({
      label: state.name,
      value: state.code,
    })),
  }
}
```

### Manejo de Errores

Los errores se muestran automáticamente:

```typescript
const usersLoader: AsyncOptionsLoader = async (context) => {
  const response = await fetch('/api/users')
  
  if (!response.ok) {
    throw new Error('Failed to load users')
  }
  
  return {
    options: await response.json(),
  }
}
```

## Cómo Funciona

1. **Detección**: El componente `SelectField` detecta si el campo tiene `asyncOptions.loadOptions`
2. **Carga inicial**: Al montar, se llama automáticamente a `loadOptions()` para cargar las opciones
3. **Estado de carga**: Muestra un spinner y deshabilita el campo mientras carga
4. **Búsqueda**: Si `searchable: true`, al escribir se llama a `loadOptions(searchValue)`
5. **Errores**: Si falla, muestra el mensaje de error debajo del campo

## Ventajas

### ✅ Simplicidad
- No necesitas crear un componente nuevo
- El `SelectField` existente maneja todo automáticamente
- Código más limpio y fácil de mantener

### ✅ Consistencia
- Misma interfaz que los select normales
- Mismo estilo y comportamiento
- Mismos props de Ant Design disponibles

### ✅ Funcionalidad Completa
- Estados de carga
- Manejo de errores
- Búsqueda en tiempo real
- Soporte para dependencias

## Ejemplo Completo

Ver el archivo `examples/AsyncSelectExample.tsx` para ejemplos completos de uso.

## Diferencias con Select Normal

| Feature | Select Normal | Async Select |
|---------|--------------|--------------|
| Opciones | Definidas en el schema | Cargadas dinámicamente |
| Búsqueda | Filtrado local | Búsqueda en servidor |
| Carga | Instantánea | Muestra spinner |
| Errores | N/A | Manejo automático |
| Dependencias | N/A | Soporte nativo |

## Tips

1. **Loader simple**: Mantén tus loaders enfocados en una sola responsabilidad
2. **Manejo de errores**: Siempre maneja errores en tus loaders
3. **Búsqueda**: Usa `debounceMs` para evitar llamadas excesivas a la API
4. **Dependencias**: Verifica que las dependencias existan antes de hacer la llamada
5. **Testing**: Mockea las llamadas a API en tus tests

## Troubleshooting

### El campo no carga opciones

- Verifica que el `asyncOptions.id` coincida con el registrado en `asyncLoaders`
- Revisa que el loader esté retornando el formato correcto: `{ options: [...] }`

### Errores de tipos

```typescript
// Asegúrate de importar los tipos correctos
import type { AsyncOptionsLoader } from '@remoteoss/json-schema-form'
```

### La búsqueda no funciona

- Verifica que `searchable: true` esté en el schema
- Asegúrate de que el loader use el parámetro `search` del contexto

## Referencias

- [Documentación oficial de json-schema-form](/Users/alexocsa/Documents/dev/projects/json-schema-form/docs/ASYNC_SELECT.md)
- [Quick Start de async options](/Users/alexocsa/Documents/dev/projects/json-schema-form/docs/ASYNC_SELECT_QUICK_START.md)
