# Secciones (`ui:sections`)

Las secciones agrupan campos para presentarlos juntos (un título, una descripción, un bloque visual).
Son **presentación pura** → viven en el `uiSchema`, no en el `schema`.

## Estructura

`ui:sections` es un array de objetos `UiSection`:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | `string` | Identificador único de la sección (requerido). |
| `title` | `string` | Título visible (opcional). |
| `description` | `string` | Descripción/ayuda (opcional). |
| `fields` | `string[]` | `name`s de los campos que agrupa, **en orden** (requerido). |

```ts
const uiSchema = {
  'ui:sections': [
    { id: 'personal', title: 'Datos personales', description: 'Tus datos básicos', fields: ['nombre', 'email'] },
    { id: 'direccion', title: 'Dirección', fields: ['calle', 'ciudad'] },
  ],
  // ...presentación por campo
  nombre: { 'ui:widget': 'text' },
  email:  { 'ui:widget': 'email' },
  calle:  { 'ui:widget': 'text' },
  ciudad: { 'ui:widget': 'text' },
}
```

> Un contenedor (`fieldset` / `group-array`) se lista como **UNA** entrada en `fields` (por ejemplo
> `'direccion'`); sus hijos los renderiza el propio contenedor.

## La sección implícita `__default__`

Los campos que no aparecen en **ninguna** sección quedan en una sección implícita con id `__default__`.
Si no definís `ui:sections`, todos los campos van a `__default__`. Así, leer las secciones del store
siempre funciona, definas o no `ui:sections`.

## Cómo renderizar por secciones

El store expone las **secciones resueltas** (`ResolvedSection[]`): cada una trae sus `name`s mapeados a los
`Field` del motor, en orden. Las leés con [`useFormStore`](../hooks/use-form-store.md) y renderizás cada
campo con [`<Field>`](../components/field.md), a tu gusto en orden y layout.

```tsx
import { useFormStore, Field } from '@laus/uiform'

function FormBody() {
  // Metadata estructural: NO cambia al tipear (selector estable).
  const sections = useFormStore((s) => s.sections)

  return sections.map((sec) => (
    <section key={sec.id}>
      {sec.title && <h3>{sec.title}</h3>}
      {sec.description && <p>{sec.description}</p>}
      {sec.fieldNames.map((name) => (
        <Field key={name} name={name} />
      ))}
    </section>
  ))
}
```

Cada `ResolvedSection` tiene: `id`, `title?`, `description?`, `fieldNames` (los `name`s en orden) y `fields`
(los `Field` del motor, por si necesitás su metadata).

> `s.sections` es estructura inmutable tras crear el form: el selector devuelve siempre la misma referencia
> y no dispara re-renders al tipear. Ver la [regla de oro del selector](./performance.md).

## Links

- [`useFormStore`](../hooks/use-form-store.md)
- [`<Field>`](../components/field.md)
- [Referencia del `uiSchema`](./uischema-reference.md)
- [Performance: suscripción granular](./performance.md)
