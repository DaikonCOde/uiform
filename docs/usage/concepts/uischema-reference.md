# Referencia del `uiSchema`

El `uiSchema` es el documento de **presentación**. Tiene claves a **nivel raíz** (estructura global) y
claves **por campo** (la key es el `name` de la property del `schema`). Todas las claves de presentación
empiezan con el prefijo `ui:`.

> Nunca escribís `x-jsf-*` a mano: el compilador baja estas claves `ui:*` al motor. Ver
> [el modelo de dos documentos](./schema-and-uischema.md).

## Claves por campo

La key del entry es el `name` de la property. Su valor es un objeto con estas claves:

| Clave | Tipo | Efecto |
|-------|------|--------|
| `ui:widget` | `string` | Componente a renderizar. Mapea a `inputType` (key de la tabla de [widgets](../widgets/index.md)). |
| `ui:placeholder` | `string` | Placeholder del input. |
| `ui:autofocus` | `boolean` | Foco automático al montar (se baja como `autoFocus` camelCase). |
| `ui:disabled` | `boolean` | Deshabilita el campo. |
| `ui:title` | `string` | Sobreescribe el label (semántica RJSF: mapea al `title` de la property). |
| `ui:description` | `string` | Texto de ayuda del campo. |
| `ui:options` | `object` | Props extra arbitrarias que se splatean al campo (`accept`, `maxFileSize`, `asyncOptions`, `multiple`, …). |
| `ui:order` | `string[]` | Orden de los hijos en un contenedor (`fieldset` / `group-array`). |

### Ejemplo por campo

```ts
const uiSchema = {
  nombre: { 'ui:widget': 'text', 'ui:placeholder': 'Tu nombre', 'ui:autofocus': true },
  bio:    { 'ui:widget': 'textarea', 'ui:description': 'Contanos sobre vos' },
  avatar: { 'ui:widget': 'file', 'ui:options': { accept: 'image/*', maxFileSize: 2048 } },
}
```

### `ui:options` como escape hatch

`ui:options` se splatea **primero** sobre la presentación; las claves dedicadas (`ui:widget`, etc.) tienen
precedencia y no se dejan pisar. Usalo para props que no tienen clave dedicada (por ejemplo `asyncOptions`,
`accept`, `multiple`).

### Contenedores anidados

En un `fieldset` o `group-array`, las claves **que no empiezan con `ui:`** son los `name` de los campos
hijos, cada uno con sus propias `UiFieldOptions`:

```ts
const uiSchema = {
  direccion: {
    'ui:widget': 'fieldset',
    'ui:order': ['calle', 'numero'],   // orden de los hijos
    calle:  { 'ui:widget': 'text' },   // hijo
    numero: { 'ui:widget': 'number' }, // hijo
  },
}
```

## Claves a nivel raíz

| Clave | Tipo | Efecto |
|-------|------|--------|
| `ui:sections` | `UiSection[]` | Agrupa campos en secciones. Ver [secciones](./sections.md). |
| `ui:order` | `string[]` | Orden global de los campos. |

### Ejemplo completo

```ts
const uiSchema = {
  'ui:sections': [
    { id: 'datos', title: 'Datos personales', fields: ['nombre', 'email'] },
  ],
  'ui:order': ['nombre', 'email', 'avatar'],
  nombre: { 'ui:widget': 'text', 'ui:autofocus': true },
  email:  { 'ui:widget': 'email', 'ui:placeholder': 'tu@mail.com' },
  avatar: { 'ui:widget': 'file', 'ui:options': { accept: 'image/*', maxFileSize: 2048 } },
}
```

## Links

- [Widgets disponibles](../widgets/index.md)
- [Secciones (`ui:sections`)](./sections.md)
- [Opciones async (`ui:options.asyncOptions`)](./async-options.md)
- [Modelo `schema` + `uiSchema`](./schema-and-uischema.md)
