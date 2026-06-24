# file

Carga de archivos. Renderiza `FileField` (sobre `Upload` de Ant Design).

Por defecto **no sube automáticamente**: retiene los archivos seleccionados en el valor del campo para que
los proceses vos (el `customRequest` por defecto es un no-op). El valor contiene metadata del archivo
(`name`, `size`, `type`, …) y el `File` original en `file`.

## Tipo de dato

Archivo. Con `multiple: false` (default), el valor es un objeto único (o `null`); con `multiple: true`, un
array de objetos.

## Ejemplo

```ts
// schema
const schema = {
  type: 'object',
  properties: {
    avatar: { type: 'string', title: 'Avatar' },
  },
}

// uiSchema
const uiSchema = {
  avatar: {
    'ui:widget': 'file',
    'ui:options': {
      accept: 'image/*',
      maxFileSize: 2097152, // 2 MB en bytes
    },
  },
}
```

## ui:options soportadas

| Opción | Tipo | Efecto |
|--------|------|--------|
| `accept` | `string` | Tipos aceptados (mismo formato que `<input accept>`: `image/*`, `.pdf,.doc`, …). Valida en `beforeUpload`. |
| `maxFileSize` | `number` | Tamaño máximo **en bytes**. Si se excede, muestra un error y rechaza el archivo. |
| `multiple` | `boolean` | Permite múltiples archivos. Default: `false`. |
| `listType` | `'text' \| 'picture' \| 'picture-card' \| 'picture-circle'` | Estilo del listado. Default: `'text'`. |
| `showUploadList` | `boolean` | Muestra la lista de archivos cargados. Default: `true`. |
| `customRequest` | `function` | Lógica de subida custom (firma de Ant Design). Por defecto, no sube. |
| `beforeUpload` | `function` | Hook previo a la carga (corre después de las validaciones de `accept`/`maxFileSize`). |

## Notas

- `maxFileSize` se expresa **en bytes** (p. ej. 2 MB = `2 * 1024 * 1024` = `2097152`). El hint debajo del
  campo lo muestra convertido a MB.
- Si `accept` incluye imágenes, `.pdf` o `.doc`, el componente usa la interfaz drag & drop (`Dragger`).
  Con `listType` `picture-card`/`picture-circle` muestra tarjetas; en otro caso, un botón de selección.
