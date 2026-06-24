# text / email / hidden

Input de texto de una línea. Renderiza `TextField` (sobre `Input` de Ant Design).

Los tres `ui:widget` comparten componente; el `inputType` cambia el comportamiento:

- **`text`** — input de texto plano (`type="text"`).
- **`email`** — input con `type="email"` (teclado/validación nativa de email del navegador).
- **`hidden`** — renderiza un `<input type="hidden">`: lleva el valor en el payload pero no se ve ni
  muestra label/errores.

## Tipo de dato

`string`.

## Ejemplo

```ts
// schema
const schema = {
  type: 'object',
  required: ['nombre', 'email'],
  properties: {
    nombre: { type: 'string', title: 'Nombre' },
    email:  { type: 'string', title: 'Email', format: 'email' },
    token:  { type: 'string' },
  },
}

// uiSchema
const uiSchema = {
  nombre: { 'ui:widget': 'text',  'ui:placeholder': 'Tu nombre' },
  email:  { 'ui:widget': 'email', 'ui:placeholder': 'tu@mail.com' },
  token:  { 'ui:widget': 'hidden' },
}
```

## ui:options soportadas

Además de las claves comunes del [uiSchema](../concepts/uischema-reference.md)
(`ui:placeholder`, `ui:disabled`, `ui:autofocus`, etc.), `TextField` soporta:

| Opción | Tipo | Efecto |
|--------|------|--------|
| `placeholder` | `string` | Texto placeholder del input (también vía `ui:placeholder`). |
| `maxLength` | `number` | Largo máximo de caracteres aceptados por el input. |

```ts
const uiSchema = {
  nombre: {
    'ui:widget': 'text',
    'ui:options': { maxLength: 80 },
  },
}
```

## Notas

- El estado `error` se muestra solo después de que el campo fue tocado (blur) o el form se envió.
- Para texto multilínea usá [textarea](./textarea.md).
