# `<UIForm>`

Atajo **todo en uno**: azúcar sobre [`<FormProvider>`](./form-provider.md). Envuelve el store, renderiza
todas las secciones (incluida la implícita `__default__`) con [`<FormSection>`](./form-section.md) y agrega
una barra de submit por defecto. Ideal para el caso simple, sin layout custom.

## Props

`<UIForm>` recibe las **mismas opciones** que `<FormProvider>` (`schema`, `uiSchema`, `onSubmit`,
`onChange`, `asyncLoaders`, `initialValues`, `config`) más estilos y `children` opcionales.

| Prop | Tipo | Descripción |
|------|------|-------------|
| `schema` | `JsfObjectSchema` | JSON Schema puro (requerido). |
| `uiSchema` | `UiSchema` | Presentación, incluye `ui:sections` (opcional). |
| `initialValues` | `Record<string, any>` | Valores iniciales (respeta falsy: `0`/`false`). |
| `onSubmit` | `(values, errors?) => void \| Promise` | Submit válido con el payload JSON. |
| `onChange` | `(values, errors?) => void` | Se llama en cada cambio de valor. |
| `asyncLoaders` | `Record<string, AsyncOptionsLoader>` | Cargadores de opciones async. |
| `config` | `UIFormConfig` | Configuración (ver [Validación](../concepts/validation.md)). |
| `className` | `string` | Clase del `<div>` contenedor del cuerpo. |
| `style` | `CSSProperties` | Estilos inline del contenedor. |
| `children` | `ReactNode` | Reemplaza la barra de submit por defecto. |

## Ejemplo mínimo

```tsx
import { UIForm } from '@laus/uiform'

<UIForm
  schema={schema}
  uiSchema={uiSchema}
  onSubmit={(values) => console.log('payload válido:', values)}
/>
```

Esto renderiza todas las secciones del schema y, debajo, la **barra por defecto**: un
[`<SubmitButton>`](./submit-button.md) ("Enviar") + un botón "Reset".

## Barra de submit custom

Pasá `children` para reemplazar la barra por defecto por tus propios botones.

```tsx
<UIForm schema={schema} uiSchema={uiSchema} onSubmit={save}>
  <SubmitButton>Guardar</SubmitButton>
</UIForm>
```

> **Nota:** el grid responsive a nivel raíz es **post-v1** — todavía no existe una API pública `ui:layout`
> para configurarlo. Hoy las secciones se apilan en orden. Cuando necesites layout custom dentro de una
> sección, usá el render-prop de [`<FormSection>`](./form-section.md) directamente.

## Cuándo NO usar `<UIForm>`

Si necesitás controlar dónde va cada sección o cada campo, armá el form a mano con
[`<FormProvider>`](./form-provider.md) + [`<FormSection>`](./form-section.md) / [`<Field>`](./field.md).
`<UIForm>` es solo el atajo para el caso simple.

## Ver también

- [`<FormProvider>`](./form-provider.md) — la raíz que `<UIForm>` envuelve.
- [`<FormSection>`](./form-section.md) — cómo se renderiza cada sección.
- [`<SubmitButton>`](./submit-button.md) — el botón de la barra por defecto.
