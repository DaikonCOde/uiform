# Mensajes de error (i18n / custom)

Los mensajes default del motor de validación vienen en **inglés** (`"is required"`, `"must be a valid
email"`, etc.). UIForm te da dos vías para traducirlos o customizarlos, con distinta granularidad:

1. **`errorMessages` global** en el [`<FormProvider>`](../components/form-provider.md) — un mensaje por
   **tipo de validación**, aplicado a **todos** los campos.
2. **`ui:errorMessages` por campo** en el `uiSchema` — override puntual para un campo concreto.

> Lo de validar sale del JSON Schema (ver [Validación](./validation.md)). Acá solo cambiás **qué texto se
> muestra** cuando una regla falla; no agregás ni quitás reglas.

## Mensajes globales: `errorMessages`

Pasás un mapa `{ tipoDeValidación: mensaje }` al provider. Se inyecta en cada campo —incluidos los
anidados de `fieldset` y `group-array`— así que un solo objeto traduce el form entero:

```tsx
const errorMessages = {
  required: 'Este campo es obligatorio',
  format: 'El formato no es válido',
  minimum: 'El valor es demasiado bajo',
  maximum: 'El valor es demasiado alto',
  minLength: 'Demasiado corto',
  maxLength: 'Demasiado largo',
  pattern: 'El formato no coincide',
}

<FormProvider schema={schema} uiSchema={uiSchema} errorMessages={errorMessages}>
  {/* … */}
</FormProvider>
```

Las keys son **tipos de validación**, no nombres de campo. Si un campo dispara la regla `required`, ve el
texto de `required`; si dispara `format`, el de `format`; y así.

## Override por campo: `ui:errorMessages`

Cuando un campo necesita un mensaje propio (más específico que el global), lo declarás en su entrada del
`uiSchema`. **Gana sobre el global** para las keys que toque; el resto sigue cayendo al global:

```ts
const uiSchema = {
  email: {
    'ui:widget': 'email',
    'ui:errorMessages': {
      required: 'Necesitamos tu email para contactarte',
      format: 'Ingresá un email válido (ej: nombre@dominio.com)',
    },
  },
  edad: {
    'ui:errorMessages': {
      minimum: 'Tenés que ser mayor de 18',
    },
  },
}
```

Con el `errorMessages` global del bloque anterior **más** este `uiSchema`:

- `email` requerido vacío → "Necesitamos tu email para contactarte" (override).
- `edad` por debajo del mínimo → "Tenés que ser mayor de 18" (override).
- cualquier otro campo requerido vacío → "Este campo es obligatorio" (global).

### Precedencia

```
ui:errorMessages (por campo)  >  errorMessages (global)  >  default del motor (inglés)
```

## Tipos de validación

Las keys de ambos mapas son los tipos de validación estándar de JSON Schema. Los más comunes:

| Key | Se dispara cuando… |
|-----|--------------------|
| `required` | El campo está en `required` y viene vacío. |
| `type` | El tipo del valor no coincide (`string`, `number`, `boolean`, …). |
| `format` | Falla un `format` (`email`, `date`, `uri`, …). |
| `minimum` / `maximum` | Número fuera del rango `[minimum, maximum]`. |
| `exclusiveMinimum` / `exclusiveMaximum` | Número fuera del rango exclusivo. |
| `minLength` / `maxLength` | String fuera del largo permitido. |
| `pattern` | String que no matchea el `pattern` (regex). |
| `enum` | Valor fuera de la lista `enum`. |
| `oneOf` | No matchea ninguna rama de `oneOf`. |
| `minItems` / `maxItems` | Array fuera de la cantidad de ítems permitida. |
| `multipleOf` | Número que no es múltiplo del valor dado. |

Solo definís las keys que te interesan; las que no toques usan el texto default.

## Ejemplo: traducir el form completo al español

Centralizá los mensajes globales y dejá `ui:errorMessages` solo para los casos especiales:

```tsx
// errores.es.ts — reutilizable entre forms
export const erroresEs = {
  required: 'Campo obligatorio',
  format: 'Formato inválido',
  type: 'Tipo de dato incorrecto',
  minimum: 'Valor demasiado bajo',
  maximum: 'Valor demasiado alto',
  minLength: 'Texto demasiado corto',
  maxLength: 'Texto demasiado largo',
  pattern: 'El valor no tiene el formato esperado',
  enum: 'Seleccioná una opción válida',
  minItems: 'Agregá al menos un elemento',
}
```

```tsx
import { erroresEs } from './errores.es'

const uiSchema = {
  cuit: {
    'ui:errorMessages': {
      pattern: 'El CUIT debe tener 11 dígitos', // más claro que el global
    },
  },
}

<FormProvider schema={schema} uiSchema={uiSchema} errorMessages={erroresEs}>
  {/* … */}
</FormProvider>
```

> Bajo el capó, tanto `errorMessages` como `ui:errorMessages` se compilan al `x-jsf-errorMessage` que
> entiende el motor (ver [Validación](./validation.md)). No necesitás escribir `x-jsf-errorMessage` a
> mano: es el target interno, no la API que usás.

## Links

- [Validación](./validation.md)
- [Referencia del `uiSchema`](./uischema-reference.md)
- [`<FormProvider>`](../components/form-provider.md)
- [Modelo `schema` + `uiSchema`](./schema-and-uischema.md)
