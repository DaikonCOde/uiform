interface ErrorMessageProps {
  error?: string | Record<string, any>
  fieldName?: string
}

export function ErrorMessage({ error, fieldName }: ErrorMessageProps) {
  if (!error) return null

  // Si el error es un string simple
  if (typeof error === 'string') {
    return (
      <div 
        style={{ 
          color: '#ff4d4f', 
          fontSize: '12px', 
          marginTop: '4px',
          lineHeight: '1.2'
        }}
      >
        {error}
      </div>
    )
  }

  // Si es un objeto con múltiples errores
  if (typeof error === 'object') {
    const errorMessages = Object.values(error).filter(Boolean)
    if (errorMessages.length === 0) return null

    return (
      <div style={{ marginTop: '4px' }}>
        {errorMessages.map((msg, index) => (
          <div 
            key={`${fieldName}-error-${index}`}
            style={{ 
              color: '#ff4d4f', 
              fontSize: '12px', 
              marginTop: index > 0 ? '2px' : '0',
              lineHeight: '1.2'
            }}
          >
            {typeof msg === 'string' ? msg : JSON.stringify(msg)}
          </div>
        ))}
      </div>
    )
  }

  return null
}
