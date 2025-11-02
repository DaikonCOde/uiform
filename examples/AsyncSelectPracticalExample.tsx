import { useState } from 'react'
import type { AsyncOptionsLoader } from '@remoteoss/json-schema-form'
import { UIForm } from '../src'
import { Alert, Space } from 'antd'

/**
 * Ejemplo práctico de asyncOptions con UIForm
 * 
 * Este ejemplo muestra:
 * - Loader simple con datos mock
 * - Búsqueda con debounce
 * - Campos dependientes (país -> estados)
 * - Manejo de errores
 */

// Datos mock para simular API
const MOCK_COUNTRIES = [
  { name: 'United States', code: 'US' },
  { name: 'Canada', code: 'CA' },
  { name: 'Mexico', code: 'MX' },
  { name: 'Brazil', code: 'BR' },
  { name: 'Argentina', code: 'AR' },
  { name: 'United Kingdom', code: 'GB' },
  { name: 'France', code: 'FR' },
  { name: 'Germany', code: 'DE' },
  { name: 'Spain', code: 'ES' },
  { name: 'Italy', code: 'IT' },
]

const MOCK_STATES: Record<string, any[]> = {
  US: [
    { name: 'California', code: 'CA' },
    { name: 'New York', code: 'NY' },
    { name: 'Texas', code: 'TX' },
    { name: 'Florida', code: 'FL' },
  ],
  CA: [
    { name: 'Ontario', code: 'ON' },
    { name: 'Quebec', code: 'QC' },
    { name: 'British Columbia', code: 'BC' },
  ],
  MX: [
    { name: 'Ciudad de México', code: 'CDMX' },
    { name: 'Jalisco', code: 'JAL' },
    { name: 'Nuevo León', code: 'NL' },
  ],
}

const MOCK_CITIES = [
  'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix',
  'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose',
  'Austin', 'Jacksonville', 'Fort Worth', 'Columbus', 'San Francisco',
  'Charlotte', 'Indianapolis', 'Seattle', 'Denver', 'Washington',
]

// Helper para simular delay de API
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Loader 1: Países (simple)
const countriesLoader: AsyncOptionsLoader = async () => {
  // Simular delay de API
  await delay(800)
  
  return {
    options: MOCK_COUNTRIES.map(country => ({
      label: country.name,
      value: country.code,
    })),
  }
}

// Loader 2: Ciudades con búsqueda
const citiesLoader: AsyncOptionsLoader = async (context) => {
  const { search } = context
  
  // Simular delay de API
  await delay(500)
  
  let filtered = MOCK_CITIES
  
  if (search) {
    filtered = MOCK_CITIES.filter(city =>
      city.toLowerCase().includes(search.toLowerCase())
    )
  }
  
  return {
    options: filtered.map(city => ({
      label: city,
      value: city.toLowerCase().replace(/\s+/g, '-'),
    })),
  }
}

// Loader 3: Estados dependientes del país
const statesLoader: AsyncOptionsLoader = async (context) => {
  const { formValues } = context
  const countryCode = formValues.country
  
  // Si no hay país seleccionado, retornar vacío
  if (!countryCode) {
    return { options: [] }
  }
  
  // Simular delay de API
  await delay(600)
  
  const states = MOCK_STATES[countryCode] || []
  
  return {
    options: states.map(state => ({
      label: state.name,
      value: state.code,
    })),
  }
}

// Schema del formulario
const schema = {
  type: 'object',
  required: ['country'],
  properties: {
    country: {
      type: 'string',
      title: 'Country',
      description: 'Select your country (async loaded)',
      'x-jsf-presentation': {
        inputType: 'select',
        asyncOptions: {
          id: 'countries-loader',
        },
      },
    },
    state: {
      type: 'string',
      title: 'State/Province',
      description: 'Options depend on selected country',
      'x-jsf-presentation': {
        inputType: 'select',
        asyncOptions: {
          id: 'states-loader',
          dependencies: ['country'],
        },
      },
    },
    city: {
      type: 'string',
      title: 'City',
      description: 'Type to search (searchable)',
      'x-jsf-presentation': {
        inputType: 'select',
        asyncOptions: {
          id: 'cities-loader',
          searchable: true,
          debounceMs: 500,
        },
      },
    },
  },
}

export function AsyncSelectPracticalExample() {
  const [submittedValues, setSubmittedValues] = useState<any>(null)

  // Registrar todos los loaders
  const asyncLoaders = {
    'countries-loader': countriesLoader,
    'cities-loader': citiesLoader,
    'states-loader': statesLoader,
  }

  const handleSubmit = (values: any) => {
    setSubmittedValues(values)
    console.log('Form submitted:', values)
  }

  return (
    <div style={{ maxWidth: 700, margin: '40px auto', padding: '0 20px' }}>
      <h1>🌍 Async Select - Ejemplo Práctico</h1>
      
      <Alert
        message="Características demostradas"
        description={
          <ul style={{ marginBottom: 0 }}>
            <li>✅ <strong>Carga asíncrona</strong>: El campo "Country" carga opciones al montar</li>
            <li>✅ <strong>Búsqueda</strong>: El campo "City" permite buscar mientras escribes</li>
            <li>✅ <strong>Dependencias</strong>: El campo "State" depende del país seleccionado</li>
            <li>✅ <strong>Loading states</strong>: Muestra spinner mientras carga</li>
          </ul>
        }
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <UIForm
        schema={schema}
        asyncLoaders={asyncLoaders}
        onSubmit={handleSubmit}
        config={{
          layout: 'vertical',
        }}
      />

      {submittedValues && (
        <Alert
          message="Form Submitted Successfully"
          description={
            <div>
              <p>Los siguientes valores fueron enviados:</p>
              <pre style={{ 
                background: '#f5f5f5', 
                padding: '12px', 
                borderRadius: '4px',
                fontSize: '12px'
              }}>
                {JSON.stringify(submittedValues, null, 2)}
              </pre>
            </div>
          }
          type="success"
          showIcon
          closable
          onClose={() => setSubmittedValues(null)}
          style={{ marginTop: 24 }}
        />
      )}

      <div style={{ marginTop: 32, padding: 16, background: '#fafafa', borderRadius: 4 }}>
        <h3 style={{ margin: '0 0 12px 0' }}>💡 Tips</h3>
        <Space direction="vertical" size="small">
          <div>1. Selecciona un país primero para habilitar el campo de estado</div>
          <div>2. Escribe en el campo "City" para ver la búsqueda en acción</div>
          <div>3. Observa el spinner mientras las opciones se cargan</div>
        </Space>
      </div>
    </div>
  )
}

export default AsyncSelectPracticalExample
