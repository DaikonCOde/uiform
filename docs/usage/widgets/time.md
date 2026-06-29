# time

Selector de hora. Renderiza `TimeField` (sobre `TimePicker` de Ant Design, usando `dayjs`).

## Tipo de dato

`string` **wall-clock** (hora de pared, sin zona horaria). El value guardado es 24h en el formato
**declarado**: `HH:mm` si el campo es de hora-minuto, o `HH:mm:ss` si maneja segundos (`showSecond` o un
display con segundos). Es **independiente** del formato de display. El componente parsea con tolerancia
varios formatos de entrada (`HH:mm:ss`, `HH:mm`, `H:mm`, o un ISO date-time completo) al hidratar el valor.

> **Display vs. value:** `ui:options.format` controla **solo el display** (tokens `dayjs`). El value que
> recibe `onSubmit` es 24h (`HH:mm` o `HH:mm:ss`). Cambiar el display no cambia el formato guardado.

> ⚠️ **No uses `format: "time"` para validar.** Ese keyword es RFC 3339 `full-time` y **exige** offset de
> zona (`Z` o `±HH:mm`), que un valor wall-clock no tiene → tu propio value fallaría la validación. Validá
> con `pattern` en el schema (ver ejemplo abajo).

## El formato de display: `ui:options.format`

El display se configura con `ui:options.format` (string de tokens `dayjs`, ej. `'HH:mm'` o `'hh:mm A'` para
12h). **No** uses el keyword JSON Schema `format: 'time'` como display: ese keyword vive en el `schema` y es
para **validación**, no presentación. El motor lo splatea sobre el campo y `dayjs` lo interpretaría como
tokens literales (basura), por eso el widget lo ignora como display. El formato visible sale siempre de
`ui:options.format` (default: `HH:mm`, o `HH:mm:ss` si pedís `showSecond`).

## Ejemplo

```ts
// schema (dato + validación) — wall-clock, SIN keyword `format` (igual que `date`)
const schema = {
  type: 'object',
  properties: {
    hora: { type: 'string', title: 'Hora de contacto' },
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

Como el campo no muestra segundos, un value `"14:30"` se muestra como `14:30`. Si seleccionás `09:05` en el
picker, se guarda `"09:05"`. Con `showSecond` (o un display con segundos) el store pasa a `"09:05:00"`.

### Validación opcional del payload (`pattern`)

Por defecto el value no se valida de formato (se confía en el widget). Si querés que el **payload** se valide
—útil cuando el backend, dueño del schema, debe enforcar la misma regla—, agregá un `pattern` (regex estándar
de JSON Schema, sirve para cualquier campo `string`):

```ts
hora: {
  type: 'string',
  title: 'Hora de contacto',
  // Acepta HH:mm o HH:mm:ss (segundos opcionales). Rechaza 25:00, 14:60, etc.
  pattern: '^([01]\\d|2[0-3]):[0-5]\\d(:[0-5]\\d)?$',
}
```

## ui:options soportadas

| Opción | Tipo | Efecto |
|--------|------|--------|
| `placeholder` | `string` | Placeholder del input. Default: `"Seleccioná una hora"`. |
| `format` | `string` | Formato de **display** (tokens `dayjs`). Default: `HH:mm`. No afecta el value guardado (24h `HH:mm`/`HH:mm:ss`). |
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

- El value se guarda en 24h y wall-clock: `HH:mm` por defecto, `HH:mm:ss` si el campo maneja segundos.
  Validalo con `pattern` en el schema, **no** con `format: "time"` (ese keyword RFC exige offset de zona).
- **Sin botón de confirmación**: el widget usa `needConfirm={false}`, así que NO aparece el botón "OK".
  El valor se aplica al seleccionar la hora/minuto (al cerrar el panel), sin paso extra de confirmación.
- Como cualquier campo, la **validación** del payload sale del `schema`, no del display.

## Links

- [Referencia del `uiSchema`](../concepts/uischema-reference.md)
- [Índice de widgets](./index.md) · [`date`](./date.md)
