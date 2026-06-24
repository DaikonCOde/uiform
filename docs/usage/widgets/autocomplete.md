# autocomplete

Input de texto con sugerencias. Renderiza `AutocompleteField` (sobre `AutoComplete` de Ant Design).

A diferencia de [select](./select.md), el autocomplete es un **input de texto** que muestra un dropdown de
sugerencias mientras tipeás. Es ideal para búsquedas server-side con muchos resultados.

## Tipo de dato

`string` (el `value` seleccionado).

## value ↔ label

El componente maneja dos cosas distintas:

- **Texto del input** (lo que se ve mientras tipeás) — estado local.
- **`value` del form** (lo que se guarda en el payload) — el `value` de la opción seleccionada.

Cuando seleccionás una sugerencia del dropdown, se muestra su `label` en el input pero se guarda su
`value`. Si el form recibe solo un `value` (selección externa o reset), el componente busca su `label`
en las opciones para mostrarlo. Si tipeás manualmente y vaciás el input, el `value` del form se limpia.

## Ejemplo (async searchable)

El autocomplete es **searchable por defecto** (`searchable: true` si no lo declarás). Ver la guía completa
en [Conceptos: opciones async](../concepts/async-options.md).

```ts
// asyncLoaders (en <FormProvider>)
const asyncLoaders = {
  productos: async ({ search }) => {
    const res = await fetch(`/api/productos?q=${search ?? ''}`)
    return { options: await res.json() } // [{ label, value }]
  },
}

// uiSchema
const uiSchema = {
  producto: {
    'ui:widget': 'autocomplete',
    'ui:options': {
      asyncOptions: {
        id: 'productos',           // matchea con la key en asyncLoaders
        dependencies: ['categoria'], // opcional: recarga al cambiar 'categoria'
        // searchable: true por defecto en autocomplete
      },
    },
  },
}
```

El término tipeado se pasa al loader como `search` (con debounce). El filtrado es server-side, no local.

## ui:options soportadas

| Opción | Tipo | Efecto |
|--------|------|--------|
| `placeholder` | `string` | Placeholder del input. Default: `Search...`. |
| `allowClear` | `boolean` | Botón para limpiar. Default: `true`. |
| `options` | `array` | Opciones estáticas (`{ label, value }` o escalares) si no usás async. |
| `asyncOptions` | `object` | Config de carga async (`id`, `dependencies`, `searchable`). |

## Notas

- Si no hay resultados, muestra `No results`; mientras carga, un spinner.
- Usá `autocomplete` (input abierto con sugerencias) vs `select` (lista cerrada) según si el usuario debe
  poder buscar/escribir libremente.
