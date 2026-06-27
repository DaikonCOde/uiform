# Campos condicionales (mostrar / ocultar según otro campo)

Mostrar un campo solo cuando se cumple una condición (por ejemplo: aparece "CUIT" únicamente si tildás
"¿Emitís factura?") se resuelve en el **`schema`**, con el estándar JSON Schema `if` / `then` / `else`.

## La idea: la visibilidad vive en el `schema`, no en el `uiSchema`

Esto es importante: **"este campo solo existe si pasa X" es parte del CONTRATO DE DATOS**, no de la
presentación. Por eso va en el `schema` (que dueña el dato y su validación), no en el `uiSchema` (que solo
dice cómo se ve).

El motor (`@laus/json-schema-form`) calcula un `isVisible` por campo a partir del `if/then/else`, y la
suscripción granular de UIForm muestra/oculta el campo **reactivo, sin que cablees nada**.

## Patrón base: mostrar un campo si un checkbox está tildado

```ts
const schema = {
  type: 'object',
  properties: {
    tieneMascota: { type: 'boolean', title: '¿Tenés mascota?' },
    nombreMascota: { type: 'string', title: 'Nombre de la mascota' },
  },
  allOf: [
    {
      if: {
        properties: { tieneMascota: { const: true } },
        required: ['tieneMascota'], // ⚠️ ver "El gotcha" más abajo
      },
      then: { required: ['nombreMascota'] }, // se muestra (y lo hago obligatorio)
      else: { properties: { nombreMascota: false } }, // 👈 ESTO lo OCULTA si NO está tildado
    },
  ],
}

const uiSchema = {
  tieneMascota: { 'ui:widget': 'checkbox' },
  nombreMascota: { 'ui:widget': 'text', 'ui:placeholder': 'Firulais' },
}
```

## Las 3 claves del patrón

| Parte | Qué hace |
|-------|----------|
| `if` | La **condición**. Checkbox tildado = `{ const: true }`. |
| `else: { properties: { campo: false } }` | **Oculta** el campo cuando la condición NO se cumple. `properties: { campo: false }` en JSON Schema significa "este campo no está permitido" → el motor lo lee como oculto. **Sin esta línea el campo se ve siempre.** |
| `then: { required: [...] }` | *(Opcional)* Lo hace **obligatorio solo cuando aparece**. Si no lo querés obligatorio, omití el `then`. |

## ⚠️ El gotcha del `required` dentro del `if`

Ese `required: ['tieneMascota']` **no es decoración**. En JSON Schema, las restricciones de `properties` no
se aplican a un campo **ausente** (`undefined`): sin el `required`, la condición `const: true` se cumple "de
onda" cuando el campo está vacío, y el `else` no se dispara bien. **Siempre** poné el campo de la condición
en el `required` del `if`. Es el error #1 con `if/then/else`.

## Qué pasa con el VALOR de un campo oculto

Cuando un campo se oculta:

- **Su valor se LIMPIA del estado**, al vacío según su tipo: `string → ""`, `number → null`,
  `boolean → false`, `array → []`, `object → {}`. Así no arrastra el valor viejo: si vuelve a mostrarse,
  aparece vacío.
- **No se valida** — el `then.required` no aplica, así que no bloquea el submit por estar oculto.
- **No entra en el payload** del `onSubmit` — el motor lo excluye.

O sea: ocultar un campo lo saca del contrato de datos por completo (estado, validación y payload), no solo
de la vista.

> **Por qué se limpia:** evita mandar al backend datos de un camino que el usuario abandonó. Por ejemplo, en
> un [componente custom](./custom-widgets.md#ejemplo-completo-tarjeta-con-checkbox--campo-condicional) que
> intercambia entre un input y un select, al cambiar de uno a otro el valor del que se ocultó queda limpio.

## El grid: sin celdas fantasma

Si usás [grid responsivo](./layout-grid.md), un campo oculto **no deja una celda vacía** ocupando su
`colSpan`: UIForm no renderiza el contenedor del campo cuando `isVisible === false`. El grid se reacomoda
solo. (No tenés que hacer nada.)

## Otras condiciones (no solo checkbox)

La condición del `if` puede ser **cualquier cosa** de JSON Schema:

```ts
// Según el valor de un select / enum
allOf: [
  {
    if: { properties: { medioPago: { const: 'tarjeta' } }, required: ['medioPago'] },
    then: { required: ['numeroTarjeta'] },
    else: { properties: { numeroTarjeta: false } },
  },
]

// Según un número (mostrar "tutor" si es menor de edad)
allOf: [
  {
    if: { properties: { edad: { maximum: 17 } }, required: ['edad'] },
    then: { required: ['tutor'] },
    else: { properties: { tutor: false } },
  },
]
```

## Varios campos dependientes

Una entrada del `allOf` **por condición**. Se evalúan todas, así que podés tener varios campos que aparecen
por distintas razones:

```ts
allOf: [
  { if: {/* cond A */}, then: {/* ... */}, else: { properties: { campoA: false } } },
  { if: {/* cond B */}, then: {/* ... */}, else: { properties: { campoB: false } } },
]
```

> Un mismo campo puede depender de **varios** otros: poné todas las condiciones que necesites dentro del
> `if` (con sus `required`). El `if` matchea solo si se cumplen todas.

## Reaccionar al campo que controla (opcional)

La visibilidad ya es automática. Si además querés **leer** el valor del campo que dispara la condición desde
otro componente (sin re-renders de más), usá [`useWatch`](../hooks/use-watch.md):

```tsx
const tieneMascota = useWatch('tieneMascota')
```

## Ejemplo vivo

El [demo](../../../src/App.tsx) tiene este patrón en el bloque `allOf`: el campo **CUIT** aparece (y se hace
obligatorio) solo cuando tildás **"¿Emitís factura electrónica?"**.

## Links

- [schema + uiSchema](./schema-and-uischema.md) — por qué la visibilidad vive en el `schema`.
- [Validación](./validation.md) — cómo y cuándo se valida.
- [Grid responsivo](./layout-grid.md) — layout en columnas.
- [`useWatch`](../hooks/use-watch.md) — observar valores puntuales.
