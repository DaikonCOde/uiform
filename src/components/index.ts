// Exportar componentes individuales
export * from './fields'
export * from './commons'

// Exportar componente principal (para compatibilidad)
export { FieldInput, type FieldInputType } from './input'

// Exportar hook principal
export { useFieldRenderer, type UseFieldRendererOptions } from '../hooks/useFieldRenderer'