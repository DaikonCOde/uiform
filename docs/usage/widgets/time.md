# time

Selector de hora. Renderiza `TimeField` (sobre `TimePicker` de Ant Design, usando `dayjs`).

## Tipo de dato

`string`. El value guardado es **estable** en formato canónico `HH:mm:ss` (24h, compatible con el keyword
JSON Schema `format: "time"`), **independiente** del formato de display. El componente parsea con tolerancia
varios formatos de entrada (`HH:mm:ss`, `HH:mm`, `H:mm`, o un ISO date-time completo) al hidratar el valor.

> **Display vs. value:** `ui:options.format` controla **solo el display** (tokens `dayjs`). El value que
> recibe `onSubmit` es siempre `HH:mm:ss`. Cambiar el display no cambia el formato guardado.

## El formato de display: `ui:options.format`

El display se configura con `ui:options.format` (string de tokens `dayjs`, ej. `'HH:mm'` o `'hh:mm A'` para
12h). **No** uses el keyword JSON Schema `format: 'time'` como display: ese keyword vive en el `schema` y es
para **validación**, no presentación. El motor lo splatea sobre el campo y `dayjs` lo interpretaría como
tokens literales (basura), por eso el widget lo ignora como display. El formato visible sale siempre de
`ui:options.format` (default: `HH:mm`, o `HH:mm:ss` si pedís `showSecond`).

## Ejemplo

```ts
// schema (dato + validación)
const schema = {
  type: 'object',
  properties: {
    hora: { type: 'string', title: 'Hora de contacto', format: 'time' },
  },
}

// uiSchema (presentación)
const uiSchema = {
  hora: {
    'ui:widget': 'time',
    'ui:options': { format: 'HH:mm' },
  },
}
```

Un value `"14:30:00"` se muestra como `14:30` (default). Si seleccionás `09:05` en el picker, se guarda
`"09:05:00"`.

## ui:options soportadas

| Opción | Tipo | Efecto |
|--------|------|--------|
| `placeholder` | `string` | Placeholder del input. Default: `"Seleccioná una hora"`. |
| `format` | `string` | Formato de **display** (tokens `dayjs`). Default: `HH:mm`. No afecta el value guardado (`HH:mm:ss`). |
| `showSecond` | `boolean` | Muestra segundos en el picker (y display por defecto `HH:mm:ss`). Default: `false`. |
| `use12Hours` | `boolean` | Reloj de 12 horas con AM/PM. (Usá un `format` acorde, ej. `'hh:mm A'`.) |
| `minuteStep` | `number` | Paso de minutos en el selector. |
| `secondStep` | `number` | Paso de segundos en el selector. |
| `allowClear` | `boolean` | Botón para limpiar. Default: `true`. |

```ts
const uiSchema = {
  hora: {
    'ui:widget': 'time',
    'ui:options': { use12Hours: true, format: 'hh:mm A', minuteStep: 15 },
  },
}
```

## Notas

- El value SIEMPRE se guarda como `HH:mm:ss` (24h), así sirve para validar contra `format: "time"` del
  JSON Schema sin importar cómo lo muestres.
- **Sin botón de confirmación**: el widget usa `needConfirm={false}`, así que NO aparece el botón "OK".
  El valor se aplica al seleccionar la hora/minuto (al cerrar el panel), sin paso extra de confirmación.
- Como cualquier campo, la **validación** del payload sale del `schema`, no del display.

## Links

- [Referencia del `uiSchema`](../concepts/uischema-reference.md)
- [Índice de widgets](./index.md) · [`date`](./date.md)
