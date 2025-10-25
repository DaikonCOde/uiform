import React from 'react'
import styles from './label.module.css'

interface FieldLabelProps {
  label?: string
  required?: boolean
  htmlFor?: string
  description?: string
  className?: string
  style?: React.CSSProperties
}

export function FieldLabel({ 
  label, 
  required, 
  htmlFor, 
  description, 
  className,
  style 
}: FieldLabelProps) {
  if (!label) return null

  return (
    <div className={`${styles.container} ${className || ''}`} style={style}>
      <label 
        htmlFor={htmlFor}
        className={styles.label}
      >
        {label}
        {required && (
          <span className={styles.required}>
            *
          </span>
        )}
      </label>
      {description && (
        <div className={styles.description}>
          {description}
        </div>
      )}
    </div>
  )
}
