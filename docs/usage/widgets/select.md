# select / country

Desplegable de selección. Renderiza `SelectField` (sobre `Select` de Ant Design).

- **`select`** — select genérico.
- **`country`** — mismo componente; ajusta el placeholder por defecto (`Select country...`).

## Tipo de dato

`string` / enum (o `array` de strings si usás `multiple`).

## Opciones estáticas

Las opciones salen del `schema` (`enum` / `oneOf`) o las pasás directo. Cada opción puede ser un escalar
o un objeto `{ label, value, disabled? }`.

```ts
// schema
const schema = {
  type: 'object',
  properties: {
    estado: {
      type: 'string',
      title: 'Estado',
      oneOf: [
        { const: 'activo',   title: 'Activo' },
        { const: 'inactivo', title: 'Inactivo' },
      ],
    },
  },
}

// uiSchema
const uiSchema = {
  estado: { 'ui:widget': 'select', 'ui:placeholder': 'Elegí un estado' },
}
```

## Opciones async

Para opciones cargadas desde una API (incluso dependientes de otros campos o de una búsqueda
server-side), usá `asyncOptions`. Ver la guía completa en
[Conceptos: opciones async](../concepts/async-options.md).

```ts
const uiSchema = {
  ciudad: {
    'ui:widget': 'select',
    'ui:options': {
      asyncOptions: {
        id: 'ciudades',          // matchea con la key en asyncLoaders
        dependencies: ['pais'],  // recarga al cambiar 'pais'
        searchable: true,        // búsqueda server-side (onSearch → reload con debounce)
      },
    },
  },
}
```

> Con `searchable: true` el filtrado lo hace el loader (server-side); sin él, las opciones se cargan una
> vez y el filtro es en cliente. Si el `id` no matchea ningún loader, hay un `console.warn` en dev.

## ui:options soportadas

| Opción | Tipo | Efecto |
|--------|------|--------|
| `placeholder` | `string` | Placeholder del select. |
| `multiple` | `boolean` | Selección múltiple (modo `multiple`). El valor pasa a ser un array. |
| `showSearch` | `boolean` | Habilita el buscador local (filtra las opciones cargadas). Default: `false`. |
| `allowClear` | `boolean` | Botón para limpiar la selección. Default: `true`. |
| `filterOption` | `function` | Filtro custom de opciones (firma de Ant Design). |
| `options` | `array` | Opciones estáticas explícitas (si no salen del schema). |
| `asyncOptions` | `object` | Config de carga async (ver arriba). |

## Notas

- Cuando hay `asyncOptions`, la búsqueda la controla `searchable` (no `showSearch`); `showSearch` aplica
  solo a opciones estáticas.
- Para un input de texto libre con sugerencias (no un select cerrado) usá [autocomplete](./autocomplete.md).
