import styles from './errorMessage.module.css'

interface ErrorMessageProps {
  error?: string | Record<string, any>
  fieldName?: string
}

export function ErrorMessage({ error, fieldName }: ErrorMessageProps) {
  if (!error) return null

  // Si el error es un string simple
  if (typeof error === 'string') {
    return (
      <div className={styles.error}>
        {error}
      </div>
    )
  }

  // Si es un objeto con múltiples errores
  if (typeof error === 'object') {
    const errorMessages = Object.values(error).filter(Boolean)
    if (errorMessages.length === 0) return null

    return (
      <div className={styles.errorContainer}>
        {errorMessages.map((msg, index) => (
          <div 
            key={`${fieldName}-error-${index}`}
            className={`${styles.errorItem} ${index > 0 ? styles.errorItemSpaced : ''}`}
          >
            {typeof msg === 'string' ? msg : JSON.stringify(msg)}
          </div>
        ))}
      </div>
    )
  }

  return null
}
