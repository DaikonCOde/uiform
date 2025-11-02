import type { AsyncOptionsLoader } from '@remoteoss/json-schema-form'
import { UIForm } from '../src'

// Ejemplo 1: Loader básico para países
const countriesLoader: AsyncOptionsLoader = async (context) => {
  const { search } = context
  
  // Simular una llamada a API
  const response = await fetch(`/api/countries?search=${search || ''}`)
  const data = await response.json()
  
  return {
    options: data.map((country: any) => ({
      label: country.name,
      value: country.code,
    })),
  }
}

// Ejemplo 2: Loader con búsqueda (sin llamada real, simulado)
const citiesLoader: AsyncOptionsLoader = async (context) => {
  const { search } = context
  
  // Simular delay de API
  await new Promise(resolve => setTimeout(resolve, 500))
  
  const allCities = [
    { name: 'New York', code: 'NYC' },
    { name: 'Los Angeles', code: 'LA' },
    { name: 'Chicago', code: 'CHI' },
    { name: 'Houston', code: 'HOU' },
    { name: 'Miami', code: 'MIA' },
  ]
  
  const filtered = search
    ? allCities.filter(city => 
        city.name.toLowerCase().includes(search.toLowerCase())
      )
    : allCities
  
  return {
    options: filtered.map(city => ({
      label: city.name,
      value: city.code,
    })),
  }
}

// Ejemplo 3: Loader con dependencias (estados según país)
const statesLoader: AsyncOptionsLoader = async (context) => {
  const { formValues } = context
  const countryCode = formValues.country
  
  if (!countryCode) {
    return { options: [] }
  }
  
  // Simular llamada a API dependiente
  const response = await fetch(`/api/states?country=${countryCode}`)
  const data = await response.json()
  
  return {
    options: data.map((state: any) => ({
      label: state.name,
      value: state.code,
    })),
  }
}

// Schema con asyncOptions
const schema = {
  type: 'object',
  properties: {
    country: {
      type: 'string',
      title: 'Country',
      'x-jsf-presentation': {
        inputType: 'select',
        asyncOptions: {
          id: 'countries-loader',
        },
      },
    },
    city: {
      type: 'string',
      title: 'City',
      'x-jsf-presentation': {
        inputType: 'select',
        asyncOptions: {
          id: 'cities-loader',
          searchable: true,
          debounceMs: 500,
        },
      },
    },
    state: {
      type: 'string',
      title: 'State',
      'x-jsf-presentation': {
        inputType: 'select',
        asyncOptions: {
          id: 'states-loader',
          dependencies: ['country'],
        },
      },
    },
  },
}

export function AsyncSelectExample() {
  // Registrar los loaders al momento de usar el formulario
  const asyncLoaders = {
    'countries-loader': countriesLoader,
    'cities-loader': citiesLoader,
    'states-loader': statesLoader,
  }

  return (
    <div style={{ maxWidth: 600, margin: '40px auto' }}>
      <h1>Async Select Example</h1>
      <p>Ejemplo de uso de asyncOptions con UIForm</p>
      
      <UIForm
        schema={schema}
        asyncLoaders={asyncLoaders}
        onSubmit={(values) => {
          console.log('Form submitted:', values)
        }}
      />
    </div>
  )
}

// Ejemplo simple sin dependencias
export function SimpleAsyncExample() {
  const simpleLoader: AsyncOptionsLoader = async () => {
    return {
      options: [
        { label: 'Option 1', value: '1' },
        { label: 'Option 2', value: '2' },
        { label: 'Option 3', value: '3' },
      ],
    }
  }

  const simpleSchema = {
    type: 'object',
    properties: {
      choice: {
        type: 'string',
        title: 'Choose an option',
        'x-jsf-presentation': {
          inputType: 'select',
          asyncOptions: {
            id: 'simple-loader',
          },
        },
      },
    },
  }

  return (
    <div style={{ maxWidth: 600, margin: '40px auto' }}>
      <h1>Simple Async Example</h1>
      <UIForm
        schema={simpleSchema}
        asyncLoaders={{
          'simple-loader': simpleLoader,
        }}
        onSubmit={(values) => {
          console.log('Form submitted:', values)
        }}
      />
    </div>
  )
}
