import React, { useState } from 'react'
import { UIForm } from '../src'

// Simulación de búsqueda de países
const searchCountries = async (query: string = '') => {
  // Simulación de delay de red
  await new Promise(resolve => setTimeout(resolve, 300))
  
  const countries = [
    { value: 'US', label: 'United States' },
    { value: 'MX', label: 'Mexico' },
    { value: 'CA', label: 'Canada' },
    { value: 'BR', label: 'Brazil' },
    { value: 'AR', label: 'Argentina' },
    { value: 'CL', label: 'Chile' },
    { value: 'CO', label: 'Colombia' },
    { value: 'PE', label: 'Peru' },
    { value: 'ES', label: 'Spain' },
    { value: 'FR', label: 'France' },
    { value: 'DE', label: 'Germany' },
    { value: 'IT', label: 'Italy' },
    { value: 'UK', label: 'United Kingdom' },
  ]
  
  // Filtrar por query si existe
  if (query) {
    const filtered = countries.filter(country => 
      country.label.toLowerCase().includes(query.toLowerCase()) ||
      country.value.toLowerCase().includes(query.toLowerCase())
    )
    return { options: filtered }
  }
  
  return { options: countries }
}

// Async loader para el formulario
const asyncLoaders = {
  'countries-loader': async (context: any) => {
    const query = context?.search || ''
    return searchCountries(query)
  }
}

export function AutocompleteExample() {
  const [formValues, setFormValues] = useState({})
  const [formErrors, setFormErrors] = useState({})

  const schema = {
    type: 'object',
    properties: {
      country: {
        type: 'string',
        title: 'Country',
        description: 'Start typing to search for a country',
        'x-jsf-presentation': {
          inputType: 'autocomplete',
          asyncOptions: { 
            id: 'countries-loader',
            searchable: true // Habilita la búsqueda
          },
        },
      },
      city: {
        type: 'string',
        title: 'City',
        description: 'Your city name',
        'x-jsf-presentation': {
          inputType: 'autocomplete',
        },
      },
    },
    required: ['country'],
  }

  return (
    <div style={{ padding: '24px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Autocomplete Field Example</h1>
      
      <UIForm
        schema={schema}
        asyncLoaders={asyncLoaders}
        onChange={(values, errors) => {
          setFormValues(values)
          setFormErrors(errors || {})
          console.log('Form changed:', { values, errors })
        }}
        onSubmit={async (values, errors) => {
          console.log('Form submitted:', { values, errors })
          alert(JSON.stringify(values, null, 2))
        }}
        config={{
          validateTrigger: 'onChange',
          size: 'large',
        }}
      />

      <div style={{ marginTop: '24px', padding: '16px', background: '#f5f5f5', borderRadius: '4px' }}>
        <h3>Form State (Values Saved):</h3>
        <pre>{JSON.stringify(formValues, null, 2)}</pre>
        <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
          ℹ️ Notice: The <strong>value</strong> is saved (e.g., "US"), but the <strong>label</strong> is displayed ("United States")
        </p>
        
        {Object.keys(formErrors).length > 0 && (
          <>
            <h3>Errors:</h3>
            <pre style={{ color: 'red' }}>{JSON.stringify(formErrors, null, 2)}</pre>
          </>
        )}
      </div>
    </div>
  )
}

export default AutocompleteExample
