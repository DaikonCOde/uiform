# textarea

Área de texto multilínea. Renderiza `TextareaField` (sobre `Input.TextArea` de Ant Design).

## Tipo de dato

`string`.

## Ejemplo

```ts
// schema
const schema = {
  type: 'object',
  properties: {
    descripcion: { type: 'string', title: 'Descripción' },
  },
}

// uiSchema
const uiSchema = {
  descripcion: {
    'ui:widget': 'textarea',
    'ui:placeholder': 'Contanos más...',
    'ui:options': { rows: 6, showCount: true },
  },
}
```

## ui:options soportadas

| Opción | Tipo | Efecto |
|--------|------|--------|
| `placeholder` | `string` | Placeholder del textarea. |
| `maxLength` | `number` | Largo máximo de caracteres. |
| `rows` | `number` | Cantidad de filas visibles. Default: `4`. |
| `autoSize` | `boolean \| { minRows, maxRows }` | Ajusta la altura al contenido. Acepta el formato de Ant Design. |
| `showCount` | `boolean` | Muestra el contador de caracteres (combinalo con `maxLength`). |

```ts
const uiSchema = {
  bio: {
    'ui:widget': 'textarea',
    'ui:options': { autoSize: { minRows: 3, maxRows: 10 }, maxLength: 500, showCount: true },
  },
}
```

## Notas

- Si pasás `autoSize`, el valor de `rows` queda subordinado al rango de `autoSize`.
