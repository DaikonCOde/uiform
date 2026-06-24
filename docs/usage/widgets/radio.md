# radio

Grupo de botones de opción (uno entre varios). Renderiza `RadioField` (sobre `Radio.Group` de Ant Design).

Por defecto las opciones se apilan verticalmente.

## Tipo de dato

enum (el `value` de la opción elegida).

## Ejemplo

Las opciones salen del `schema` (`enum` / `oneOf`) o de `ui:options.options`. Cada opción puede ser un
escalar o un objeto `{ label, value, disabled? }`.

```ts
// schema
const schema = {
  type: 'object',
  properties: {
    plan: {
      type: 'string',
      title: 'Plan',
      oneOf: [
        { const: 'free', title: 'Gratis' },
        { const: 'pro',  title: 'Pro' },
      ],
    },
  },
}

// uiSchema
const uiSchema = {
  plan: { 'ui:widget': 'radio' },
}
```

## ui:options soportadas

| Opción | Tipo | Efecto |
|--------|------|--------|
| `options` | `array` | Opciones explícitas (`{ label, value, disabled? }` o escalares) si no salen del schema. |
| `size` | `'small' \| 'middle' \| 'large'` | Tamaño de los controles. |
| `optionType` | `'default' \| 'button'` | Render como radios clásicos o como botones. |
| `buttonStyle` | `'outline' \| 'solid'` | Estilo de los botones cuando `optionType: 'button'`. |

```ts
const uiSchema = {
  plan: {
    'ui:widget': 'radio',
    'ui:options': { optionType: 'button', buttonStyle: 'solid', size: 'large' },
  },
}
```

## Notas

- Para muchas opciones, considerá [select](./select.md) en lugar de `radio`.
