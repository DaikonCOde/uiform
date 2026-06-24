# Getting Started

Instalación y primer formulario con UIForm.

## Instalación

```bash
npm install @laus/uiform @laus/json-schema-form dayjs
# peers (React 18 recomendado):
npm install react@18 react-dom@18 antd@5
```

> **React 17:** compatible usando `antd@4` (AntD 5 requiere React 18+).

Importá los estilos de los componentes una vez (p. ej. en tu entrypoint):

```ts
import '@laus/uiform/style.css'
```

## Quick start

La API primaria es **componible**: un `<FormProvider>` que crea el form, y `<Field>` para renderizar cada
campo donde quieras.

```tsx
import { FormProvider, Field, useFormApi } from '@laus/uiform'
import '@laus/uiform/style.css'
import { Button } from 'antd'

const schema = {
  type: 'object',
  required: ['nombre', 'email'],
  properties: {
    nombre: { type: 'string', title: 'Nombre' },
    email:  { type: 'string', title: 'Email', format: 'email' },
  },
}

const uiSchema = {
  nombre: { 'ui:widget': 'text',  'ui:placeholder': 'Tu nombre', 'ui:autofocus': true },
  email:  { 'ui:widget': 'email', 'ui:placeholder': 'tu@mail.com' },
}

function MiForm() {
  return (
    <FormProvider
      schema={schema}
      uiSchema={uiSchema}
      onSubmit={(values) => console.log('payload válido:', values)}
      config={{ validateTrigger: 'onChange' }}
    >
      <Field name="nombre" />
      <Field name="email" />
      <SubmitBar />
    </FormProvider>
  )
}

// El botón de submit consume las acciones del form vía hook.
function SubmitBar() {
  const { submit, reset, isSubmitting } = useFormApi()
  return (
    <>
      <Button type="primary" loading={isSubmitting} onClick={() => submit()}>Enviar</Button>
      <Button onClick={() => reset()}>Reset</Button>
    </>
  )
}
```

`onSubmit` recibe el payload ya transformado a JSON Schema (números como números, vacíos omitidos, etc.)
y solo se llama si la validación pasa.

## Estado de la API pública

> Fases 1-7 completas y **verificadas end-to-end en el browser** (ver [`REVIEW_V2.md`](../REVIEW_V2.md)).
> La API pública v2 está cableada en el entry (`src/lib/index.ts`) y se consume desde `@laus/uiform`:
> componentes (`FormProvider`, `Field`, `FormSection`, `SubmitButton`, `UIForm`), hooks y tipos.
> El playground (`src/App.tsx`) la usa tal cual y es el ejemplo vivo más completo.
>
> **Pendiente post-v1:** el grid responsive a nivel raíz (todavía sin API `ui:layout`).

## Atajo: `<UIForm>`

Si no necesitás un layout custom, `<UIForm>` arma todo (secciones + barra de submit) en un componente:

```tsx
import { UIForm } from '@laus/uiform'

<UIForm schema={schema} uiSchema={uiSchema} onSubmit={(v) => console.log(v)} />
```

Ver [`<UIForm>`](./components/uiform.md) y [`<SubmitButton>`](./components/submit-button.md).

## Próximos pasos

- [El modelo `schema` + `uiSchema`](./concepts/schema-and-uischema.md)
- [`<FormProvider>`](./components/form-provider.md) · [`<Field>`](./components/field.md) · [`<FormSection>`](./components/form-section.md)
