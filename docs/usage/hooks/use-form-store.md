# `useFormStore`

Acceso de **bajo nivel** al store de la instancia de formulario, vía un selector con suscripción granular. Es la base sobre la que se construyen [`useField`](./use-field.md), [`useWatch`](./use-watch.md), [`useFormApi`](./use-form-api.md) y [`useAsyncOptions`](./use-async-options.md).

## Firma

```ts
function useFormStore<T>(
  selector: (s: FormState) => T,
  equalityFn?: (a: T, b: T) => boolean,
): T
```

- **`selector`**: extrae el slice que te interesa del `FormState`.
- **`equalityFn`** (opcional): cómo comparar el valor anterior con el nuevo para decidir si re-renderizar. Para arrays/objetos, usá `shallow` de `zustand/shallow`.

## Regla de oro de performance

> El selector debe devolver **algo referencialmente estable**: un **primitivo** o una **ref estable** del store.
> Devolver un **objeto/array/función nuevo en cada llamada** hace que el componente se re-renderice **ante cualquier cambio del store** (la igualdad por defecto compara por identidad y la ref siempre es nueva).
> Para arrays usá `shallow`.

```ts
import { useFormStore } from '@laus/uiform'
import { shallow } from 'zustand/shallow'

// ✅ Primitivo: estable por valor
const isSubmitting = useFormStore((s) => s.isSubmitting)

// ✅ Ref estable del store (no se recrea al tipear)
const sections = useFormStore((s) => s.sections)

// ✅ Array derivado → comparado con shallow
const [nombre, email] = useFormStore(
  (s) => [s.values.nombre, s.values.email],
  shallow,
)

// ❌ Objeto nuevo en cada render sin equalityFn → re-render ante cualquier cambio
const bad = useFormStore((s) => ({ a: s.values.a, b: s.values.b }))
```

## Ejemplos de lecturas comunes

```tsx
// Valores actuales (objeto del store, ref estable salvo edición)
const values = useFormStore((s) => s.values)

// Secciones resueltas (metadata estructural; no cambia al tipear)
const sections = useFormStore((s) => s.sections)
sections.map((sec) => sec.fieldNames /* string[] */)

// Errores en vivo
const errors = useFormStore((s) => s.errors)
```

## Notas / gotchas

- Debe usarse **dentro de un `<FormProvider>`**; fuera lanza `"useFormStore debe usarse dentro de <FormProvider>"`.
- El Context guarda solo la **ref al store**, no el estado → el Context nunca dispara re-renders por sí mismo; el re-render lo decide tu selector + `equalityFn`.
- Para leer valores **sin** suscribirte (on-demand, ej. dentro de un handler) usá la ref cruda del store en vez de este hook.
- Antes de bajar a `useFormStore`, fijate si [`useField`](./use-field.md) / [`useWatch`](./use-watch.md) / [`useFormApi`](./use-form-api.md) ya cubren tu caso: traen la igualdad correcta resuelta.
- Más en [concepts/performance](../concepts/performance.md).
