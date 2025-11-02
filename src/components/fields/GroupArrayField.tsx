import React, { useState, useCallback } from 'react'
import { Card, Button, Space, Popconfirm } from 'antd'
import { PlusOutlined, DeleteOutlined, DragOutlined } from '@ant-design/icons'
import { ErrorMessage, FieldLabel } from '../commons'
import type { GroupArrayFieldProps } from '../../types'
import styles from './Field.module.css'

interface GroupArrayFieldPropsExtended extends GroupArrayFieldProps {
  renderField: (field: any, index: number) => React.ReactNode
}

export function GroupArrayField({
  name,
  label,
  description,
  value = [],
  required,
  isVisible,
  error,
  submitted,
  touched,
  onChange,
  className,
  style,
  disabled,
  fields = [],
  renderField,
  // Props específicos del array
  minItems = 0,
  maxItems,
  addButtonText = 'Add Item',
  deleteButtonText = 'Delete',
  confirmDelete = true,
  allowReorder = false,
}: GroupArrayFieldPropsExtended & {
  minItems?: number
  maxItems?: number
  addButtonText?: string
  deleteButtonText?: string
  confirmDelete?: boolean
  allowReorder?: boolean
}) {
  const [internalTouched, setInternalTouched] = useState(false)
  const isTouched = touched ?? internalTouched

  const handleAddItem = useCallback(() => {
    if (!internalTouched) setInternalTouched(true)
    
    // Crear un nuevo item vacío basado en los campos
    const newItem = fields.reduce((acc, field) => {
      acc[field.name] = field.default || getDefaultValueForType(field.inputType)
      return acc
    }, {} as any)
    
    const newArray = Array.isArray(value) ? [...value, newItem] : [newItem]
    onChange(name, newArray)
  }, [name, onChange, value, fields, internalTouched])

  const handleRemoveItem = useCallback((index: number) => {
    if (!internalTouched) setInternalTouched(true)
    
    const newArray = Array.isArray(value) ? value.filter((_, i) => i !== index) : []
    onChange(name, newArray)
  }, [name, onChange, value, internalTouched])

  const handleItemChange = useCallback((itemIndex: number, fieldName: string, fieldValue: any) => {
    if (!internalTouched) setInternalTouched(true)
    
    const newArray = Array.isArray(value) ? [...value] : []
    if (!newArray[itemIndex]) {
      newArray[itemIndex] = {}
    }
    
    // Extraer el nombre del campo sin el prefijo del array
    const cleanFieldName = fieldName.replace(`${name}.${itemIndex}.`, '')
    newArray[itemIndex] = {
      ...newArray[itemIndex],
      [cleanFieldName]: fieldValue
    }
    
    onChange(name, newArray)
  }, [name, onChange, value, internalTouched])

  if (!isVisible) return null

  const arrayValue = Array.isArray(value) ? value : []
  const canAddMore = !maxItems || arrayValue.length < maxItems
  const canRemove = arrayValue.length > minItems

  return (
    <div className={`${styles.field} ${className || ''}`} style={style}>
      <FieldLabel 
        label={label} 
        required={required}
        description={description}
      />
      
      <div className={styles.arrayContainer}>
        {arrayValue.length === 0 ? (
          <div className={styles.arrayEmpty}>
            No items yet. Click "Add Item" to get started.
          </div>
        ) : (
          <Space direction="vertical" style={{ width: '100%' }}>
            {arrayValue.map((item, index) => {
              const itemKey = item.id || item._id || `${name}-${index}`
              return (
              <Card
                key={itemKey}
                size="small"
                style={{
                  ...(error && Array.isArray(error) && error[index] && (isTouched || submitted) ? 
                    { borderColor: '#ff4d4f' } : {})
                }}
                title={
                  <div className={styles.arrayItemHeader}>
                    <Space>
                      {allowReorder && (
                        <DragOutlined style={{ cursor: 'grab', color: 'rgba(0, 0, 0, 0.45)' }} />
                      )}
                      <span>Item {index + 1}</span>
                    </Space>
                    
                    {canRemove && !disabled && (
                      confirmDelete ? (
                        <Popconfirm
                          title="Are you sure you want to delete this item?"
                          onConfirm={() => handleRemoveItem(index)}
                          okText="Yes"
                          cancelText="No"
                        >
                          <Button 
                            type="text" 
                            danger 
                            size="small"
                            icon={<DeleteOutlined />}
                          >
                            {deleteButtonText}
                          </Button>
                        </Popconfirm>
                      ) : (
                        <Button 
                          type="text" 
                          danger 
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={() => handleRemoveItem(index)}
                        >
                          {deleteButtonText}
                        </Button>
                      )
                    )}
                  </div>
                }
                // TODO: validar que props se usarán para el card
                // {...cardProps}
              >
                <div className={styles.arrayItemFields}>
                  {fields.map((field, fieldIndex) => {
                    const nestedField = {
                      ...field,
                      name: `${name}.${index}.${field.name}`,
                      value: item ? item[field.name] : undefined,
                      error: error && Array.isArray(error) && error[index] && typeof error[index] === 'object' 
                        ? (error[index] as any)[field.name] 
                        : undefined,
                      submitted,
                      touched: isTouched,
                      disabled: disabled || field.disabled,
                      onChange: handleItemChange.bind(null, index)
                    }
                    
                    return renderField ? renderField(nestedField, fieldIndex) : (
                      <div key={`${name}-${index}-${field.name}`}>
                        <pre style={{ fontSize: '10px' }}>{JSON.stringify(nestedField, null, 1)}</pre>
                      </div>
                    )
                  })}
                </div>
                
                {/* Mostrar errores específicos del item */}
                {(isTouched || submitted) && error && Array.isArray(error) && 
                 error[index] && typeof error[index] === 'string' && (
                  <div className={styles.arrayItemError}>
                    <ErrorMessage error={error[index]} fieldName={`${name}[${index}]`} />
                  </div>
                )}
              </Card>
            )})
            }
          </Space>
        )}
        
        {canAddMore && !disabled && (
          <Button 
            type="dashed" 
            onClick={handleAddItem}
            icon={<PlusOutlined />}
            className={styles.arrayAddButton}
          >
            {addButtonText}
          </Button>
        )}
        
        {/* Mostrar errores generales del array */}
        {(isTouched || submitted) && error && typeof error === 'string' && (
          <ErrorMessage error={error} fieldName={name} />
        )}
        
        {/* Mostrar información de límites */}
        {(minItems > 0 || maxItems) && (
          <div className={styles.arrayLimits}>
            {minItems > 0 && `Min: ${minItems}`}
            {minItems > 0 && maxItems && ' • '}
            {maxItems && `Max: ${maxItems}`}
            {' • '}Current: {arrayValue.length}
          </div>
        )}
      </div>
    </div>
  )
}

// Función auxiliar para obtener valores por defecto según el tipo
function getDefaultValueForType(inputType: string): any {
  switch (inputType) {
    case 'text':
    case 'email':
    case 'textarea':
      return ''
    case 'number':
    case 'money':
      return null
    case 'boolean':
    case 'checkbox':
      return false
    case 'date':
      return null
    case 'select':
    case 'country':
    case 'radio':
      return null
    case 'file':
      return null
    case 'fieldset':
      return {}
    case 'group-array':
      return []
    default:
      return null
  }
}