import React from 'react'

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
    <div className={className} style={style}>
      <label 
        htmlFor={htmlFor}
        style={{
          display: 'block',
          marginBottom: '4px',
          fontSize: '14px',
          fontWeight: 500,
          color: 'rgba(0, 0, 0, 0.85)'
        }}
      >
        {label}
        {required && (
          <span 
            style={{ 
              color: '#ff4d4f', 
              marginLeft: '4px' 
            }}
          >
            *
          </span>
        )}
      </label>
      {description && (
        <div 
          style={{
            fontSize: '12px',
            color: 'rgba(0, 0, 0, 0.45)',
            marginBottom: '4px',
            lineHeight: '1.3'
          }}
        >
          {description}
        </div>
      )}
    </div>
  )
}
