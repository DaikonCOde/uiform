# fieldset

Grupo de campos anidados (un objeto). Renderiza `FieldsetField` (una `Card` de Ant Design que contiene a
sus hijos). Es un **contenedor**: renderiza sus campos hijos vía el mecanismo interno de `renderField`.

## Tipo de dato

`object`. Produce `values.<name> = { ...hijos }`.

## Schema + uiSchema

En el `schema`, un fieldset es un `type: 'object'` con `properties`. En el `uiSchema`, declarás
`'ui:widget': 'fieldset'` y anidás la presentación de cada hijo bajo la misma clave.

```ts
// schema
const schema = {
  type: 'object',
  properties: {
    direccion: {
      type: 'object',
      title: 'Dirección',
      properties: {
        calle:  { type: 'string', title: 'Calle' },
        numero: { type: 'number', title: 'Número' },
      },
    },
  },
}

// uiSchema
const uiSchema = {
  direccion: {
    'ui:widget': 'fieldset',
    calle:  { 'ui:widget': 'text' },
    numero: { 'ui:widget': 'number' },
  },
}
```

Produce:

```ts
values.direccion = { calle: 'Av. Siempreviva', numero: 742 }
```

## Notas

- El `title` del objeto en el schema se usa como título de la `Card`.
- Los hijos se renderizan con su `name` prefijado internamente (`direccion.calle`), pero el valor que
  recibís es el objeto anidado completo.
- Los **errores** de un fieldset son un objeto (error por hijo), no un string.
- En las [secciones](../concepts/uischema-reference.md), un fieldset se lista como **una** entrada
  (`'direccion'`); sus hijos los renderiza el propio contenedor.
- Para un grupo **repetible** (varias instancias), usá [group-array](./group-array.md).
