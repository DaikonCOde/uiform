# `useAsyncOptions`

Conecta un campo al **cache de opciones async del store**. Lo usan `Select` y `Autocomplete` internamente; documentado acá para construir **widgets custom** que carguen opciones dinámicas.

## Firma

```ts
function useAsyncOptions(loaderId?: string, deps?: string[]): {
  options: any[]
  loading: boolean
  error: string | null
  reload: (search?: string) => void
}
```

- **`loaderId`**: id del loader (el de `field.asyncOptions.id` / `ui:options.asyncOptions.id`). Si falta, el hook queda **inerte** (sin side effects, devuelve estado vacío).
- **`deps`**: names de campos que, al cambiar, **fuerzan recarga** (el `asyncOptions.dependencies`).

## Qué devuelve

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `options` | `any[]` | Opciones cargadas (`[]` mientras no haya resultado). |
| `loading` | `boolean` | `true` mientras corre el loader. |
| `error` | `string \| null` | Mensaje de error del loader, o `null`. |
| `reload` | `(search?: string) => void` | Re-invoca el loader. Pasá `search` para búsqueda server-side. |

## Ejemplo: widget custom con búsqueda

```tsx
import { useAsyncOptions } from '@laus/uiform'

function CityPicker() {
  // 'ciudades' matchea con la key de asyncLoaders; recarga cuando cambia 'pais'.
  const { options, loading, error, reload } = useAsyncOptions('ciudades', ['pais'])

  return (
    <div>
      <input
        placeholder="Buscar ciudad…"
        onChange={(e) => reload(e.target.value)}
      />
      {loading && <span>Cargando…</span>}
      {error && <span className="err">{error}</span>}
      <ul>
        {options.map((o) => <li key={o.value}>{o.label}</li>)}
      </ul>
    </div>
  )
}
```

## Notas / gotchas

- **Carga automática** al montar y cada vez que cambian `loaderId` o los valores de `deps` (se rearma el effect vía un `depKey` serializado).
- **Suscripción granular**: solo observa `async[loaderId]`. Cambios en otros loaders u otros campos no re-renderizan.
- `reload(search)` es la vía para búsqueda server-side. En `autocomplete`/`select`, los widgets de la lib la llaman con debounce al tipear (si `searchable` está activo).
- Si `loaderId` no matchea ningún loader registrado en `asyncLoaders`, se emite **un** `console.warn` (solo en dev, una vez por id) y las opciones quedan vacías; no rompe el form.
- Detalles de configuración (`asyncOptions`, `dependencies`, `searchable`) en [concepts/async-options](../concepts/async-options.md).
