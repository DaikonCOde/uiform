# `<FormProvider>`

Raíz de un formulario UIForm: crea **un store por instancia** (Zustand) y lo expone a sus hijos vía
Context. Recibe los dos documentos (`schema` + `uiSchema`) y las opciones del form.

El Context solo guarda la **referencia** al store (estable), así montar el Provider no re-renderiza por sí
mismo: las suscripciones granulares viven en los hooks (`useField`, `useWatch`, `useFormStore`).

## Props

| Prop | Tipo | Descripción |
|------|------|-------------|
| `schema` | `JsfObjectSchema` | JSON Schema puro (requerido). |
| `uiSchema` | `UiSchema` | Presentación (opcional). |
| `initialValues` | `Record<string, any>` | Valores iniciales (respeta falsy: `0`/`false`). |
| `onSubmit` | `(values, errors?) => void \| Promise` | Se llama en submit válido con el payload JSON. |
| `onChange` | `(values, errors?) => void` | Se llama en cada cambio de valor. |
| `asyncLoaders` | `Record<string, AsyncOptionsLoader>` | Cargadores de opciones async (Select/Autocomplete). Ver [Opciones async](../concepts/async-options.md). |
| `config` | `UIFormConfig` | Configuración (ver [Validación](../concepts/validation.md)). |

> El store se recrea solo si `schema`, `uiSchema` o `initialValues` cambian **por valor** (no por una
> referencia nueva). Pasar handlers inline (`onSubmit`/`onChange`) o `asyncLoaders` nuevos en cada render
> NO recrea el store: siempre se ejecuta la última versión.

## Ejemplo

```tsx
import { FormProvider, Field, useFormApi } from '@laus/uiform'
import { Button } from 'antd'

function MiForm() {
  return (
    <FormProvider
      schema={schema}
      uiSchema={uiSchema}
      initialValues={{ nombre: 'Ana' }}
      onSubmit={(values) => console.log('payload válido:', values)}
      onChange={(values) => console.log('cambió:', values)}
      config={{ validateTrigger: 'onChange' }}
    >
      <Field name="nombre" />
      <Field name="email" />
      <Submit />
    </FormProvider>
  )
}

const Submit = () => {
  const { submit, isSubmitting } = useFormApi()
  return <Button loading={isSubmitting} onClick={() => submit()}>Enviar</Button>
}
```

## Ver también

- [`useFormApi`](../hooks/use-form-api.md) — acciones del form y flags reactivos.
- [`<Field>`](./field.md) — renderizar cada campo.
- [Opciones async](../concepts/async-options.md) — cómo cablear `asyncLoaders`.
