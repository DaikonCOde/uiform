# `useField`

Suscribe un componente al **slice de UN solo campo**: su valor, su error, su estado `touched`, los callbacks `onChange`/`onBlur` (estables) y la metadata del motor (`field`). Tipear en otro campo **no** re-renderiza este hook.

## Firma

```ts
function useField(name: string): {
  value: any
  error?: string | object
  touched: boolean
  onChange: (value: any) => void   // estable (misma referencia entre renders)
  onBlur: () => void               // estable
  field: Field                     // metadata del motor: label, inputType, options, …
}
```

## Qué devuelve

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `value` | `any` | Valor actual del campo (leído por path desde `store.values`). |
| `error` | `string \| object \| undefined` | Mensaje de error del campo. Es `object` para `fieldset`/`group-array` (errores anidados). |
| `touched` | `boolean` | `true` si el campo recibió `onBlur` al menos una vez. |
| `onChange` | `(value: any) => void` | Setea el valor del campo. **Referencia estable** → seguro como dep de `useEffect`/`useCallback`. |
| `onBlur` | `() => void` | Marca el campo como `touched`. **Referencia estable**. |
| `field` | `Field` | Metadata inmutable del motor (label, `inputType`, `options`, `required`, …). |

## Ejemplo

```tsx
import { useField } from '@laus/uiform'

function MyTextInput({ name }: { name: string }) {
  const { value, error, touched, onChange, onBlur, field } = useField(name)

  return (
    <label>
      {field.label}
      <input
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
      />
      {touched && typeof error === 'string' && <span className="err">{error}</span>}
    </label>
  )
}
```

## Notas / gotchas

- **Suscripción granular.** El hook selecciona una sola tupla `[value, error, touched, field]` y la compara con una igualdad custom. Esto garantiza que solo se re-renderice cuando cambia *su* slice.
- **El `error` se compara por valor**, no por identidad: el objeto de errores se recrea entero en cada `validate()`, así que comparar la referencia re-renderizaría todos los campos. La comparación profunda evita eso.
- `value`, `touched` y `field` se comparan por identidad (`Object.is`) porque son primitivos o refs estables del store.
- Normalmente no usás `useField` a mano: lo usa internamente el controlador [`<Field>`](../components/field.md). Es útil para construir widgets custom.
