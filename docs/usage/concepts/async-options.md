# Opciones async (Select / Autocomplete)

Para campos cuyas opciones se cargan dinámicamente —de una API, según otros campos, o por término de
búsqueda— UIForm conecta dos piezas:

1. **`asyncLoaders`** — funciones cargadoras, registradas en el [`<FormProvider>`](../components/form-provider.md).
2. **`ui:options.asyncOptions`** — config en el `uiSchema` que apunta a un loader por `id`.

## El loader

Un `AsyncOptionsLoader` recibe un contexto `{ formValues, search }` y devuelve `{ options }`. Las opciones
son `[{ label, value }]`.

```tsx
const asyncLoaders = {
  // El id matchea con asyncOptions.id del uiSchema.
  ciudades: async ({ formValues, search }) => {
    const res = await fetch(`/api/ciudades?pais=${formValues.pais}&q=${search ?? ''}`)
    return { options: await res.json() } // [{ label, value }]
  },
}
```

- `formValues` — valores actuales del form (útil para filtrar por otro campo).
- `search` — término tipeado por el usuario (solo cuando `searchable: true`).

## La config en el `uiSchema`

```ts
const uiSchema = {
  ciudad: {
    'ui:widget': 'autocomplete',
    'ui:options': {
      asyncOptions: {
        id: 'ciudades',           // matchea con la key de asyncLoaders
        dependencies: ['pais'],   // recarga cuando cambia 'pais'
        searchable: true,         // habilita búsqueda server-side (onSearch → reload)
      },
    },
  },
}
```

Conectás todo en el provider:

```tsx
<FormProvider schema={schema} uiSchema={uiSchema} asyncLoaders={asyncLoaders}>
  {/* … */}
</FormProvider>
```

## Campos de `asyncOptions`

| Campo | Tipo | Efecto |
|-------|------|--------|
| `id` | `string` | Key del loader en `asyncLoaders`. |
| `dependencies` | `string[]` | `name`s que, al cambiar **cualquiera**, recargan el loader. |
| `searchable` | `boolean` | Habilita búsqueda **server-side**: el término tipeado se pasa al loader como `search`, con **debounce**. |

### `dependencies`: recarga encadenada

Cuando cambia el valor de cualquier `name` listado en `dependencies`, el loader vuelve a ejecutarse con los
`formValues` actualizados. Patrón clásico: `país → ciudad`. Un Select con `dependencies` solo reacciona a
**sus** dependencias (suscripción granular), no a cualquier cambio del form.

### `searchable`: cliente vs servidor

- **Con `searchable: true`** — el término tipeado se manda al loader (`search`) con debounce. El filtrado lo
  hace el servidor. Útil para catálogos grandes.
- **Sin `searchable`** — las opciones se cargan una vez y el filtrado por texto es en cliente.

## Warning si el `id` no resuelve

Si el `id` de `asyncOptions` no matchea ningún loader en `asyncLoaders`, se emite un `console.warn` en dev.
**No rompe** el form: el campo simplemente queda sin opciones.

## Links

- [`useAsyncOptions`](../hooks/use-async-options.md)
- [Widget `select`](../widgets/select.md)
- [Widget `autocomplete`](../widgets/autocomplete.md)
- [`<FormProvider>`](../components/form-provider.md)
- [Referencia del `uiSchema`](./uischema-reference.md)
