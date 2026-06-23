# UIForm v2 — Diseño de arquitectura (store + hooks + secciones componibles)

> **Estado:** propuesta de diseño (doc-first). Aún NO implementado. Define la base para migrar de un
> formulario controlado monolítico a un **store headless con suscripción granular** y **renderizado
> componible por secciones**.
>
> Decisiones tomadas (2026-06-22): **Zustand** como store · **doc-first** antes de implementar.
>
> Decisiones tomadas (2026-06-23): **modelo RJSF de dos documentos** (`schema` + `uiSchema`) como API
> pública · **`x-jsf-*` queda como lenguaje INTERNO del motor** (no lo escribe el consumidor) · un
> **compilador `compileUiSchema`** traduce `uiSchema` → `x-jsf-*` antes del `createHeadlessForm` ·
> **secciones se autoran en el `uiSchema`** (presentación), no en el schema · `ui:widget` resuelve el
> componente vía `FIELD_COMPONENT_MAP`.

---

## 1. Motivación

Hoy (v1) `UIForm` es un **formulario controlado monolítico**: un componente padre tiene todo el
estado (`values`, `errors`) y pasa `value`/`onChange` por props a cada campo. Tipear en un campo hace
`setState` en el padre → **re-render del árbol entero**. Más un `FormContext` único que arrastra
`...state` → cualquier consumidor re-renderiza ante cualquier cambio (bug §11.8 del `ARCHITECTURE.md`).

**Objetivos de v2:**

1. **Suscripción granular:** tipear en el campo A re-renderiza SOLO el campo A.
2. **Componer la UI por secciones:** definir grupos en el JSON y renderizarlos en componentes propios,
   en el orden y layout que el consumidor quiera (no un form de inicio a fin).
3. **Acceso por hooks:** `useField`, `useWatch`, `useSection`, `useFormApi`.
4. **Base extensible** para features incrementales (wizards, validación por sección, arrays, etc.).
5. **Listo para producción (deadline: 1 semana).** Base sólida y **testeada**. **Sin atadura a la
   estructura v1:** nada está construido sobre la librería todavía (solo demos), así que NO hay que
   conservar compatibilidad — se reestructura lo que haga falta. Conservar una API que nadie usa solo
   agrega superficie para "validar que no se rompa", que es justo lo que queremos evitar.

---

## 1 bis. Mandato: reestructurar sin atarse a v1

Nada está construido sobre la librería (solo demos) → **no hay compatibilidad que preservar**. Estas
son las decisiones de arquitectura, ya sin la mochila de la compat:

### 🗑️ DROP
- **Doble fuente de estado** (`values` local en `UIFormContent` + `formValues` en el contexto) → una
  sola verdad: el **store**.
- **`internalTouched` por campo** → `touched` vive en el store.
- **`StableAutocomplete`, su comparador `React.memo` custom y la memoización a mano** del Autocomplete
  → innecesarios con store + Controller + suscripción granular.
- **`FormContext` + `src/context/reduce.ts` + `useFormContext`** → reemplazados por el store. Se
  **eliminan** (no se deprecan; no hay consumidores).
- **Generadores de CSS duplicados** (`generateDirectResponsiveCSS`, etc.).

### 🔧 RESTRUCTURE
- Estado → store Zustand (este documento).
- **Contrato de campos:** el Controller arma un `FieldComponentProps` explícito y limpio. Se elimina
  el *prop-stripping* frágil (`const { type, jsonType, _rootLayout, errorMessage, getFormValues, …}
  = antdProps`).
- **Responsive CSS:** usar los generadores que **el motor ya exporta** (`generateResponsiveCSS`,
  `generateResponsiveFieldCSS`) + inyección **SSR-safe** (guard de `document`). Una sola vía.
- **IDs con `useId()`** (no `Math.random()`/`substr`).
- **API pública componible primero**; `UIForm` es un atajo de conveniencia.

### ✅ KEEP
- Capa presentacional sobre Ant Design (campos), limpiada de estado/suscripción.
- Motor headless `@laus/json-schema-form` (fields/validación/layout).
- `formValuesToJsonValues` / `getDefaultValuesFromFields` / `setDeep` (ya corregidas).
- Build de Vite lib + exports.

### ➕ ADD (no negociable para producción)
- **Tests** (Vitest + Testing Library) en el camino crítico: store, hooks, secciones, falsy/anidados,
  aislamiento de re-render. Es la red que reemplaza al "validar a mano que no se rompa".

---

## 1 ter. Modelo de dos documentos (RJSF) + compilador

**Norte (referencia: react-jsonschema-form):** separar QUÉ es el dato de CÓMO se ve.

- **`schema`** (JSON Schema puro): tipos, requeridos, validación. Es el **contrato de datos**; típicamente
  lo dueña el backend. No lleva presentación.
- **`uiSchema`** (documento aparte): presentación por campo — `ui:widget` (qué componente renderiza),
  `ui:placeholder`, `ui:autofocus`, `ui:options`, `ui:order`, y nuestras **secciones**. Es concern del
  frontend. El mismo `schema` puede tener N `uiSchema` distintos.

### Tensión con el motor (verificada en el fork)

`@laus/json-schema-form` es **single-document**: lee la presentación desde `x-jsf-presentation` DENTRO
del schema y **splatea todas sus props sobre el field** (`src/field/schema.ts:127`, `src/field/type.ts:4`:
*"allows for all x-jsf-presentation properties to be splatted"*). No conoce el concepto de `uiSchema`.

### Reconciliación: un compilador, el motor intacto

No reescribimos el motor. Agregamos **una capa** que compila `uiSchema` → `x-jsf-*` y lo mergea al schema
antes de `createHeadlessForm`. Como el motor splatea todo `x-jsf-presentation` al field, la traducción es
una **tabla de mapeo**:

```
schema + uiSchema
      │
      ▼  compileUiSchema(schema, uiSchema) → schemaInterno (con x-jsf-*)
      │     ui:widget       → x-jsf-presentation.inputType   (clave de FIELD_COMPONENT_MAP)
      │     ui:placeholder  → x-jsf-presentation.placeholder
      │     ui:autofocus    → x-jsf-presentation.autofocus
      │     ui:options.{k}  → x-jsf-presentation.{k}         (accept, maxFileSize, async, etc.)
      │     ui:sections     → x-jsf-sections                (resuelto luego por resolveSections)
      │     ui:order        → orden dentro de secciones
      ▼
createHeadlessForm(schemaInterno)   ← motor SIN cambios
      ▼
store + hooks + <Field>/<FormSection>   ← diseño v2 intacto (secciones §6, store §3)
```

### Decisiones (2026-06-23)

1. **`x-jsf-*` es INTERNO.** El consumidor solo escribe `schema` + `uiSchema`. El `x-jsf-*` es lenguaje
   del motor que emite el compilador. **No** hay passthrough público de `x-jsf-*` (una sola forma de
   hacer las cosas; menos superficie de confusión).
2. **Secciones se autoran en el `uiSchema`** (son presentación pura), p. ej. bajo `ui:sections`. La
   **maquinaria interna NO cambia**: el compilador las baja a `x-jsf-sections` y `resolveSections` (§6)
   las resuelve a `ResolvedSection[]` igual que antes. Mantenemos nuestra ventaja sobre RJSF (que no
   tiene secciones de primera clase) sin contradecir la decisión #1.
3. **`ui:widget` resuelve el componente** vía `FIELD_COMPONENT_MAP` (+ overrides custom). El `schema`
   define el TIPO de dato; el `uiSchema` define el COMPONENTE. Si no hay `ui:widget`, se infiere del
   `type`/`format` del schema (default sensato).

```ts
// src/store/compileUiSchema.ts — única vía de entrada de presentación.
function compileUiSchema(schema: JsfObjectSchema, uiSchema: UiSchema): JsfObjectSchema
```

> **Validación** sigue saliendo del JSON Schema puro (lo más fiel a RJSF). Los mensajes custom
> (`x-jsf-errorMessage`) son validación-adyacente: se siguen emitiendo internamente (vía `ui:errorMessages`
> o equivalente) — a decidir en el bloque de validación.

---

## 2. Vista general

```
<FormProvider schema uiSchema onSubmit onChange asyncLoaders initialValues config>
     │   crea UN store (Zustand) por instancia. El Context solo guarda la REFERENCIA al store
     │   → la referencia es estable → el Context nunca dispara re-renders por sí mismo.
     │
     ├── el consumidor arma la UI libremente:
     │     <FormSection id="personal" />                      ← render default de la sección
     │     <FormSection id="address">{(fields) => <MiGrid fields={fields}/>}</FormSection>
     │     <Field name="email" />                              ← un campo suelto donde quiera
     │     <SubmitButton>Guardar</SubmitButton>
     │
     └── hooks (cada uno se suscribe SOLO a su slice vía selector):
           useField(name)     → { value, error, touched, onChange, onBlur, field }
           useWatch(names)    → valores observados (re-render solo si cambian)  ← acá muere el §11.8
           useSection(id)     → { section, fields }   (metadata; sin valores)
           useFormApi()       → { submit, reset, validate, isSubmitting, isValid }
           useAsyncOptions(id, deps) → { options, loading, error }
```

---

## 3. El store (Zustand, por instancia)

Usamos **`zustand/vanilla` `createStore`** para instanciar un store por cada `<FormProvider>` (no un
store global: dos forms en pantalla no se pisan). Los componentes se suscriben con `useStore(store,
selector)` y `zustand/shallow` para selectores que devuelven objetos/arrays.

### 3.1 Shape del estado

```ts
interface FormState {
  // ── Estructura (inmutable tras crear) ──
  fields: Field[]                              // del engine (headless), top-level
  fieldsByName: Record<string, Field>          // índice O(1) para lookup (soporta paths anidados)
  sections: ResolvedSection[]                  // x-jsf-sections ya resueltas a fields
  layout: JsfLayoutConfig | null               // layout raíz del engine

  // ── Estado mutable ──
  values: Record<string, any>
  errors: FormErrors                           // del engine (string | nested | array)
  touched: Record<string, boolean>
  submitted: boolean
  isSubmitting: boolean

  // ── Cache de opciones async (reemplaza asyncOptionsCache del contexto v1) ──
  async: Record<string, { options: any[]; loading: boolean; error: string | null }>

  // ── Acciones (referencias estables) ──
  setValue: (name: string, value: any) => void     // soporta paths: "address.street"
  setValues: (values: Record<string, any>) => void
  setTouched: (name: string) => void
  validate: () => FormErrors
  submit: () => Promise<void>
  reset: (values?: Record<string, any>) => void
  loadAsyncOptions: (loaderId: string, search?: string) => Promise<void>
}

interface ResolvedSection {
  id: string
  title?: string
  description?: string
  fieldNames: string[]
  fields: Field[]            // resueltos desde fieldsByName, en orden
}
```

### 3.2 Factory

```ts
// src/store/createFormStore.ts
import { createStore } from 'zustand/vanilla'

export function createFormStore(schema: JsfObjectSchema, uiSchema: UiSchema, opts: FormStoreOptions): StoreApi<FormState> {
  // 0) Compilar uiSchema → x-jsf-* y mergear al schema (única vía de presentación, §1 ter).
  const internalSchema = compileUiSchema(schema, uiSchema)

  // 1) Una sola vez: parsear el schema (ya con x-jsf-*) con el motor headless.
  const { fields, handleValidation, layout } = createHeadlessForm(internalSchema, {
    strictInputType: false,
    initialValues: opts.initialValues,
    asyncLoaders: opts.asyncLoaders,
  })

  // 2) Resolver secciones desde el x-jsf-sections que emitió el compilador (ver §6).
  const sections = resolveSections(internalSchema, fields)

  return createStore<FormState>((set, get) => ({
    fields,
    fieldsByName: indexByName(fields),
    sections,
    layout,
    values: getDefaultValuesFromFields(fields, opts.initialValues),
    errors: {},
    touched: {},
    submitted: false,
    isSubmitting: false,
    async: {},

    setValue: (name, value) => {
      set((s) => ({ values: setPath({ ...s.values }, name, value) }))
      if (opts.config?.validateTrigger === 'onChange') get().validate()
      opts.onChange?.(/* jsonValues, errors */)
    },
    setValues: (values) => set({ values }),
    setTouched: (name) => set((s) => ({ touched: { ...s.touched, [name]: true } })),

    validate: () => {
      const json = formValuesToJsonValues(get().values, get().fields)
      const { formErrors } = handleValidation(json)
      set({ errors: formErrors ?? {} })
      return formErrors ?? {}
    },

    submit: async () => {
      set({ submitted: true, isSubmitting: true })
      try {
        const errors = get().validate()
        if (errors && Object.keys(errors).length) return
        const json = formValuesToJsonValues(get().values, get().fields)
        await opts.onSubmit?.(json, errors)
      } finally {
        set({ isSubmitting: false })
      }
    },

    reset: (values) =>
      set({ values: getDefaultValuesFromFields(get().fields, values ?? {}), errors: {}, touched: {}, submitted: false }),

    loadAsyncOptions: async (loaderId, search = '') => {
      const loader = opts.asyncLoaders?.[loaderId]
      if (!loader) return
      set((s) => ({ async: { ...s.async, [loaderId]: { ...s.async[loaderId], loading: true, error: null } } }))
      try {
        const res = await loader({ formValues: get().values, search })
        set((s) => ({ async: { ...s.async, [loaderId]: { options: res.options ?? [], loading: false, error: null } } }))
      } catch (e) {
        set((s) => ({ async: { ...s.async, [loaderId]: { options: [], loading: false, error: String(e) } } }))
      }
    },
  }))
}
```

> **Reutilizamos** `formValuesToJsonValues` y `getDefaultValuesFromFields` ya corregidos (recursión +
> falsy). El store es el dueño del estado; las utils siguen siendo puras.

---

## 4. Context + Provider

El Context guarda **solo la referencia al store** (estable) → nunca causa re-renders por sí mismo.

```tsx
// src/context/FormStoreContext.tsx
const FormStoreContext = createContext<StoreApi<FormState> | null>(null)

export function FormProvider({ schema, uiSchema = {}, children, ...opts }: FormProviderProps) {
  const storeRef = useRef<StoreApi<FormState>>()
  // Clave por valor para recrear el store solo si schema/uiSchema/initialValues cambian de verdad.
  const key = useMemo(() => JSON.stringify({ schema, uiSchema, initialValues: opts.initialValues }), [schema, uiSchema, opts.initialValues])
  const prevKey = useRef(key)
  if (!storeRef.current) storeRef.current = createFormStore(schema, uiSchema, opts)
  if (prevKey.current !== key) { storeRef.current = createFormStore(schema, uiSchema, opts); prevKey.current = key }

  return <FormStoreContext.Provider value={storeRef.current}>{children}</FormStoreContext.Provider>
}

// Hook base: conecta selector → store de esta instancia.
export function useFormStore<T>(selector: (s: FormState) => T, eq?: (a: T, b: T) => boolean): T {
  const store = useContext(FormStoreContext)
  if (!store) throw new Error('useFormStore debe usarse dentro de <FormProvider>')
  return useStore(store, selector, eq)
}
```

---

## 5. Hooks (API pública)

```ts
// Un campo: suscrito SOLO a value+error+touched de ese name (path soportado).
function useField(name: string): {
  value: any
  error?: string | object
  touched: boolean
  onChange: (value: any) => void   // estable
  onBlur: () => void               // estable
  field: Field                     // metadata (label, inputType, options, ...)
}

// Observa campos puntuales (p. ej. dependencies). Re-render SOLO si cambian.
function useWatch(names: string[]): any[]
function useWatch(name: string): any

// Metadata de una sección (sin valores → no re-render por tipeo).
function useSection(id: string): { section: ResolvedSection; fields: Field[] }
function useSections(): ResolvedSection[]

// API del formulario (acciones estables + flags).
function useFormApi(): {
  submit: () => Promise<void>
  reset: (values?: Record<string, any>) => void
  validate: () => FormErrors
  isSubmitting: boolean            // suscrito solo a este flag
  isValid: boolean
}

// Opciones async de un loader (para Select/Autocomplete). Recarga al cambiar deps.
function useAsyncOptions(loaderId: string, deps?: string[]): {
  options: any[]; loading: boolean; error: string | null
}
```

**Por qué esto elimina los re-renders cruzados:** `useField('a')` usa el selector
`s => [s.values.a, s.errors.a, s.touched.a]` (con `shallow`). Cuando `setValue('b', …)` cambia
`values.b`, el selector de `'a'` devuelve lo mismo → **A no re-renderiza**. El `SelectField` con
`dependencies` usa `useWatch(deps)` → re-renderiza solo cuando cambian SUS dependencias. **Así muere
el §11.8.**

---

## 6. Modelo de secciones (autoría en `uiSchema`, interno `x-jsf-sections`)

### 6.1 En el `uiSchema` (lo que escribe el consumidor)

Las secciones son **presentación pura** → viven en el `uiSchema`, NO en el `schema` (que queda como
contrato de datos limpio). El `schema` solo define `properties`/validación.

```json
// schema  (solo dato)            // uiSchema  (solo presentación)
{ "type": "object",              {
  "properties": {                  "ui:sections": [
    "firstName": { "type": "string" },     { "id": "personal", "title": "Datos personales", "fields": ["firstName", "lastName", "email"] },
    "lastName":  { "type": "string" },     { "id": "address",  "title": "Dirección",        "fields": ["street", "city", "zip"] }
    "email":     { "type": "string" },   ],
    "street":    { "type": "string" }    "email":     { "ui:widget": "email", "ui:placeholder": "tu@mail.com" },
  }                                      "firstName": { "ui:autofocus": true }
}                                      }
```

### 6.2 Compilación + resolución

- `compileUiSchema` (§1 ter) baja `ui:sections` → `x-jsf-sections` en el `schema` interno. El consumidor
  **nunca** ve ni escribe `x-jsf-sections`.
- `resolveSections` lee `x-jsf-sections` del **schema interno** (post-compilación) → el motor sigue sin
  conocer el concepto de secciones (separación limpia; maquinaria interna SIN cambios respecto al diseño
  original).
- Cada `section.fields` (names) se mapea a los `Field` del engine vía `fieldsByName`, preservando orden.
- Campos que **no** aparecen en ninguna sección → sección implícita `__default__` (se renderiza al
  final en el wrapper `<UIForm>`, o se ignora en modo componible).
- Si un name referenciado no existe en `properties` → `console.warn` (no romper).

```ts
function resolveSections(internalSchema: JsfObjectSchema, fields: Field[]): ResolvedSection[]
```

---

## 7. Componentes

```tsx
<FormProvider schema uiSchema onSubmit onChange asyncLoaders initialValues config>…</FormProvider>

// Renderiza los campos de una sección. Render default o custom (render-prop).
<FormSection id="personal" />
<FormSection id="address">{(fields) => <MiGridCustom fields={fields} />}</FormSection>

// Un campo individual, donde quieras.
<Field name="email" />

// Botón de submit (usa useFormApi().submit + isSubmitting).
<SubmitButton>Guardar</SubmitButton>
```

### 7.1 `Field` = controlador (patrón Controller)

`<Field name>` resuelve la suscripción y delega en el componente presentacional por `inputType`. Los
componentes de `src/components/fields/*` **siguen siendo presentacionales** (reciben value/error/
onChange por props) → casi sin cambios, fáciles de testear.

```tsx
function Field({ name }: { name: string }) {
  const { value, error, touched, onChange, onBlur, field } = useField(name)
  const Component = FIELD_COMPONENT_MAP[field.inputType] ?? Fallback
  return <Component {...field} value={value} error={error} touched={touched}
                    onChange={(_, v) => onChange(v)} onBlur={() => onBlur()} />
}
```

> La suscripción granular vive en `Field` (el controlador). Los presentacionales no saben nada del
> store → testeables en aislamiento.

### 7.2 `<UIForm>` = atajo de conveniencia (NO compat)

Azúcar para el caso simple (un form que no necesita layout custom). La **API primaria es la
componible** (`FormProvider` + `FormSection`/`Field`); `UIForm` existe solo por ergonomía.

```tsx
export function UIForm({ schema, uiSchema, children, ...opts }: UIFormProps) {
  return (
    <FormProvider schema={schema} uiSchema={uiSchema} {...opts}>
      <AllSections />                   // renderiza las secciones (o todos los campos si no hay)
      {children ?? <DefaultSubmitBar />}
    </FormProvider>
  )
}
```

---

## 8. Async options en el store (resuelve §11.8 de v1)

- El cache async vive en `store.async[loaderId]`.
- `SelectField`/`AutocompleteField` usan `useAsyncOptions(loaderId, deps)`:
  - se suscriben SOLO a `async[loaderId]` (no a todo el estado),
  - usan `useWatch(deps)` internamente para recargar cuando cambian sus dependencias.
- Resultado: un Select se re-renderiza por SUS opciones y SUS deps, no por cualquier tecleo del form.

---

## 9. Validación y submit

- `validate()` (en el store): `formValuesToJsonValues(values, fields)` → `handleValidation(json)` →
  setea `errors`. Es la misma lógica de v1, ahora dentro del store.
- `setValue` valida según `config.validateTrigger` (`onChange`/`onBlur`/`onSubmit`).
- `submit()`: `submitted=true`, valida, si no hay errores → `onSubmit(jsonValues)`.
- Futuro (incremental): `useSection(id).validate()` para validación por sección (wizards).

---

## 10. Estructura de carpetas propuesta

```
src/
  store/
    createFormStore.ts       // factory Zustand (vanilla)
    compileUiSchema.ts       // uiSchema → x-jsf-* (única vía de presentación, §1 ter)
    resolveSections.ts       // x-jsf-sections (interno) → ResolvedSection[]
    paths.ts                 // getPath/setPath (reusa setDeep)
    types.ts                 // FormState, ResolvedSection, UiSchema, FormStoreOptions
  context/
    FormStoreContext.tsx     // Context (store ref) + FormProvider + useFormStore
  hooks/
    useField.ts
    useWatch.ts
    useSection.ts
    useFormApi.ts
    useAsyncOptions.ts
  components/
    form/UIForm.tsx          // wrapper compat (reescrito sobre el store)
    form/FormSection.tsx
    form/Field.tsx           // controlador
    form/SubmitButton.tsx
    fields/*                 // presentacionales (casi sin cambios)
  utils/                     // formValuesToJsonValues, getDefaultValuesFromFields (ya corregidas)
  lib/index.ts               // exports: FormProvider, FormSection, Field, SubmitButton, hooks, UIForm
```

> El `FormContext`/`reduce.ts` de v1 se **deprecan**. Si hace falta, `useFormContext` queda como shim
> fino sobre el store durante la transición; idealmente se elimina.

---

## 11. Dependencias nuevas

- **`zustand`** (~1KB gzip). Va como **dependency** y se **bundlea** en la librería (NO se externaliza
  en `rollupOptions.external`) → el consumidor no necesita instalarla. Usamos `zustand/vanilla`
  (`createStore`), `zustand` (`useStore`) y `zustand/shallow`.

---

## 12. Plan de v1 (deadline: 1 semana)

Secuencia pensada para tener un *vertical slice* funcionando temprano y expandir. **Los tests van
acoplados a cada bloque**, no al final.

| Día(s) | Bloque | Entregable |
|--------|--------|------------|
| 1 | **Compilador + Store + Provider** | `compileUiSchema` (uiSchema → x-jsf-*, §1 ter) con su tabla de mapeo. `createFormStore` (Zustand), `FormStoreContext`, `useFormStore`. Tests del compilador (widget/placeholder/autofocus/options) y del store: values, validate, submit, falsy, anidados. |
| 1–2 | **Hooks + Field controller** | `useField`, `useWatch`, `useFormApi`. `<Field>` + contrato `FieldComponentProps`. `ui:widget` → `FIELD_COMPONENT_MAP`. Migrar text/number/select como vertical slice. Test de aislamiento de re-render. |
| 2–3 | **Migrar todos los campos** | Resto de presentacionales al contrato limpio; simplificar Select/Autocomplete (async vía store, borrar `StableAutocomplete`). |
| 3–4 | **Secciones** | `ui:sections` (autoría en uiSchema) → `resolveSections`, `<FormSection>`, `useSection`. Tests de resolución. |
| 4 | **UIForm + SubmitButton + responsive** | Atajo `UIForm`, `SubmitButton`, consolidar responsive sobre los generadores del motor (SSR-safe). |
| 5 | **Limpieza (DROP) + endurecer** | Eliminar `FormContext`/`reduce`/`useFormContext`, CSS duplicado, estado duplicado, `useId()`. Tipos públicos, `npm run build` sanity, playground + docs al día, cobertura de caminos críticos. |

**Fuera de v1 (post-lanzamiento):** validación por sección, wizards/steps, helpers de arrays (reorder
real en `group-array`), theming avanzado, file upload pulido.

> El margen es ajustado pero alcanzable **porque nada depende de la librería**: podemos romper y
> rehacer sin coordinar con consumidores. Ese es el acelerador #1.

---

## 13. Riesgos y decisiones abiertas

1. **Paths anidados (DECIDIDO):** las secciones listan **nombres top-level**; un `fieldset` se lista
   como UNA entrada y su componente renderiza los hijos. `useField`/`setValue` soportan paths con
   punto (`"address.street"`) internamente vía `getPath`/`setPath` (sobre `setDeep`) para los hijos
   anidados. KISS para v1; listar hijos sueltos por path en una sección se habilita después si Laus lo
   necesita.
2. **StrictMode:** la creación del store va detrás de un `useRef` para no duplicarla en el doble
   render de dev.
3. **Cambio de schema en runtime:** el Provider recrea el store si cambia la clave por valor
   (`JSON.stringify({schema, initialValues})`), preservando lo aprendido en v1 sobre estabilidad.
4. **Migración de los fields:** el patrón Controller deja los presentacionales casi iguales → bajo
   riesgo de regресión. El cambio fuerte es de DÓNDE sale value/onChange (props → `useField`).
5. **`useFormContext` actual:** decidir si se mantiene como shim o se elimina (rompe import público).
   Propuesta: shim deprecado en Fase 1, eliminar en una major.

---

## 14. Definición de "hecho" para la base (Fases 1-2)

- [ ] Tipear en un campo NO re-renderiza a sus hermanos (verificable con React DevTools Profiler / test).
- [ ] `SelectField` con `dependencies` re-renderiza solo ante sus deps.
- [ ] Se puede renderizar una sección en un componente custom vía `<FormSection>`/`useSection`.
- [ ] `<UIForm schema/>` sigue funcionando igual que hoy (compat).
- [ ] Submit/validación/async funcionan a través del store.
```
