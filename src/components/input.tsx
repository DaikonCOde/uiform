// Este archivo ahora redirige al nuevo TextField para compatibilidad hacia atrás
import { TextField } from './fields/TextField'
import type { TextFieldProps } from '../types'

// Alias para compatibilidad
export const FieldInput = TextField

// Re-exportar el tipo con el nombre anterior para compatibilidad
export type FieldInputType = TextFieldProps
  