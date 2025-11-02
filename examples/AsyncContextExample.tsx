import { useState } from 'react'
import type { AsyncOptionsLoader } from '@remoteoss/json-schema-form'
import { UIForm } from '../src'
import { Alert, Space, Card } from 'antd'

/**
 * Ejemplo para verificar que el contexto funciona correctamente
 * 
 * Este ejemplo demuestra:
 * - Los asyncLoaders ahora reciben el contexto completo con formValues
 * - Cache automático de opciones async
 * - Estados dependientes funcionando correctamente
 */

// Datos mock
const MOCK_COUNTRIES = [
  { name: 'United States', code: 'US' },
  { name: 'Canada', code: 'CA' },
  { name: 'Mexico', code: 'MX' },
]

const MOCK_STATES: Record<string, any[]> = {
  US: [
    { name: 'California', code: 'CA' },
    { name: 'New York', code: 'NY' },
    { name: 'Texas', code: 'TX' },
  ],
  CA: [
    { name: 'Ontario', code: 'ON' },
    { name: 'Quebec', code: 'QC' },
    { name: 'British Columbia', code: 'BC' },
  ],
  MX: [
    { name: 'Ciudad de México', code: 'CDMX' },
    { name: 'Jalisco', code: 'JAL' },
  ],
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Loader de países - ahora recibe contexto completo
const countriesLoader: AsyncOptionsLoader = async (context) => {
  console.log('🌍 countriesLoader called with context:', context)
  
  await delay(500)
  
  return {
    options: MOCK_COUNTRIES.map(country => ({
      label: country.name,
      value: country.code,
    })),
  }
}

// Loader de estados - depende del país seleccionado
const statesLoader: AsyncOptionsLoader = async (context) => {
  console.log('🏙️ statesLoader called with context:', context)
  
  const { formValues } = context
  const countryCode = formValues.country
  
  console.log('Selected country:', countryCode)
  
  // Si no hay país seleccionado, retornar vacío
  if (!countryCode) {
    console.log('No country selected, returning empty')
    return { options: [] }
  }
  
  await delay(500)
  
  const states = MOCK_STATES[countryCode] || []
  
  console.log('Returning states:', states)
  
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
      title: 'País',
      description: 'Selecciona tu país',
      'x-jsf-presentation': {
        inputType: 'select',
        asyncOptions: {
          id: 'countries-loader',
        },
      },
    },
    state: {
      type: 'string',
      title: 'Estado/Provincia',
      description: 'Las opciones dependen del país seleccionado',
      'x-jsf-presentation': {
        inputType: 'select',
        asyncOptions: {
          id: 'states-loader',
          dependencies: ['country'],
        },
      },
    },
    description: {
      type: 'string',
      title: 'Descripción',
      description: 'Campo adicional para probar el contexto',
      'x-jsf-presentation': {
        inputType: 'textarea',
      },
    },
  },
}

export function AsyncContextExample() {
  const [submittedValues, setSubmittedValues] = useState<any>(null)

  // Registrar todos los loaders
  const asyncLoaders = {
    'countries-loader': countriesLoader,
    'states-loader': statesLoader,
  }

  const handleSubmit = (values: any) => {
    setSubmittedValues(values)
    console.log('✅ Form submitted:', values)
  }

  const handleChange = (values: any) => {
    console.log('📝 Form changed:', values)
  }

  return (
    <div style={{ maxWidth: 700, margin: '40px auto', padding: '0 20px' }}>
      <h1>🎯 Prueba de Contexto en AsyncLoaders</h1>
      
      <Alert
        message="¡Contexto implementado correctamente!"
        description={
          <ul style={{ marginBottom: 0 }}>
            <li>✅ Los asyncLoaders ahora reciben <code>formValues</code> completo</li>
            <li>✅ Cache automático de opciones async</li>
            <li>✅ Estados dependientes funcionan correctamente</li>
            <li>✅ Revisa la consola para ver los logs del contexto</li>
          </ul>
        }
        type="success"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Card title="Formulario" style={{ marginBottom: 24 }}>
        <UIForm
          schema={schema}
          asyncLoaders={asyncLoaders}
          onSubmit={handleSubmit}
          onChange={handleChange}
          config={{
            layout: 'vertical',
          }}
        />
      </Card>

      {submittedValues && (
        <Alert
          message="Formulario Enviado"
          description={
            <div>
              <p>Valores enviados:</p>
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
          type="info"
          showIcon
          closable
          onClose={() => setSubmittedValues(null)}
        />
      )}

      <Card title="💡 Instrucciones" style={{ marginTop: 24 }}>
        <Space direction="vertical" size="small">
          <div>1. <strong>Abre la consola del navegador</strong></div>
          <div>2. Selecciona un país (verás el log con el contexto)</div>
          <div>3. Observa cómo el campo de estado se actualiza automáticamente</div>
          <div>4. El statesLoader ahora tiene acceso a <code>formValues.country</code></div>
          <div>5. Las opciones se cachean automáticamente (no se recargan al remontar)</div>
        </Space>
      </Card>
    </div>
  )
}

export default AsyncContextExample
