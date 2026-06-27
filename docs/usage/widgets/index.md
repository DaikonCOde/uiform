# Widgets (tipos de campo)

Un **widget** es el componente de UI que renderiza un campo. UIForm trae un set de widgets sobre
[Ant Design](https://ant.design/) y resuelve cuál usar para cada campo a partir del `uiSchema` (o, si no
lo declarás, lo infiere del `schema`).

> Recordá la separación: el `schema` define **qué** es el dato y su validación; el `uiSchema` define
> **cómo** se ve. Ver [Conceptos: uiSchema](../concepts/uischema-reference.md).

---

## Tabla de widgets

| `ui:widget` | Componente | Tipo de dato (schema) | Página |
|-------------|------------|------------------------|--------|
| `text`, `email`, `hidden` | `TextField` (Input) | `string` | [text](./text.md) |
| `number`, `money` | `NumberField` (InputNumber) | `number` | [number](./number.md) |
| `textarea` | `TextareaField` (Input.TextArea) | `string` | [textarea](./textarea.md) |
| `select`, `country` | `SelectField` (Select) | `string` / enum | [select](./select.md) |
| `autocomplete` | `AutocompleteField` (AutoComplete) | `string` | [autocomplete](./autocomplete.md) |
| `radio` | `RadioField` (Radio.Group) | enum | [radio](./radio.md) |
| `checkbox` | `CheckboxField` (Checkbox) | `boolean` (o value-checkbox) | [checkbox](./checkbox.md) |
| `date` | `DateField` (DatePicker) | `string` (fecha) | [date](./date.md) |
| `time` | `TimeField` (TimePicker) | `string` (hora `HH:mm:ss`) | [time](./time.md) |
| `file` | `FileField` (Upload) | archivo(s) | [file](./file.md) |
| `fieldset` | `FieldsetField` | `object` | [fieldset](./fieldset.md) |
| `group-array` | `GroupArrayField` | `array` de `object` | [group-array](./group-array.md) |

El mapeo es exacto: `text`/`email`/`hidden` y `select`/`country` comparten componente, igual que
`number`/`money` y `textarea`. El `inputType` (`email`, `money`, `country`, `hidden`) ajusta el
comportamiento interno del componente compartido.

---

## Cómo se elige el widget

1. **Explícito** — si declarás `'ui:widget': 'select'` en el `uiSchema`, se usa ese.
2. **Inferido** — si no lo declarás, el motor lo deduce del `type`/`format` del `schema`
   (p. ej. `type: 'string', format: 'email'` → input de email; `type: 'number'` → numérico; un
   `enum` → select/radio; `type: 'object'` → fieldset; `type: 'array'` de objetos → group-array).

```ts
// schema: dice que es un string con formato email
const schema = {
  type: 'object',
  properties: { email: { type: 'string', format: 'email', title: 'Email' } },
}

// uiSchema: fuerza el widget y agrega presentación (opcional)
const uiSchema = {
  email: { 'ui:widget': 'email', 'ui:placeholder': 'tu@mail.com' },
}
```

---

## inputType desconocido (Fallback)

Si un campo resuelve a un `inputType` que **no tiene componente registrado** en el mapa, UIForm renderiza
una caja de aviso (`Fallback`) en vez de romper el form:

```
Unsupported field type: <inputType> (<name>)
```

Es un aviso visual, no un error fatal: el resto del formulario sigue funcionando. Si ves esto, revisá el
`ui:widget` del campo o que el `inputType` esté entre los soportados de la tabla.

---

## Ver también

- [Getting started](../getting-started.md)
- [Conceptos: uiSchema](../concepts/uischema-reference.md)
- [Conceptos: opciones async](../concepts/async-options.md) (para `select` / `autocomplete`)
