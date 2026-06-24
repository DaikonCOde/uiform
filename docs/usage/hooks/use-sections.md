# `useSections`

Devuelve **todas las secciones resueltas** del formulario, en orden. Solo metadata estructural (sin valores) → la suscripción es **estable** y **no re-renderiza por tipeo**. Ideal para iterar las secciones y renderizarlas con [`<FormSection>`](../components/form-section.md).

## Firma

```ts
function useSections(): ResolvedSection[]
```

## Qué devuelve

Un array de `ResolvedSection`, en el orden en que se definieron en el `ui:sections` del uiSchema.

```ts
interface ResolvedSection {
  id: string
  title?: string
  description?: string
  fieldNames: string[]   // names de los campos, en orden
  fields: Field[]        // los Field del motor ya mapeados desde fieldNames
}
```

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | `string` | Identificador único de la sección (el que pasás a `<FormSection id=… />`). |
| `title` | `string \| undefined` | Título de la sección (opcional). |
| `description` | `string \| undefined` | Descripción de la sección (opcional). |
| `fieldNames` | `string[]` | Los **names** de los campos de la sección, en orden. Útil si solo necesitás las claves. |
| `fields` | `Field[]` | Los **`Field` del motor** ya resueltos a partir de `fieldNames` (label, `inputType`, `options`, …). |

## Ejemplo: renderizar todas las secciones

```tsx
import { useSections } from '@laus/uiform'
import { FormSection } from '@laus/uiform'

function AllSections() {
  const sections = useSections()

  return (
    <>
      {sections.map((section) => (
        <FormSection key={section.id} id={section.id} />
      ))}
    </>
  )
}
```

## Notas / gotchas

- **Suscripción estable.** `store.sections` es estructura **inmutable** (se resuelve una sola vez al crear el store). Su referencia no cambia, así que `Object.is` nunca dispara un re-render por tipear en un campo.
- **`fieldNames` vs `fields`.** `fieldNames` son solo los strings (los names); `fields` son los objetos `Field` del motor ya mapeados desde esos names. Si únicamente vas a renderizar campos, normalmente delegás en `<FormSection>` y no tocás ninguno de los dos a mano.
- Para una sola sección por id usá [`useSection`](use-section.md).
- Más sobre cómo se definen y resuelven las secciones en [concepts/sections](../concepts/sections.md).
