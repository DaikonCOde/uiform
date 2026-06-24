# Grid responsivo

UIForm arma un **CSS Grid** mobile-first para distribuir los campos en columnas. El grid se configura en
tres niveles: **global** (todo el form), **por sección** y **por campo** (cuántas columnas ocupa).

## Los tres niveles

| Nivel | Dónde | Qué controla |
|-------|-------|--------------|
| Global | `<FormProvider layout={...}>` | columnas + gap por defecto de TODAS las secciones. |
| Sección | `ui:sections[].layout` | grid propio de una sección (override del global). |
| Campo | `ui:colSpan` en el `uiSchema` | cuántas columnas ocupa ese campo (default 1). |

**Resolución:** el `layout` de la sección gana sobre el global. Si no hay `layout` en ningún lado, los
campos se **apilan** (sin contenedor de grid). Ver [`<FormSection>`](../components/form-section.md).

## Grid global (`FormProvider.layout`)

`layout` es un `FormLayout`:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `columns` | `number` | columnas fijas para todos los breakpoints. |
| `responsive` | `{ sm?, md?, lg?, xl? }` | columnas por breakpoint (**gana** sobre `columns`). |
| `gap` | `string` | separación entre celdas; **default `"16px"`**. |

```tsx
import { FormProvider } from '@laus/uiform'

<FormProvider
  schema={schema}
  uiSchema={uiSchema}
  layout={{ columns: 2, gap: '24px' }}
>
  {/* ... */}
</FormProvider>
```

Esto da un grid de 2 columnas con `gap: 24px` para todas las secciones.

## Mobile-first y breakpoints

`responsive` se evalúa **mobile-first**: `sm` es la base (sin media query) y el resto se aplica con
`min-width`.

| Breakpoint | `min-width` |
|------------|-------------|
| `sm` | `0px` (base, móvil) |
| `md` | `768px` |
| `lg` | `1024px` |
| `xl` | `1280px` |

```tsx
<FormProvider
  schema={schema}
  uiSchema={uiSchema}
  layout={{ responsive: { sm: 1, md: 2, lg: 4 } }}
>
  {/* 1 col en móvil, 2 en tablet, 4 en desktop */}
</FormProvider>
```

> Si usás `responsive` pero **no** definís `sm`, la base cae a **1 columna** automáticamente (el móvil
> nunca queda sin `grid-template-columns`).

## Grid por sección (`ui:sections[].layout`)

Cada sección puede traer su propio `layout`, con la misma forma que el global. Override total para esa
sección:

```ts
const uiSchema = {
  'ui:sections': [
    {
      id: 'personal',
      title: 'Datos personales',
      fields: ['nombre', 'apellido', 'email'],
      layout: { responsive: { sm: 1, md: 2 } }, // override solo de esta sección
    },
    {
      id: 'extra',
      title: 'Extra',
      fields: ['notas'],
      // sin layout → usa el global del FormProvider
    },
  ],
}
```

Ver [Secciones (`ui:sections`)](./sections.md).

## Columnas por campo (`ui:colSpan`)

`ui:colSpan` define cuántas columnas del grid ocupa un campo. Es un número (todos los breakpoints) o un
objeto responsivo `{ sm?, md?, lg?, xl? }`. Default: **1**.

```ts
const uiSchema = {
  'ui:sections': [
    { id: 'main', fields: ['nombre', 'apellido', 'bio'], layout: { columns: 2 } },
  ],
  nombre:   { 'ui:widget': 'text' },                         // span 1
  apellido: { 'ui:widget': 'text' },                         // span 1
  bio:      { 'ui:widget': 'textarea', 'ui:colSpan': 2 },    // ocupa las 2 columnas
}
```

Responsivo:

```ts
const uiSchema = {
  email: {
    'ui:widget': 'email',
    'ui:colSpan': { sm: 1, md: 2 }, // 1 col en móvil, 2 en tablet+
  },
}
```

> Valores no enteros, `0` o negativos se normalizan a `1` (no generan CSS basura).

## Cómo se aplica (interno)

`useGridCSS` genera el CSS Grid del contenedor + el `grid-column: span` de cada campo y lo **inyecta** en
un `<style>` en el `<head>`, con un id único por instancia (`useId`). Es **SSR-safe**: la inyección vive
en un `useEffect` y se limpia al desmontar. No tenés que tocar nada de esto: lo maneja
[`<FormSection>`](../components/form-section.md).

## Limitaciones actuales

- Por campo solo existe `ui:colSpan`. **No** hay `colStart` / `colEnd` (no podés posicionar un campo en una
  columna arbitraria, solo decir cuántas ocupa).
- Una sección **no puede apagar** el grid global: si el global tiene `layout` y la sección no define el
  suyo, la sección hereda el global. No hay forma de pasar `null` para forzar campos apilados en una
  sección puntual.

## Links

- [Secciones (`ui:sections`)](./sections.md)
- [`<FormProvider>`](../components/form-provider.md)
- [`<FormSection>`](../components/form-section.md)
- [Referencia del `uiSchema`](./uischema-reference.md)
