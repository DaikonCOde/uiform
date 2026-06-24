# group-array

Grupo de campos **repetible** (un array de objetos). Renderiza `GroupArrayField`: cada ítem es una `Card`
con sus campos, más botones para **agregar** y **eliminar** ítems. Es un **contenedor**: renderiza los
campos de cada ítem vía el mecanismo interno de `renderField`.

## Tipo de dato

`array` de `object`. Produce `values.<name> = [{ ...hijos }, ...]`.

## Schema + uiSchema

En el `schema`, es un `type: 'array'` cuyos `items` son un `type: 'object'` con `properties`. En el
`uiSchema`, declarás `'ui:widget': 'group-array'` y anidás la presentación de cada hijo bajo la misma
clave.

```ts
// schema
const schema = {
  type: 'object',
  properties: {
    contactos: {
      type: 'array',
      title: 'Contactos',
      items: {
        type: 'object',
        properties: {
          nombre:   { type: 'string', title: 'Nombre' },
          telefono: { type: 'string', title: 'Teléfono' },
        },
      },
    },
  },
}

// uiSchema
const uiSchema = {
  contactos: {
    'ui:widget': 'group-array',
    nombre:   { 'ui:widget': 'text' },
    telefono: { 'ui:widget': 'text' },
  },
}
```

Produce:

```ts
values.contactos = [
  { nombre: 'Ana',  telefono: '11-1111' },
  { nombre: 'Beto', telefono: '11-2222' },
]
```

## Agregar / eliminar

- Botón **agregar** (al pie): suma un ítem nuevo con valores por defecto según el tipo de cada campo.
- Botón **eliminar** (por ítem): quita ese ítem. Por defecto pide confirmación.
- Cada fila se identifica con una key sintética estable interna (no derivada de un campo editable), así
  editar un campo no remonta la fila ni pierde el foco.

## Notas

- Los **errores** de un group-array son un array (error por ítem); cada elemento puede ser un string
  (error del ítem) o un objeto (error por campo).
- En las [secciones](../concepts/uischema-reference.md), un group-array se lista como **una** entrada
  (`'contactos'`); sus ítems e hijos los renderiza el propio contenedor.
- Para un único objeto anidado (no repetible), usá [fieldset](./fieldset.md).
