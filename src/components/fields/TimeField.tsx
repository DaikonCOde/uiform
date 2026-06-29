/* eslint-disable @typescript-eslint/no-explicit-any */
// Widget de hora: TimePicker de AntD. El value se GUARDA wall-clock (sin zona) en el formato DECLARADO:
// "HH:mm" si el campo es de hora-minuto, "HH:mm:ss" si maneja segundos. Independiente del DISPLAY
// (ui:options.format). La validación del payload se declara con `pattern` en el schema, NO con
// format:"time" (ese keyword es RFC 3339 full-time y EXIGE offset, que un wall-clock no tiene). (widget time)

import { useState, useCallback, useMemo } from 'react'
import { TimePicker } from 'antd'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import { ErrorMessage, FieldLabel } from '../commons'
import type { TimeFieldProps } from '../../types'
import styles from './Field.module.css'

dayjs.extend(customParseFormat)

// El motor splatea el keyword JSON Schema `format` ("time"/"date"/"date-time") sobre el field, que
// colisiona con el `format` de DISPLAY (dayjs lo interpretaría como tokens → basura). Solo aceptamos como
// display un string que NO sea un keyword del schema; el consumidor lo configura vía ui:options.format.
const SCHEMA_FORMAT_KEYWORDS = new Set(['time', 'date', 'date-time'])
// Formatos que intentamos parsear de un value entrante.
const PARSE_FORMATS = ['HH:mm:ss', 'HH:mm', 'H:mm']

export function TimeField({
  name,
  label,
  description,
  value,
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
  placeholder,
  format,
  allowClear = true,
  showSecond = false,
  ...antdProps
}: TimeFieldProps) {
  const [internalTouched, setInternalTouched] = useState(false)
  const isTouched = touched ?? internalTouched

  const displayFormatProp =
    typeof format === 'string' && !SCHEMA_FORMAT_KEYWORDS.has(format) ? format : undefined
  // Display por defecto: HH:mm (o HH:mm:ss si se pide showSecond). El consumidor manda con ui:options.format.
  const displayFormat = displayFormatProp ?? (showSecond ? 'HH:mm:ss' : 'HH:mm')

  // Store canónico 24h, sin zona: incluye segundos SOLO si el campo los maneja (showSecond o el display
  // los muestra). Así el value coincide con lo declarado en el schema ("HH:mm" o "HH:mm:ss").
  const usesSeconds = showSecond || /s/.test(displayFormat)
  const storeFormat = usesSeconds ? 'HH:mm:ss' : 'HH:mm'

  const handleChange = useCallback(
    (time: dayjs.Dayjs | null) => {
      if (!internalTouched) setInternalTouched(true)
      // Guardamos en el formato declarado (wall-clock, 24h), independiente del display. (value estable para validar)
      const newValue = time && time.isValid() ? time.format(storeFormat) : null
      onChange(name, newValue)
    },
    [name, onChange, internalTouched, storeFormat],
  )

  const handleBlur = useCallback(() => {
    if (!internalTouched) setInternalTouched(true)
    onBlur?.(name)
  }, [name, onBlur, internalTouched])

  // Parseamos el value entrante: probamos el display y los formatos canónicos; último recurso, parse libre.
  const dayjsValue = useMemo(() => {
    if (!value) return null
    try {
      if (typeof value === 'string') {
        for (const fmt of [displayFormat, ...PARSE_FORMATS]) {
          const parsed = dayjs(value, fmt, true)
          if (parsed.isValid()) return parsed
        }
        const auto = dayjs(value) // p. ej. ISO date-time completo
        return auto.isValid() ? auto : null
      }
      const parsed = dayjs(value)
      return parsed.isValid() ? parsed : null
    } catch {
      return null
    }
  }, [value, displayFormat])

  if (isVisible === false) return null

  const { type, jsonType, _rootLayout, errorMessage, getFormValues, ...filtered } = antdProps as any

  const timeProps = {
    id: name,
    value: dayjsValue,
    onChange: handleChange,
    onBlur: handleBlur,
    placeholder: placeholder || 'Seleccioná una hora',
    disabled,
    format: displayFormat,
    allowClear,
    showSecond,
    // needConfirm=false: el value se setea al seleccionar hora/minuto, sin pedir "OK". (AntD v5.14+)
    needConfirm: false,
    getPopupContainer: (trigger: any) => trigger.parentElement,
    status: error && (isTouched || submitted) ? ('error' as '' | 'error' | 'warning') : undefined,
    'aria-invalid': !!error,
    'aria-describedby': error ? `${name}-error` : undefined,
    'aria-required': required,
    style: { width: '100%' },
    ...filtered,
  }

  return (
    <div className={`${styles.field} ${className || ''}`} style={style}>
      <FieldLabel label={label} required={required} htmlFor={name} description={description} />

      <TimePicker {...timeProps} />

      {(isTouched || submitted) && <ErrorMessage error={error} fieldName={name} />}
    </div>
  )
}
