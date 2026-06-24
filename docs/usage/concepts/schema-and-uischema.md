# El modelo de dos documentos: `schema` + `uiSchema`

UIForm v2 sigue el modelo de [react-jsonschema-form (RJSF)](https://rjsf-team.github.io/react-jsonschema-form):
un formulario se describe con **dos documentos JSON separados**, cada uno con una responsabilidad única.

- **`schema`** — JSON Schema **puro**. Define **qué** es cada dato y su validación: tipos, requeridos,
  formatos, mínimos/máximos. Es el contrato de datos.
- **`uiSchema`** — Define **cómo** se presenta cada campo: el componente (widget), placeholder, secciones,
  orden, opciones extra. Es presentación pura.

```ts
// schema → SOLO el dato y su validación
const schema = {
  type: 'object',
  required: ['nombre', 'email'],
  properties: {
    nombre: { type: 'string', title: 'Nombre' },
    email:  { type: 'string', title: 'Email', format: 'email' },
  },
}

// uiSchema → SOLO la presentación
const uiSchema = {
  nombre: { 'ui:widget': 'text',  'ui:placeholder': 'Tu nombre', 'ui:autofocus': true },
  email:  { 'ui:widget': 'email', 'ui:placeholder': 'tu@mail.com' },
}
```

El `schema` declara que `email` es un string con `format: 'email'` (validación). El `uiSchema` declara que
se renderiza con el widget `email` y un placeholder. Son ortogonales.

## Por qué dos documentos

Separar dato de presentación no es un capricho: habilita responsabilidades cruzadas limpias.

- **El backend puede dueñar el `schema`.** El contrato de datos vive del lado del servidor (es la misma
  fuente que valida en la API) y el frontend lo consume tal cual.
- **El frontend dueña el `uiSchema`.** La capa visual es decisión del cliente y no contamina el contrato.
- **Un `schema`, N `uiSchema`.** El mismo contrato de datos se puede presentar de formas distintas (un
  formulario completo, una variante compacta, una versión solo-lectura) sin tocar el dato.

## Cómo funciona por dentro (en una línea)

Un **compilador** baja el `uiSchema` a las extensiones internas `x-jsf-*` sobre un clon del `schema`; ese
clon alimenta al motor headless [`@laus/json-schema-form`](https://github.com/DaikonCOde/json-schema-form),
que genera los campos y valida. UIForm mapea esos campos a componentes de **Ant Design** y maneja el estado
en un **store por instancia** con suscripción granular.

```
schema + uiSchema  →  compileUiSchema  →  createHeadlessForm (motor)  →  store + AntD
```

## Nunca escribís `x-jsf-*` a mano

Las claves `x-jsf-presentation`, `x-jsf-order`, `x-jsf-sections` son **lenguaje interno del motor** que
emite el compilador a partir de tu `uiSchema`. Vos siempre trabajás con `ui:*`. El compilador clona el
`schema` y nunca lo muta, así que tu contrato de datos queda intacto.

## Links

- [Referencia completa del `uiSchema`](./uischema-reference.md)
- [Widgets disponibles](../widgets/index.md)
- [Secciones](./sections.md)
- [Validación](./validation.md)
- [`<FormProvider>`](../components/form-provider.md)
- [Getting started](../getting-started.md)
