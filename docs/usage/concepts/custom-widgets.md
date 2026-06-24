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

> Tu widget es **controlado**: lee `value` y reporta cambios con `onChange(name, value)`. No toca el store
> directamente — eso lo maneja el controlador `<Field>` por vos (suscripción granular incluida). Ver
> [Performance](./performance.md).

## Links

- [`<FormProvider>`](../components/form-provider.md)
- [`<Field>`](../components/field.md)
- [Widgets built-in](../widgets/index.md)
