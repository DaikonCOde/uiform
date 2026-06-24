# Validación y configuración

La validación de UIForm sale del **JSON Schema puro** (el `schema`), vía el motor headless. No declarás
reglas en el `uiSchema` ni en código imperativo: lo que valida es el contrato de datos.

## Reglas desde el `schema`

Cualquier construcción estándar de JSON Schema valida:

```ts
const schema = {
  type: 'object',
  required: ['nombre', 'email', 'edad'],
  properties: {
    nombre: { type: 'string', minLength: 2 },
    email:  { type: 'string', format: 'email' },
    edad:   { type: 'number', minimum: 18, maximum: 120 },
  },
}
```

`required`, `format`, `minimum`/`maximum`, `minLength`, etc. se aplican automáticamente.

## Cuándo se valida: `config.validateTrigger`

Se configura en el `config` del [`<FormProvider>`](../components/form-provider.md):

```ts
config={{
  validateTrigger: 'onChange' | 'onBlur' | 'onSubmit', // default: onSubmit
  size: 'small' | 'middle' | 'large',
  layout: 'horizontal' | 'vertical' | 'inline',
  disabled: boolean,
  showRequiredMark: boolean,
}}
```

- `onChange` — valida en cada cambio de valor.
- `onBlur` — valida al perder el foco.
- `onSubmit` — valida solo al enviar (default).

## El submit corta si hay errores

`submit()` **valida primero**. Si hay errores, **no llama a `onSubmit`**: nunca se envía un payload
inválido. Solo cuando la validación pasa, `onSubmit` recibe el payload ya transformado a JSON Schema
(números como números, vacíos omitidos, etc.).

```tsx
import { useFormApi } from '@laus/uiform'

function SubmitBar() {
  const { submit, isSubmitting, isValid } = useFormApi()
  return <button disabled={!isValid || isSubmitting} onClick={() => submit()}>Enviar</button>
}
```

## Forma de los errores

Los errores viven en `store.errors`:

- **Campo simple** → `string` (el mensaje).
- **Contenedor** (`fieldset` / `group-array`) → objeto o array anidado, espejando la estructura del dato.

```ts
import { useFormStore } from '@laus/uiform'

const errors = useFormStore((s) => s.errors)
// errors.email      → "Formato de email inválido"
// errors.direccion  → { calle: "Requerido" }   (fieldset)
// errors.contactos  → [{ telefono: "Requerido" }, …] (group-array)
```

## Mensajes custom: `x-jsf-errorMessage`

Para personalizar mensajes, definí `x-jsf-errorMessage` en el **`schema`** (es validación-adyacente, no
presentación, por eso va en el schema y no en el uiSchema):

```ts
const schema = {
  type: 'object',
  required: ['email'],
  properties: {
    email: {
      type: 'string',
      format: 'email',
      'x-jsf-errorMessage': {
        required: 'El email es obligatorio',
        format: 'Ingresá un email válido',
      },
    },
  },
}
```

## Customizar y traducir mensajes (i18n)

`x-jsf-errorMessage` cubre el caso por-campo desde el `schema`. Para mensajes **globales** (un default por
tipo de validación para todo el form) y para **traducir** (i18n) usá `errorMessages` en el
[`<FormProvider>`](../components/form-provider.md) o `ui:errorMessages` por campo en el `uiSchema`. La
precedencia y los ejemplos completos están en [Mensajes de error](./error-messages.md).

## Links

- [Mensajes de error](./error-messages.md) — customizar y traducir mensajes (global + por campo).
- [`useFormApi`](../hooks/use-form-api.md)
- [`<FormProvider>`](../components/form-provider.md)
- [`useFormStore`](../hooks/use-form-store.md)
- [Modelo `schema` + `uiSchema`](./schema-and-uischema.md)
