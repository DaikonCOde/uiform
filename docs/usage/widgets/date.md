# date

Selector de fecha. Renderiza `DateField` (sobre `DatePicker` de Ant Design, usando `dayjs`).

## Tipo de dato

`string`. Sin hora, el value guardado es **estable** en formato `YYYY-MM-DD` (compatible con JSON Schema).
Con `showTime`, se guarda como ISO string completo (`toISOString()`). El formato de **display** (lo que ve
el usuario) es independiente del value guardado y se configura con `ui:options.format`.

El componente parsea con tolerancia varios formatos de entrada comunes (`YYYY-MM-DD`, `DD/MM/YYYY`,
`MM/DD/YYYY`, ISO, etc.) al hidratar el valor.

> **Display vs. value:** `ui:options.format` controla **solo el display** (tokens `dayjs`). El value que
> recibe `onSubmit` es siempre estable: `YYYY-MM-DD` sin hora, ISO con `showTime`. Cambiar el display no
> cambia el formato guardado.

## El formato de display: `ui:options.format`

El display se configura con `ui:options.format` (string de tokens `dayjs`, ej. `'DD/MM/YYYY'`). **No** uses
el keyword JSON Schema `format: 'date'` como formato de display: ese keyword vive en el `schema` y es para
**validación**, no presentación. El motor lo splatea sobre el campo y `dayjs` lo interpretaría como tokens
literales (`'date'` → basura tipo `'5amte'`), por eso el widget lo ignora como display. El formato visible
sale siempre de `ui:options.format`.

## Ejemplo

```ts
// schema
const schema = {
  type: 'object',
  properties: {
    nacimiento: { type: 'string', title: 'Fecha de nacimiento', format: 'date' },
  },
}

// uiSchema
const uiSchema = {
  nacimiento: {
    'ui:widget': 'date',
    'ui:options': {
      format: 'DD/MM/YYYY',
      maxDate: '2010-12-31',
    },
  },
}
```

## ui:options soportadas

| Opción | Tipo | Efecto |
|--------|------|--------|
| `placeholder` | `string` | Placeholder del input. |
| `format` | `string` | Formato de **display** (tokens `dayjs`). Default: `YYYY-MM-DD`. No afecta el value guardado. |
| `minDate` | `string \| Date` | Fecha mínima seleccionable (deshabilita las anteriores). |
| `maxDate` | `string \| Date` | Fecha máxima seleccionable (deshabilita las posteriores). |
| `showTime` | `boolean` | Incluye selector de hora. Cambia el valor guardado a ISO string. |
| `picker` | `'date' \| 'week' \| 'month' \| 'quarter' \| 'year'` | Granularidad del picker. Default: `'date'`. |
| `allowClear` | `boolean` | Botón para limpiar. Default: `true`. |

```ts
const uiSchema = {
  reunion: {
    'ui:widget': 'date',
    'ui:options': { showTime: true, format: 'YYYY-MM-DD HH:mm' },
  },
}
```

## Notas

- `minDate`/`maxDate` deshabilitan las fechas fuera de rango en el calendario. Como siempre, la
  **validación** del payload sale del `schema`.
- Con `showTime`, el formato de visualización agrega `HH:mm:ss` automáticamente si no lo especificás.
