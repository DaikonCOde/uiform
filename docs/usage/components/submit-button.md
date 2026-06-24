# `<SubmitButton>`

Botón de submit listo para usar. Por dentro consume [`useFormApi`](../hooks/use-form-api.md): dispara
`submit()` al hacer click y refleja `isSubmitting` como `loading`. Es un `Button` de Ant Design con
`type="primary"`.

## Props

`<SubmitButton>` acepta todas las props de `ButtonProps` de Ant Design **excepto** `loading` y `onClick`
(los gestiona el propio componente).

| Prop | Tipo | Descripción |
|------|------|-------------|
| `children` | `ReactNode` | Label del botón (default `"Enviar"`). |
| `...buttonProps` | `Omit<ButtonProps, 'loading' \| 'onClick'>` | Cualquier otra prop de AntD Button (`disabled`, `size`, `icon`, etc.). |

## Ejemplo

Tiene que vivir dentro de un [`<FormProvider>`](./form-provider.md) (necesita el contexto del store).

```tsx
import { FormProvider, Field, SubmitButton } from '@laus/uiform'

<FormProvider schema={schema} uiSchema={uiSchema} onSubmit={(values) => save(values)}>
  <Field name="nombre" />
  <Field name="email" />

  <SubmitButton />              {/* "Enviar" */}
  <SubmitButton size="large">Guardar cambios</SubmitButton>
</FormProvider>
```

Mientras el submit está en curso, el botón muestra el spinner de `loading` automáticamente.

## Ver también

- [`useFormApi`](../hooks/use-form-api.md) — `submit` e `isSubmitting`, la fuente de este botón.
- [`<FormProvider>`](./form-provider.md) — el contexto requerido.
- [`<UIForm>`](./uiform.md) — ya incluye una barra de submit por defecto con `<SubmitButton>` + Reset.
