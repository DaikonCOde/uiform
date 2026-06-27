# Widgets custom

UIForm trae widgets built-in (`text`, `email`, `select`, `checkbox`, …), pero podés **registrar los
tuyos** o **reemplazar** los que vienen de fábrica. El registro es por `inputType` / `ui:widget`.

## Registrar componentes (`components`)

Pasá un registry `components` al [`<FormProvider>`](../components/form-provider.md) (o a `<UIForm>`). Es un
objeto que mapea el nombre del widget al componente:

```tsx
import { FormProvider } from '@laus/uiform'
import { RatingInput } from './widgets/RatingInput'

<FormProvider
  schema={schema}
  uiSchema={uiSchema}
  components={{ rating: RatingInput }}
>
  {/* ... */}
</FormProvider>
```

En el `uiSchema`, un campo usa ese widget vía `ui:widget`:

```ts
const uiSchema = {
  satisfaccion: { 'ui:widget': 'rating' },
}
```

> El registry se propaga también a los **hijos de contenedores** (`fieldset`, `group-array`): un widget
> custom funciona igual dentro de un objeto anidado o de un item de array.

## Override de built-ins

Si la clave coincide con un widget built-in, **gana el tuyo**. El registry custom se resuelve antes que el
mapa default:

```tsx
import { MiText } from './widgets/MiText'

// Reemplaza el `text` de fábrica por el tuyo en TODO el form
<FormProvider schema={schema} uiSchema={uiSchema} components={{ text: MiText }}>
  {/* ... */}
</FormProvider>
```

> Un `ui:widget` desconocido **sin** entrada en el registry cae en un componente `Fallback`
> ("Unsupported field type"). Si ves ese mensaje, te falta registrar el widget.

## Leer el registry (`useFieldComponents`)

Desde cualquier componente dentro del `<FormProvider>`, `useFieldComponents()` devuelve el registry de esa
instancia (vacío `{}` si no pasaste nada):

```tsx
import { useFieldComponents } from '@laus/uiform'

function Debug() {
  const components = useFieldComponents()
  return <pre>{Object.keys(components).join(', ')}</pre>
}
```

## Qué props recibe tu widget

Un widget custom recibe **los mismos props que un presentacional built-in**: la metadata del `field` (del
motor) **splatteada**, más el estado y los callbacks del campo:

| Prop | Tipo | Descripción |
|------|------|-------------|
| `name` | `string` | name del campo (lo necesitás para `onChange` / `onBlur`). |
| `label` | `string?` | label resuelto. |
| `description` | `string?` | descripción/ayuda. |
| `required` | `boolean?` | si es requerido. |
| `isVisible` | `boolean?` | visibilidad condicional (hacé `if (!isVisible) return null`). |
| `value` | `any` | valor actual del campo. |
| `error` | `string?` | mensaje de error de validación. |
| `touched` | `boolean?` | si el usuario ya tocó el campo. |
| `onChange` | `(name, value) => void` | reportá el nuevo valor. |
| `onBlur` | `(name) => void` | reportá el blur. |

Además llegan las props de presentación del `uiSchema` (`placeholder`, `disabled`, y lo que pongas en
`ui:options`). El controlador [`<Field>`](../components/field.md) ya quita las props internas del motor
antes de pasártelas: vos te concentrás solo en la UI.

## Ejemplo: widget `rating`

```tsx
// widgets/RatingInput.tsx
import { Rate } from 'antd'
import { FieldLabel, ErrorMessage } from '@laus/uiform'

interface RatingProps {
  name: string
  label?: string
  description?: string
  required?: boolean
  isVisible?: boolean
  value?: number
  error?: string
  touched?: boolean
  onChange: (name: string, value: number) => void
  onBlur: (name: string) => void
}

export function RatingInput({
  name, label, description, required, isVisible,
  value, error, touched, onChange, onBlur,
}: RatingProps) {
  if (isVisible === false) return null

  return (
    <div>
      <FieldLabel label={label} required={required} htmlFor={name} description={description} />
      <Rate
        value={value}
        onChange={(v) => onChange(name, v)}
        onBlur={() => onBlur(name)}
      />
      {touched && <ErrorMessage error={error} fieldName={name} />}
    </div>
  )
}
```

Registralo y usalo:

```tsx
<FormProvider schema={schema} uiSchema={uiSchema} components={{ rating: RatingInput }}>
  {/* uiSchema: { satisfaccion: { 'ui:widget': 'rating' } } */}
</FormProvider>
```

> Tu widget es **controlado**: para SU propio valor, lee `value` y reporta con `onChange(name, value)` — no
> toca el store directamente. Para leer/escribir **otros** campos o reaccionar al estado global, usá los
> hooks (ver abajo). La suscripción granular la maneja el controlador `<Field>`. Ver [Performance](./performance.md).

---

## Componentes custom avanzados

Acá está lo potente: un componente custom puede **componerse de los componentes de la librería**,
**suscribirse al estado** del formulario por hooks, y **embeber otros campos** — y todo sigue respetando las
reglas del `schema` (visibilidad condicional, dependencias). El patrón:

- **El `schema`** declara el estado (los campos) y sus reglas (`if`/`then`/`else`, `required`, etc.).
- **El `uiSchema`** dice qué campo usa tu widget custom (`ui:widget`).
- **El registry `components`** asocia el nombre del widget a tu componente. *No hay que tocar nada más.*

### 1) Componer componentes de la librería

Importá los presentacionales built-in y los building-blocks (`FieldLabel`, `ErrorMessage`) desde el paquete:

```tsx
import { TextField, SelectField, CheckboxField, FieldLabel, ErrorMessage } from '@laus/uiform'
```

> Son **controlados**: les pasás `value` + `onChange(name, value)`. Su contrato `onChange` es
> `(name, value)`, así que adaptá: `onChange={(_n, v) => onChange(name, v)}`.

### 2) Suscribirse al estado (hooks)

Desde cualquier componente dentro del `<FormProvider>`:

| Hook | Para qué |
|------|----------|
| [`useWatch(name)`](../hooks/use-watch.md) | Leer el valor de **otro** campo (re-render solo si ESE cambia). |
| [`useField(name)`](../hooks/use-field.md) | Leer **y escribir** cualquier campo (`{ value, error, touched, onChange, onBlur }`). |
| [`useFormStore(selector)`](../hooks/use-form-store.md) | Acceso de bajo nivel al store con un selector. |

```tsx
import { useWatch } from '@laus/uiform'

function Resumen() {
  const nombre = useWatch('nombre') // se re-renderiza solo cuando cambia `nombre`
  return <p>Hola {nombre || '—'}</p>
}
```

### 3) Embeber otros campos (`<Field>`)

Un componente custom puede renderizar **otros campos por su name** con `<Field>`. El campo embebido se
auto-oculta si el `schema` lo marca oculto (`isVisible === false`), igual que en cualquier sección:

```tsx
import { Field } from '@laus/uiform'
// dentro de tu componente:
<Field name="detalle" />
```

> Si embebés un campo, **no lo pongas también en una sección** (`ui:sections`), o se renderiza dos veces.
> Listá en la sección solo el campo "contenedor" (el que usa tu widget); los dependientes los pone tu componente.

### Ejemplo completo: tarjeta con checkbox + campo condicional

El caso clásico: una tarjeta con un checkbox; según esté tildado, abajo va un **input de texto** o un
**select**. El checkbox dispara el `if`/`then`/`else` del `schema`, y la tarjeta agrupa todo visualmente.

```tsx
// schema: el estado + las reglas (qué se ve según el checkbox)
const schema = {
  type: 'object',
  properties: {
    usarLista: { type: 'boolean', title: '¿Elegir de una lista?' },
    detalleTexto: { type: 'string', title: 'Detalle' },
    detalleOpcion: { type: 'string', title: 'Opción', oneOf: [{ const: 'a', title: 'A' }, { const: 'b', title: 'B' }] },
  },
  allOf: [
    {
      if: { properties: { usarLista: { const: true } }, required: ['usarLista'] },
      then: { properties: { detalleTexto: false } },  // tildado → oculta el texto
      else: { properties: { detalleOpcion: false } }, // sin tildar → oculta el select
    },
  ],
}

// uiSchema: el checkbox usa el widget custom; los dependientes, sus widgets normales
const uiSchema = {
  'ui:sections': [{ id: 'pref', fields: ['usarLista'] }], // SOLO el checkbox en la sección
  usarLista: { 'ui:widget': 'toggleCard' },
  detalleTexto: { 'ui:widget': 'text' },
  detalleOpcion: { 'ui:widget': 'select' },
}
```

```tsx
// widgets/ToggleCard.tsx — compone CheckboxField + embebe el campo dependiente
import { Card } from 'antd'
import { CheckboxField, Field, FieldLabel } from '@laus/uiform'

export function ToggleCard({ name, value, label, required, onChange }: any) {
  return (
    <Card size="small">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <FieldLabel label={label} required={required} />
        <CheckboxField name={name} value={value} onChange={(_n, v) => onChange(name, v)} />
      </div>
      {/* el schema decide cuál se ve; el oculto se renderiza como null solo */}
      <Field name="detalleTexto" />
      <Field name="detalleOpcion" />
    </Card>
  )
}
```

```tsx
<FormProvider schema={schema} uiSchema={uiSchema} components={{ toggleCard: ToggleCard }}>
  <FormSection id="pref" />
</FormProvider>
```

Al togglear el checkbox, el `schema` oculta un campo y muestra el otro **dentro de la misma tarjeta** —
sin lógica de visibilidad en el componente. La tarjeta solo arma la UI; las reglas viven en el `schema`.

## Links

- [`<FormProvider>`](../components/form-provider.md)
- [`<Field>`](../components/field.md)
- [Widgets built-in](../widgets/index.md)
