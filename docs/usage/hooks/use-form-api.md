# `useFormApi`

Expone las **acciones del formulario** (estables) y dos **flags reactivos** suscritos a su propio slice. Ideal para barras de envío, botones externos y feedback de estado.

## Firma

```ts
function useFormApi(): {
  submit: () => Promise<void>
  reset: (values?: Record<string, unknown>) => void
  validate: () => FormErrors
  isSubmitting: boolean
  isValid: boolean
}
```

## Qué devuelve

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `submit` | `() => Promise<void>` | Valida primero; **si hay errores, NO llama a `onSubmit`** (no se envía payload inválido). Referencia estable. |
| `reset` | `(values?) => void` | Resetea el form. Sin argumento vuelve a los `initialValues`; con `values` resetea a ese objeto. Referencia estable. |
| `validate` | `() => FormErrors` | Dispara la validación y devuelve el objeto de errores actual (vacío si todo OK). Referencia estable. |
| `isSubmitting` | `boolean` | `true` mientras corre `submit()`. Reactivo: re-renderiza al cambiar. |
| `isValid` | `boolean` | `true` si **no hay errores conocidos** (`store.errors` sin claves). Reactivo. |

## Ejemplo: barra de envío

```tsx
import { useFormApi } from '@laus/uiform'

function SubmitBar() {
  const { submit, reset, isSubmitting, isValid } = useFormApi()

  return (
    <div className="submit-bar">
      <button type="button" onClick={() => reset()} disabled={isSubmitting}>
        Reset
      </button>
      <button type="button" onClick={submit} disabled={isSubmitting || !isValid}>
        {isSubmitting ? 'Enviando…' : 'Enviar'}
      </button>
    </div>
  )
}
```

## Notas / gotchas

- `submit`, `reset` y `validate` son **referencias estables** del store → seguras como deps.
- **`isValid` deriva de los errores ya conocidos**, no fuerza una validación. Si tu `validateTrigger` es `onSubmit`, el form arranca con `isValid === true` hasta el primer `submit()`/`validate()`. Llamá a `validate()` si necesitás el estado real antes de enviar.
- Cada flag está suscrito a su propio slice: `isSubmitting` solo re-renderiza al cambiar `isSubmitting`, e `isValid` solo cuando el booleano derivado cambia.
- Más sobre triggers, errores y mensajes custom en [concepts/validation](../concepts/validation.md).
