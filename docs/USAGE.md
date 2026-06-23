# UIForm — Guía de uso

> Guía del consumidor de **UIForm v2**: qué es, cómo se usa y la referencia completa de la API.
> Para el diseño interno ver [`ARCHITECTURE_V2.md`](./ARCHITECTURE_V2.md).

---

## 1. Qué es

UIForm es una librería de formularios para **React + TypeScript** que construís de forma **declarativa**
a partir de dos documentos JSON:

- **`schema`** — JSON Schema puro: define **qué** es cada dato y su validación (tipos, requeridos, formatos).
- **`uiSchema`** — define **cómo** se ve cada campo: el componente (widget), placeholder, secciones, etc.

Esta separación es el modelo de [react-jsonschema-form (RJSF)](https://rjsf-team.github.io/react-jsonschema-form):
el backend puede dueñar el `schema` (contrato de datos) y el frontend el `uiSchema` (presentación). El
mismo `schema` puede tener N `uiSchema` distintos.

**Cómo funciona por dentro (en una línea):** un compilador baja el `uiSchema` al motor headless
[`@laus/json-schema-form`](https://github.com/DaikonCOde/json-schema-form), que genera los campos y valida;
UIForm los mapea a componentes de **Ant Design** y maneja el estado con un store por instancia (Zustand)
con **suscripción granular** (tipear en un campo no re-renderiza a los demás).

---

## 2. Instalación

```bash
npm install @laus/uiform @laus/json-schema-form dayjs
# peers (React 18 recomendado):
npm install react@18 react-dom@18 antd@5
```

> **React 17:** compatible usando `antd@4` (AntD 5 requiere React 18+).

```ts
import '@laus/uiform/style.css' // estilos de los componentes
```

---

## 3. Modelo mental: `schema` + `uiSchema`

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

El `schema` define que `email` es un string con formato email (validación). El `uiSchema` define que se
renderiza con el widget `email` y un placeholder. **Nunca escribís `x-jsf-*` a mano** — eso es lenguaje
interno del motor que emite el compilador.

---

## 4. Quick start

La API primaria es **componible**: un `<FormProvider>` que crea el form, y `<Field>` para renderizar cada
campo donde quieras.

```tsx
import { FormProvider, Field, useFormApi } from '@laus/uiform'
import '@laus/uiform/style.css'
import { Button } from 'antd'

function MiForm() {
  return (
    <FormProvider
      schema={schema}
      uiSchema={uiSchema}
      onSubmit={(values) => console.log('payload válido:', values)}
      config={{ validateTrigger: 'onChange' }}
    >
      <Field name="nombre" />
      <Field name="email" />
      <SubmitBar />
    </FormProvider>
  )
}

// El botón de submit consume las acciones del form vía hook.
function SubmitBar() {
  const { submit, reset, isSubmitting } = useFormApi()
  return (
    <>
      <Button type="primary" loading={isSubmitting} onClick={() => submit()}>Enviar</Button>
      <Button onClick={() => reset()}>Reset</Button>
    </>
  )
}
```

`onSubmit` recibe el payload ya transformado a JSON Schema (números como números, vacíos omitidos, etc.)
y solo se llama si la validación pasa.

---

## 5. API

### `<FormProvider>`

Crea **un store por instancia** y expone el form a sus hijos. Props:

| Prop | Tipo | Descripción |
|------|------|-------------|
| `schema` | `JsfObjectSchema` | JSON Schema puro (requerido). |
| `uiSchema` | `UiSchema` | Presentación (opcional). |
| `initialValues` | `Record<string, any>` | Valores iniciales (respeta falsy: `0`/`false`). |
| `onSubmit` | `(values, errors?) => void \| Promise` | Se llama en submit válido con el payload JSON. |
| `onChange` | `(values, errors?) => void` | Se llama en cada cambio de valor. |
| `asyncLoaders` | `Record<string, AsyncOptionsLoader>` | Cargadores de opciones async (Select/Autocomplete). |
| `config` | `UIFormConfig` | Configuración (ver §10). |

### `<Field name>`

Renderiza UN campo por su `name`. Es un **controlador**: resuelve la suscripción granular y delega en el
componente presentacional según el widget. Los campos se renderizan donde quieras, en cualquier layout.

```tsx
<div className="mi-grid">
  <Field name="nombre" />
  <Field name="email" />
</div>
```

### Hooks

```ts
// Estado + callbacks de UN campo (suscrito solo a su slice).
useField(name: string): {
  value: any
  error?: string | object
  touched: boolean
  onChange: (value: any) => void   // estable
  onBlur: () => void               // estable
  field: Field                     // metadata del motor (label, inputType, options, …)
}

// Observa valores puntuales (p. ej. para mostrar/ocultar lógica). Re-render SOLO si cambian.
useWatch(name: string): any
useWatch(names: string[]): any[]

// Acciones del form + flags reactivos.
useFormApi(): {
  submit: () => Promise<void>
  reset: (values?) => void
  validate: () => FormErrors
  isSubmitting: boolean
  isValid: boolean                 // true si no hay errores conocidos
}

// Opciones async de un loader (lo usan Select/Autocomplete internamente; útil para casos custom).
useAsyncOptions(loaderId?: string, deps?: string[]): {
  options: any[]; loading: boolean; error: string | null; reload: (search?) => void
}

// Acceso de bajo nivel al store con un selector (suscripción granular).
useFormStore(selector, equalityFn?)
```

> **Regla de oro de performance:** un selector de `useFormStore` debe devolver algo **referencialmente
> estable** (primitivo o ref estable). Devolver un objeto/array/función nuevo en cada llamada re-renderiza
> el componente ante cualquier cambio del store. Para arrays usá `shallow` de `zustand/shallow`.

---

## 6. Referencia del `uiSchema`

### Por campo (clave = `name` de la property)

| Clave | Efecto |
|-------|--------|
| `ui:widget` | Componente a renderizar (ver tabla de widgets en §7). |
| `ui:placeholder` | Placeholder del input. |
| `ui:autofocus` | Foco automático al montar. |
| `ui:disabled` | Deshabilita el campo. |
| `ui:title` | Sobreescribe el label (semántica RJSF). |
| `ui:description` | Texto de ayuda. |
| `ui:options` | Objeto con props extra que se pasan al campo (`accept`, `maxFileSize`, `asyncOptions`, `multiple`, …). |
| `ui:order` | Orden de los hijos en un `fieldset`. |

### A nivel raíz

| Clave | Efecto |
|-------|--------|
| `ui:sections` | Agrupa campos en secciones (ver §8). |
| `ui:order` | Orden global de los campos. |

```ts
const uiSchema = {
  'ui:sections': [
    { id: 'datos', title: 'Datos personales', fields: ['nombre', 'email'] },
  ],
  nombre: { 'ui:widget': 'text', 'ui:autofocus': true },
  email:  { 'ui:widget': 'email', 'ui:placeholder': 'tu@mail.com' },
  avatar: { 'ui:widget': 'file', 'ui:options': { accept: 'image/*', maxFileSize: 2048 } },
}
```

---

## 7. Widgets (tipos de campo)

`ui:widget` resuelve el componente. Si no lo especificás, se infiere del `type`/`format` del schema.

| `ui:widget` | Componente | Tipo de dato típico |
|-------------|------------|---------------------|
| `text`, `email`, `hidden` | Input de texto | `string` |
| `number`, `money` | Input numérico | `number` |
| `textarea` | Área de texto | `string` |
| `select`, `country` | Select | `string` / enum |
| `autocomplete` | Autocomplete con búsqueda | `string` |
| `radio` | Radios | enum |
| `checkbox` | Checkbox | `boolean` (o value-checkbox) |
| `date` | Date picker | `string` (fecha) |
| `file` | Upload | archivo |
| `fieldset` | Grupo de campos | `object` |
| `group-array` | Grupo repetible | `array` de `object` |

Un `inputType` sin componente registrado renderiza un aviso (no rompe el form).

---

## 8. Secciones (`ui:sections`)

Las secciones son **presentación** → viven en el `uiSchema`. Agrupan campos por `name` y se pueden
renderizar en el orden y layout que quieras.

```ts
const uiSchema = {
  'ui:sections': [
    { id: 'personal', title: 'Datos personales', description: '...', fields: ['nombre', 'email'] },
    { id: 'direccion', title: 'Dirección', fields: ['calle', 'ciudad'] },
  ],
  // ...presentación por campo
}
```

En el componente, leé las secciones resueltas del store y renderizá cada una a tu gusto:

```tsx
import { useFormStore, Field } from '@laus/uiform'

function FormBody() {
  const sections = useFormStore((s) => s.sections) // metadata estructural (no cambia al tipear)
  return sections.map((sec) => (
    <section key={sec.id}>
      <h3>{sec.title}</h3>
      {sec.fieldNames.map((name) => <Field key={name} name={name} />)}
    </section>
  ))
}
```

> Los campos que no aparecen en ninguna sección quedan en una sección implícita `__default__`. Si no
> definís `ui:sections`, todos los campos van a `__default__`.

---

## 9. Opciones async (Select / Autocomplete)

Para opciones que se cargan dinámicamente (de una API, según otros campos, o por búsqueda):

```tsx
const asyncLoaders = {
  // El id matchea con asyncOptions.id del uiSchema. Recibe { formValues, search }.
  ciudades: async ({ formValues, search }) => {
    const res = await fetch(`/api/ciudades?pais=${formValues.pais}&q=${search ?? ''}`)
    return { options: await res.json() } // [{ label, value }]
  },
}

const uiSchema = {
  ciudad: {
    'ui:widget': 'autocomplete',
    'ui:options': {
      asyncOptions: {
        id: 'ciudades',           // matchea con la key de asyncLoaders
        dependencies: ['pais'],   // recarga cuando cambia 'pais'
        searchable: true,         // habilita búsqueda server-side (onSearch → reload)
      },
    },
  },
}

<FormProvider schema={schema} uiSchema={uiSchema} asyncLoaders={asyncLoaders}>…</FormProvider>
```

- **`dependencies`**: lista de names; al cambiar cualquiera, se recarga el loader.
- **`searchable`**: en `autocomplete`/`select`, el término tipeado se pasa al loader como `search` (filtrado
  server-side, con debounce). Sin `searchable`, las opciones se cargan una vez y se filtran en cliente.
- Si el `id` no matchea ningún loader, se emite un `console.warn` en dev (no rompe).

---

## 10. Validación y configuración

La validación sale del **JSON Schema puro** (requeridos, formatos, `minimum`, etc.) vía el motor.

```ts
config={{
  validateTrigger: 'onChange' | 'onBlur' | 'onSubmit', // cuándo validar (default: onSubmit)
  size: 'small' | 'middle' | 'large',
  layout: 'horizontal' | 'vertical' | 'inline',
  disabled: boolean,
  showRequiredMark: boolean,
}}
```

- `submit()` valida primero; **si hay errores, NO llama a `onSubmit`** (no se envía payload inválido).
- Los errores quedan en `store.errors` (string por campo; objeto/array para `fieldset`/`group-array`).
- Mensajes custom: definí `x-jsf-errorMessage` en el `schema` (validación-adyacente).

```ts
// errores en vivo
const errors = useFormStore((s) => s.errors)
const isValid = useFormApi().isValid
```

---

## 11. Contenedores: `fieldset` y `group-array`

### Fieldset (objeto anidado)

```ts
// schema
direccion: {
  type: 'object', title: 'Dirección',
  properties: { calle: { type: 'string' }, numero: { type: 'number' } },
}
// uiSchema
direccion: {
  'ui:widget': 'fieldset',
  calle:  { 'ui:widget': 'text' },
  numero: { 'ui:widget': 'number' },
}
```
Produce `values.direccion = { calle, numero }`.

### Group-array (array repetible de objetos)

```ts
// schema
contactos: {
  type: 'array', title: 'Contactos',
  items: { type: 'object', properties: { nombre: { type: 'string' }, telefono: { type: 'string' } } },
}
// uiSchema
contactos: {
  'ui:widget': 'group-array',
  nombre:   { 'ui:widget': 'text' },
  telefono: { 'ui:widget': 'text' },
}
```
Produce `values.contactos = [{ nombre, telefono }, …]`, con botones de agregar/eliminar.

> En las secciones, un contenedor se lista como **UNA** entrada (`'direccion'`, `'contactos'`); sus hijos
> los renderiza el propio contenedor.

---

## 12. Performance: suscripción granular

UIForm está diseñado para que **tipear en un campo re-renderice SOLO ese campo**. Cada `<Field>` se
suscribe únicamente a su slice del store (value/error/touched). Un `Select` con `dependencies` solo
reacciona a SUS dependencias.

Para construir UI custom que lea estado sin re-renders de más:

- `useField(name)` para un campo.
- `useWatch(names)` para observar valores puntuales.
- `useFormStore(selector)` para slices propios — recordá la **regla de oro** (§5): selector estable.

---

## Estado de la API pública

> Las Fases 1-4 (compilador, store, hooks, campos, contenedores, async, validación) están implementadas y
> **verificadas end-to-end en el browser** (ver [`REVIEW_V2.md`](./REVIEW_V2.md)). Pendiente para las
> Fases 5-7: los componentes de azúcar `<UIForm>`/`<FormSection>`/`<SubmitButton>`, el responsive
> SSR-safe, y el cableado final de los **exports públicos** en `src/lib/index.ts`. Mientras tanto, el
> playground (`src/App.tsx`) consume la API desde el source — es el ejemplo vivo más completo.
```
