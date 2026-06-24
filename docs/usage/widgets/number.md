# number / money

Input numérico. Renderiza `NumberField` (sobre `InputNumber` de Ant Design).

- **`number`** — input numérico genérico.
- **`money`** — formatea el valor como moneda (prefijo `$` y separadores de miles) con `precision: 2`
  por defecto. El valor guardado sigue siendo un `number` plano (sin formato).

## Tipo de dato

`number`. El componente convierte siempre a número o `null` (un input vacío emite `null`).

## Ejemplo

```ts
// schema
const schema = {
  type: 'object',
  properties: {
    cantidad: { type: 'number', title: 'Cantidad', minimum: 1, maximum: 99 },
    precio:   { type: 'number', title: 'Precio' },
  },
}

// uiSchema
const uiSchema = {
  cantidad: { 'ui:widget': 'number', 'ui:options': { min: 1, max: 99, step: 1 } },
  precio:   { 'ui:widget': 'money' },
}
```

## ui:options soportadas

| Opción | Tipo | Efecto |
|--------|------|--------|
| `placeholder` | `string` | Placeholder del input. |
| `min` | `number` | Valor mínimo permitido por el input. |
| `max` | `number` | Valor máximo permitido por el input. |
| `step` | `number` | Incremento al usar las flechas. |
| `precision` | `number` | Cantidad de decimales. En `money` se fuerza a `2`. |

```ts
const uiSchema = {
  temperatura: {
    'ui:widget': 'number',
    'ui:options': { min: -50, max: 50, step: 0.5, precision: 1 },
  },
}
```

## Notas

- `min`/`max` acá son restricciones de UI del input. La **validación** real (rechazar valores fuera de
  rango en el submit) sale del `schema` (`minimum`/`maximum`). Definí ambos para una buena UX.
- En `money`, `precision` siempre es `2` (no se puede sobreescribir vía `ui:options`).
