import { useState, useCallback } from 'react'
import { Upload, Button, message } from 'antd'
import { UploadOutlined, InboxOutlined } from '@ant-design/icons'
import type { UploadProps, UploadFile, RcFile } from 'antd/es/upload/interface'
import { ErrorMessage, FieldLabel } from '../commons'
import type { FileFieldProps } from '../../types'

const { Dragger } = Upload

export function FileField({
  name,
  label,
  description,
  value,
  inputType,
  required,
  isVisible,
  error,
  submitted,
  touched,
  onChange,
  onBlur,
  className,
  style,
  disabled,
  accept,
  maxFileSize,
  multiple = false,
  listType = 'text',
  showUploadList = true,
  customRequest,
  beforeUpload,
  ...antdProps
}: FileFieldProps) {
  const [internalTouched, setInternalTouched] = useState(false)
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const isTouched = touched ?? internalTouched

  const handleChange = useCallback((info: any) => {
    if (!internalTouched) setInternalTouched(true)
    
    const { fileList: newFileList } = info
    setFileList(newFileList)
    
    // Convertir archivos a base64 o mantener la información del archivo
    const processedFiles = newFileList.map((file: UploadFile) => {
      if (file.status === 'done' || file.originFileObj) {
        return {
          uid: file.uid,
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.originFileObj?.lastModified,
          // Para archivos pequeños, podemos convertir a base64
          file: file.originFileObj
        }
      }
      return file
    })
    
    const finalValue = multiple ? processedFiles : processedFiles[0] || null
    onChange(name, finalValue)
  }, [name, onChange, internalTouched, multiple])

  const handleRemove = useCallback((file: UploadFile) => {
    const newFileList = fileList.filter(item => item.uid !== file.uid)
    setFileList(newFileList)
    
    const finalValue = multiple ? newFileList : newFileList[0] || null
    onChange(name, finalValue)
  }, [fileList, name, onChange, multiple])

  const handleBeforeUpload = useCallback((file: any) => {
    // Validación de tamaño de archivo
    if (maxFileSize && file.size > maxFileSize) {
      message.error(`El archivo debe ser menor a ${Math.round(maxFileSize / 1024 / 1024)}MB`)
      return false
    }
    
    // Validación de tipo de archivo
    if (accept) {
      const fileType = file.type
      const fileName = file.name.toLowerCase()
      const acceptedTypes = accept.split(',').map(type => type.trim())
      
      const isValidType = acceptedTypes.some(acceptedType => {
        if (acceptedType.startsWith('.')) {
          return fileName.endsWith(acceptedType)
        } else {
          return fileType.includes(acceptedType.replace('*', ''))
        }
      })
      
      if (!isValidType) {
        message.error(`Tipo de archivo no válido. Tipos permitidos: ${accept}`)
        return false
      }
    }
    
    // Ejecutar beforeUpload personalizado si existe
    if (beforeUpload) {
      // Map fileList to RcFile[] using originFileObj
      const rcFileList = fileList
        .map((f: UploadFile) => f.originFileObj)
        .filter(Boolean) as RcFile[];
      return beforeUpload(file, rcFileList);
    }
    
    // Prevenir subida automática por defecto
    return false
  }, [maxFileSize, accept, beforeUpload, fileList])

  if (!isVisible) return null

  // Props comunes para Upload
  // Remove 'type' from antdProps to avoid passing it to Upload
  const { type, ...filteredAntdProps } = antdProps as any

  const uploadProps: UploadProps = {
    name,
    fileList,
    onChange: handleChange,
    onRemove: handleRemove,
    beforeUpload: handleBeforeUpload,
    customRequest: customRequest || (() => {}), // Prevenir subida real por defecto
    multiple,
    accept,
    disabled,
    listType,
    showUploadList,
    ...filteredAntdProps
  }

  // Renderizar según el tipo de lista
  const renderUploadComponent = () => {
    if (listType === 'picture-card' || listType === 'picture-circle') {
      return (
        <Upload {...uploadProps}>
          {(!multiple && fileList.length >= 1) ? null : (
            <div>
              <UploadOutlined />
              <div style={{ marginTop: 8 }}>Upload</div>
            </div>
          )}
        </Upload>
      )
    }

    // Drag and drop para archivos
    if (accept && (accept.includes('image') || accept.includes('.pdf') || accept.includes('.doc'))) {
      return (
        <Dragger {...uploadProps}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">
            Click or drag file to this area to upload
          </p>
          {description && (
            <p className="ant-upload-hint">
              {description}
            </p>
          )}
        </Dragger>
      )
    }

    // Upload button básico
    return (
      <Upload {...uploadProps}>
        <Button icon={<UploadOutlined />} disabled={disabled}>
          Select File{multiple ? 's' : ''}
        </Button>
      </Upload>
    )
  }

  return (
    <div className={className} style={style}>
      <FieldLabel 
        label={label} 
        required={required}
        description={listType === 'picture-card' ? description : undefined}
      />
      
      {renderUploadComponent()}
      
      {maxFileSize && (
        <div style={{ 
          fontSize: '12px', 
          color: 'rgba(0, 0, 0, 0.45)', 
          marginTop: '4px' 
        }}>
          Max file size: {Math.round(maxFileSize / 1024 / 1024)}MB
        </div>
      )}
      
      {(isTouched || submitted) && (
        <ErrorMessage error={error} fieldName={name} />
      )}
    </div>
  )
}