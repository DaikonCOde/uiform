# checkbox

Casilla de verificación. Renderiza `CheckboxField` (sobre `Checkbox` de Ant Design).

Tiene **dos modos** según cómo esté definido el campo en el `schema`. El componente decide cuál usar
mirando el tipo del `const` asociado (lo inyecta el motor):

## 1. Checkbox booleano (`boolean`)

Para un sí/no. El `schema` declara `type: 'boolean'`.

- Tildar → `true`
- Destildar → **`false`** (no `undefined`)

Que destildar emita `false` (y no `null`/`undefined`) es deliberado: así un campo booleano requerido no
rompe la validación al desmarcarlo.

```ts
// schema
const schema = {
  type: 'object',
  properties: {
    acepta: { type: 'boolean', title: 'Acepto los términos' },
  },
}

// uiSchema
const uiSchema = {
  acepta: { 'ui:widget': 'checkbox' },
}
```

Produce `values.acepta = true | false`.

## 2. Value-checkbox (`const` no booleano)

Cuando el `schema` ata el campo a un valor concreto que no es booleano (un `const` string/number), el
checkbox representa la **presencia** de ese valor:

- Tildar → guarda el `checkboxValue` (el `const`).
- Destildar → **`undefined`** (el campo se **omite** del payload).

```ts
// schema
const schema = {
  type: 'object',
  properties: {
    rol: { const: 'admin', title: 'Es administrador' },
  },
}

// uiSchema
const uiSchema = {
  rol: { 'ui:widget': 'checkbox' },
}
```

Tildado produce `values.rol = 'admin'`; destildado **no incluye** `rol` en el payload.

## La diferencia, en una tabla

| Modo | Origen | Tildar | Destildar |
|------|--------|--------|-----------|
| Booleano | `type: 'boolean'` | `true` | `false` |
| Value-checkbox | `const` no booleano | el `const` | `undefined` (se omite) |

## ui:options soportadas

| Opción | Tipo | Efecto |
|--------|------|--------|
| `indeterminate` | `boolean` | Estado visual indeterminado (guion). |
| `autoFocus` | `boolean` | Foco automático al montar. |

## Notas

- El label del checkbox se muestra al lado de la casilla. Si pasás `ui:title` y un children distintos,
  se muestra un label separado arriba.
