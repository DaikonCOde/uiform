# UIForm — Guía de uso

UIForm es una librería de formularios para **React + TypeScript** que construís de forma declarativa
sobre dos documentos JSON: **`schema`** (qué es cada dato y su validación) y **`uiSchema`** (cómo se ve
cada campo). Es el modelo de [react-jsonschema-form (RJSF)](https://rjsf-team.github.io/react-jsonschema-form):
el backend dueña el contrato de datos, el frontend la presentación.

## Mini ejemplo

```tsx
import { FormProvider, Field, useFormApi } from '@laus/uiform'
import '@laus/uiform/style.css'
import { Button } from 'antd'

function Submit() {
  const { submit } = useFormApi() // el hook se llama en el cuerpo del componente, no en el onClick
  return <Button onClick={() => submit()}>Enviar</Button>
}

export const Demo = () => (
  <FormProvider schema={schema} uiSchema={uiSchema} onSubmit={(v) => console.log(v)}>
    <Field name="nombre" />
    <Field name="email" />
    <Submit />
  </FormProvider>
)
```

## Navegación

### Empezar

| Página | Qué encontrás |
|--------|---------------|
| [Getting Started](./getting-started.md) | Instalación, import del CSS y quick start completo. |

### Conceptos

| Página | Qué encontrás |
|--------|---------------|
| [schema + uiSchema](./concepts/schema-and-uischema.md) | El modelo mental de los dos documentos. |
| [Referencia del uiSchema](./concepts/uischema-reference.md) | Todas las claves `ui:*` por campo y a nivel raíz. |
| [Secciones](./concepts/sections.md) | Agrupar campos con `ui:sections`. |
| [Grid responsivo](./concepts/layout-grid.md) | Layout en columnas con `layout` y `ui:colSpan` por breakpoint. |
| [Opciones async](./concepts/async-options.md) | Cargar opciones de Select/Autocomplete dinámicamente. |
| [Cargar datos async](./concepts/loading-data.md) | Precargar un form de edición con `hydrate()` sin pisar lo tipeado. |
| [Validación](./concepts/validation.md) | Cómo y cuándo se valida; errores y mensajes custom. |
| [Mensajes de error](./concepts/error-messages.md) | Customizar y traducir mensajes (global + por campo, i18n). |
| [Widgets custom](./concepts/custom-widgets.md) | Reemplazar o agregar widgets con la prop `components`. |
| [Performance](./concepts/performance.md) | Suscripción granular y cómo evitar re-renders. |

### Componentes

| Página | Qué encontrás |
|--------|---------------|
| [`<FormProvider>`](./components/form-provider.md) | Crea el store por instancia y expone el form. |
| [`<Field>`](./components/field.md) | Renderiza un campo por su `name`. |
| [`<FormSection>`](./components/form-section.md) | Renderiza los campos de una sección (default o layout custom). |
| [`<SubmitButton>`](./components/submit-button.md) | Botón de envío cableado al form. |
| [`<UIForm>`](./components/uiform.md) | Atajo todo-en-uno (secciones + barra de submit). |

### Hooks

| Página | Qué encontrás |
|--------|---------------|
| [`useField`](./hooks/use-field.md) | Estado y callbacks de un campo. |
| [`useWatch`](./hooks/use-watch.md) | Observa valores puntuales sin re-renders de más. |
| [`useFormApi`](./hooks/use-form-api.md) | Acciones del form (`submit`, `reset`, `validate`) y flags. |
| [`useAsyncOptions`](./hooks/use-async-options.md) | Opciones de un loader async para casos custom. |
| [`useSection`](./hooks/use-section.md) | Metadata de una sección por id. |
| [`useSections`](./hooks/use-sections.md) | Todas las secciones resueltas. |
| [`useFormStore`](./hooks/use-form-store.md) | Acceso de bajo nivel al store con selector. |

### Widgets

| Página | Qué encontrás |
|--------|---------------|
| [Índice de widgets](./widgets/index.md) | Tabla de `ui:widget` → componente. |
| [text](./widgets/text.md) · [number](./widgets/number.md) · [textarea](./widgets/textarea.md) | Inputs básicos. |
| [select](./widgets/select.md) · [autocomplete](./widgets/autocomplete.md) | Selección con opciones. |
| [radio](./widgets/radio.md) · [checkbox](./widgets/checkbox.md) | Booleanos y enums. |
| [date](./widgets/date.md) · [file](./widgets/file.md) | Fecha y subida de archivos. |
| [fieldset](./widgets/fieldset.md) · [group-array](./widgets/group-array.md) | Contenedores anidados y repetibles. |

## Docs internos de diseño

- [`ARCHITECTURE_V2.md`](../ARCHITECTURE_V2.md) — diseño interno y decisiones.
- [`ROADMAP_V2.md`](../ROADMAP_V2.md) — fases y plan de trabajo.
- [`REVIEW_V2.md`](../REVIEW_V2.md) — verificación end-to-end.
