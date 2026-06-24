# Performance: suscripción granular

UIForm v2 está diseñado para que **tipear en un campo re-renderice SOLO ese campo**. El estado vive en un
**store por instancia** (Zustand) y cada consumidor se suscribe únicamente al *slice* que necesita.

## Cómo funciona

Cada [`<Field>`](../components/field.md) se suscribe solo a su slice (`value` / `error` / `touched`). Si
escribís en `nombre`, el `<Field name="email">` no se vuelve a renderizar. Un `Select` con `dependencies`
solo reacciona a **sus** dependencias, no a cualquier cambio del form.

## Los tres hooks de lectura

Elegí el más específico para lo que necesitás:

- **[`useField(name)`](../hooks/use-field.md)** — estado + callbacks de UN campo (`value`, `error`,
  `touched`, `onChange`, `onBlur`, `field`). Suscrito solo a ese campo.
- **[`useWatch(name | names)`](../hooks/use-watch.md)** — observa valores puntuales (p. ej. para mostrar/
  ocultar lógica). Re-renderiza SOLO si esos valores cambian.
- **[`useFormStore(selector, equalityFn?)`](../hooks/use-form-store.md)** — acceso de bajo nivel con un
  selector propio. Máximo control, máxima responsabilidad.

```tsx
const value   = useField('email').value          // solo 'email'
const [a, b]  = useWatch(['pais', 'ciudad'])      // solo esos dos
const errors  = useFormStore((s) => s.errors)     // slice propio
```

## La REGLA DE ORO: selector estable

Un selector de `useFormStore` debe devolver algo **referencialmente estable**: un primitivo (string,
number, boolean) o una referencia que no cambia. Si devolvés un **objeto, array o función nuevos en cada
llamada**, el componente se re-renderiza ante **cualquier** cambio del store —matás la suscripción
granular.

```ts
// MAL: objeto nuevo en cada render → re-render ante cualquier cambio del store
const { submit, reset } = useFormStore((s) => ({ submit: s.submit, reset: s.reset }))

// MAL: array nuevo en cada render
const errs = useFormStore((s) => [s.errors.nombre, s.errors.email])

// BIEN: primitivo / referencia estable (las acciones del store son estables)
const submit = useFormStore((s) => s.submit)
const error  = useFormStore((s) => s.errors.email)
```

### Arrays: usá `shallow`

Cuando *necesitás* devolver un array (varios valores juntos), pasá `shallow` como `equalityFn` para que la
comparación sea por elementos y no por referencia:

```ts
import { shallow } from 'zustand/shallow'

const errs = useFormStore(
  (s) => [s.errors.nombre, s.errors.email],
  shallow,
)
```

> Las **acciones** del store (`setValue`, `submit`, `reset`, `validate`, …) y la **estructura**
> (`fields`, `sections`, `fieldsByName`) son referencialmente estables tras crear el form: seleccionarlas
> no dispara re-renders.

## Links

- [`useFormStore`](../hooks/use-form-store.md)
- [`useField`](../hooks/use-field.md)
- [`useWatch`](../hooks/use-watch.md)
- [`<Field>`](../components/field.md)
