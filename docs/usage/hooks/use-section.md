# `useSection`

Suscribe a **UNA sección por id** y devuelve esa sección más sus `Field`. Solo metadata estructural (sin valores) → la suscripción es **estable** y **no re-renderiza por tipeo**. Es lo que usa internamente [`<FormSection>`](../components/form-section.md); útil para layouts custom.

## Firma

```ts
function useSection(id: string): {
  section: ResolvedSection | undefined
  fields: Field[]
}
```

## Qué devuelve

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `section` | `ResolvedSection \| undefined` | La sección con ese `id`, o `undefined` si no existe. |
| `fields` | `Field[]` | Los `Field` del motor de la sección (`section.fields`). Si el id no existe, un array **vacío estable**. |

El shape de `ResolvedSection`:

```ts
interface ResolvedSection {
  id: string
  title?: string
  description?: string
  fieldNames: string[]   // names de los campos, en orden
  fields: Field[]        // los Field del motor ya mapeados desde fieldNames
}
```

## Ejemplo: layout custom de una sección

```tsx
import { useSection } from '@laus/uiform'
import { Field } from '@laus/uiform'

function ProfileSection() {
  const { section, fields } = useSection('profile')

  if (!section) return null

  return (
    <fieldset>
      {section.title && <legend>{section.title}</legend>}
      {section.description && <p>{section.description}</p>}
      <div className="grid">
        {fields.map((field) => (
          <Field key={field.name} name={field.name} />
        ))}
      </div>
    </fieldset>
  )
}
```

## Notas / gotchas

- **Id inexistente no rompe el render.** Devuelve `{ section: undefined, fields: [] }` y emite un `console.warn` **una sola vez por id** (no spamea la consola en cada render). Es tu señal de un typo en el `id`.
- **`fields` vacío es ref estable.** El caso "sección inexistente" devuelve una constante module-level (siempre la misma `[]`), no un array nuevo por render → no fuerza re-renders en el consumidor.
- **Suscripción estable.** La sección es una estructura **inmutable** del store (resuelta al crear el store), así que su referencia no cambia: tipear en un campo no re-renderiza este hook.
- **`fieldNames` vs `fields`.** `fieldNames` son solo los names (strings); `fields` son los `Field` del motor ya mapeados desde esos names.
- Para iterar **todas** las secciones usá [`useSections`](use-sections.md).
- Más sobre cómo se definen y resuelven las secciones en [concepts/sections](../concepts/sections.md).
