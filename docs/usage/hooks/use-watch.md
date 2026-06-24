# `useWatch`

Observa **valores puntuales** del formulario y re-renderiza **solo si esos valores cambian**. Pensado para lógica condicional (mostrar/ocultar campos) y dependencias entre campos.

## Firma (overloads)

```ts
function useWatch(name: string): any
function useWatch(names: string[]): any[]
```

- Con un `string` → devuelve **el valor** de ese campo.
- Con un `string[]` → devuelve **un array** con los valores, en el mismo orden que los names.

## Qué devuelve

| Argumento | Retorno |
|-----------|---------|
| `useWatch('pais')` | El valor de `pais` (`any`). |
| `useWatch(['pais', 'ciudad'])` | `[valorPais, valorCiudad]`. |

## Ejemplo

```tsx
import { useWatch, Field } from '@laus/uiform'

// Lógica condicional: mostrar 'otraEmpresa' solo si tipo === 'otro'
function ConditionalField() {
  const tipo = useWatch('tipo')
  if (tipo !== 'otro') return null
  return <Field name="otraEmpresa" />
}

// Varios valores a la vez
function Resumen() {
  const [nombre, email] = useWatch(['nombre', 'email'])
  return <p>{nombre} — {email}</p>
}
```

## Notas / gotchas

- **Re-render mínimo.** Internamente siempre selecciona una tupla de valores y la compara con `shallow` de `zustand/shallow`. Si los valores observados no cambian, no hay re-render aunque cambie el resto del store.
- El path de hooks es **idéntico** para ambos overloads (siempre normaliza el arg a array): no rompe las reglas de hooks si alternás entre formas.
- Pasar un array vacío (`useWatch([])`) es válido y no observa nada (lo usa `useAsyncOptions` cuando no hay `dependencies`).
- Para suscripciones más amplias o de bajo nivel, usá [`useFormStore`](./use-form-store.md). Más contexto de performance en [concepts/performance](../concepts/performance.md).
