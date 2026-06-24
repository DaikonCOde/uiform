# `<FormSection>`

Renderiza los campos de **una sección** por su `id`. Las secciones se autoran en `ui:sections`
(ver [Secciones](../concepts/sections.md)). Por dentro usa [`useSection`](../hooks/use-section.md), así
que se suscribe solo a la metadata de esa sección: **no re-renderiza por tipeo**.

## Props

| Prop | Tipo | Descripción |
|------|------|-------------|
| `id` | `string` | Id de la sección a renderizar (requerido). |
| `className` | `string` | Clase del `<div>` contenedor (opcional). |
| `style` | `CSSProperties` | Estilos inline del contenedor (opcional). |
| `children` | `(fields: Field[]) => ReactNode` | Render-prop opcional para armar un layout custom. |

> Si el `id` no existe, `<FormSection>` **no renderiza nada** (`null`) y avisa por consola **una sola vez**
> por id. Nunca rompe el render.

## Render default

Sin `children`, la sección renderiza su encabezado (`title` como `<h3>`, `description` como `<p>`, ambos
opcionales) y un [`<Field>`](./field.md) por cada campo, en el orden del schema.

```tsx
import { FormProvider, FormSection } from '@laus/uiform'

<FormProvider schema={schema} uiSchema={uiSchema}>
  <FormSection id="datos-personales" />
  <FormSection id="direccion" />
</FormProvider>
```

## Render custom (render-prop)

Pasá `children` como función para recibir los `fields` de la sección y armar tu propio layout (grid,
columnas, agrupaciones). Vos decidís cómo se distribuyen los `<Field>`.

```tsx
<FormSection id="direccion">
  {(fields) => (
    <div className="grid-2-cols">
      {fields.map((field) => (
        <Field key={field.name} name={field.name} />
      ))}
    </div>
  )}
</FormSection>
```

> Con `children` el encabezado (`title`/`description`) **no** se renderiza: el layout queda 100% a tu cargo.

## Ver también

- [Secciones](../concepts/sections.md) — cómo se declaran en `ui:sections`.
- [`useSection`](../hooks/use-section.md) — el hook que `<FormSection>` usa por dentro.
- [`<Field>`](./field.md) — renderizar cada campo.
- [`<FormProvider>`](./form-provider.md) — el contexto que `<FormSection>` necesita.
