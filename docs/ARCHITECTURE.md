# UIForm — Documentación técnica de arquitectura

> **Fuente de verdad.** Este documento describe lo que el código **hace realmente**, verificado
> archivo por archivo contra `src/`. Incluye los bugs y la deuda técnica conocida, sin maquillaje.
>
> No contiene benchmarks ni métricas de performance: **el repo no tiene tests ni benchmarks**, así
> que cualquier número de ese tipo sería inventado. Cuando los haya, se documentan acá con su fuente.
>
> Última revisión manual del código: ver `git log`. Si tocás un archivo referenciado acá, actualizá
> también este documento (las referencias son `archivo:línea`).

---

## 1. Qué es UIForm (y qué NO es)

UIForm es una librería de formularios para React que combina dos capas:

1. **Capa headless** — [`@laus/json-schema-form`](https://github.com/DaikonCOde/json-schema-form)
   `@1.2.4` (*"Headless UI form powered by JSON Schemas"*). Parsea el JSON Schema, genera la lista de
   `fields`, computa el layout y corre la validación. **No renderiza nada.**
   - **Origen:** es un **fork de `@remoteoss/json-schema-form`** mantenido por el equipo del proyecto
     (confirmado). El código fuente del motor vive localmente en
     `/Users/alexocsa/Documents/dev/laus/json-schema-form` (git remote
     `github.com/DaikonCOde/json-schema-form`) y se publica como `@laus/json-schema-form`
     (versión instalada: 1.2.4). Conserva la API de `@remoteoss` (`createHeadlessForm`, `modify`,
     extensiones `x-jsf-*`). **⚠️ Los cambios al motor headless se hacen en ESE repo, no en UIForm.**
2. **Capa de presentación** — este repo. Mapea cada `field` headless a un componente de
   **Ant Design**.

**Aclaración importante:** UIForm **NO** es `react-jsonschema-form` (rjsf, el de mozilla/rjsf-team).
Son librerías distintas, con filosofías distintas. Buscar soluciones de "rjsf" en internet no aplica
acá. El motor real es `@laus/json-schema-form` (ver `package.json:44`).

### Stack real

| Capa | Tecnología | Dónde |
|------|-----------|-------|
| Parsing de schema + validación | `@laus/json-schema-form` ^1.2.4 | `package.json:44` |
| Componentes UI | Ant Design ^5 (peer: 4 \|\| 5) | `package.json:34,53` |
| Estado global | React Context + `useReducer` | `src/context/` |
| Estado de formulario | `useState` local en `UIFormContent` | `src/components/form/UIForm.tsx` |
| Layout responsive | CSS Grid generado e inyectado en runtime | `src/utils/responsive-layout.ts` |
| Tipos | TypeScript ^5.9 | `src/types/` |

### Compatibilidad declarada

`package.json:33-37` declara peer deps `react ^17 || ^18` y `antd ^4 || ^5`. Los tipos de dev
(`@types/react ^18`) y el código asumen React 18. **No hay test que verifique React 17**; tomar la
compatibilidad con 17 como "declarada, no verificada".

---

## 2. Puntos de entrada y exports

`src/lib/index.ts` es el barrel público. Exporta:

- `UIForm` (named) y `UIFormDefault` (default) — `src/components/form/UIForm.tsx`
- Todos los tipos de props (`UIFormProps`, `*FieldProps`, `FieldOption`, `AsyncOptionsLoader`, …) — `src/types/types.d.ts`
- `FormProvider`, `FormContext`, `useFormContext` y tipos del contexto — `src/context/`
- Utils: `formValuesToJsonValues`, `getDefaultValuesFromFields` — `src/utils/utils.ts`
- Todos los componentes de campo (para customización avanzada) — `src/components/fields/`
- Re-export de tipos del motor: `Field`, `JsfObjectSchema`, `AsyncOptionsConfig`, etc. — desde `@laus/json-schema-form`

El CSS se importa aparte: `import '@laus/uiform/dist/style.css'` (`package.json:15`).

---

## 3. Diagrama de capas (real)

```
JSON Schema
   │
   ▼
createHeadlessForm(schema, opts)        ← @laus/json-schema-form
   │  devuelve: { fields, handleValidation, isError, error, layout }
   ▼
UIForm                                   ← wrapper: monta <FormProvider>
   └─ FormProvider (Context)             ← src/context/FormContext.tsx
        - formValues, asyncOptionsCache  ← useReducer (src/context/reduce.ts)
        - getFormValues() (ref-based)
        └─ UIFormContent                 ← orquestador (estado real del form)
             - values, errors, submitted, isSubmitting (useState)
             - useResponsiveCSS()        ← inyecta CSS grid
             - useFieldRenderer()        ← mapea inputType → componente
             └─ fields.map() → <Form.Item> → renderField(field)
                  └─ TextField / SelectField / AutocompleteField / ... (Ant Design)
```

---

## 4. Componente principal: `UIForm` / `UIFormContent`

Archivo: `src/components/form/UIForm.tsx`

### Estructura

- `UIForm` (`:348`) es un wrapper mínimo: envuelve `UIFormContent` en `<FormProvider>` pasándole
  `initialValues`.
- `UIFormContent` (`:22`) tiene toda la lógica.

### Ciclo de un cambio de campo (lo que pasa de verdad)

1. El campo llama `onChange(name, value)` → `handleFieldChange` (`:166`).
2. `handleFieldChange` hace `setValues(prev => ({ ...prev, [name]: value }))`.
3. Si `validateTrigger === 'onChange'`, dentro del updater dispara un **`setTimeout(…, 0)`**
   (`:177`) que llama `validateValues(newValues)` y luego `onChange` del usuario.
4. Un `useEffect` separado (`:231`) sincroniza `values` → contexto vía `setContextFormValues(values)`.

> ⚠️ **Ojo:** el `ARCHITECTURE.md` viejo decía que el contexto se actualizaba *dentro* del updater de
> `setValues`. Es falso. Se hace en un `useEffect` aparte (`:231-233`). Esta doc refleja el código real.

### Validación

`validateValues` (`:140`): `formValuesToJsonValues(values, fields)` → `handleValidation(jsonValues)`
→ `setErrors(formErrors)`. Devuelve `{ errors, jsonValues }`. Envuelto en try/catch que setea un
error genérico `{ "": "Validation failed" }`.

### Submit

`handleSubmit` (`:203`): marca `submitted`/`isSubmitting`, valida, **si hay errores no envía**, si no
llama `onSubmit(jsonValues, errors)`. El botón Submit/Reset por defecto solo se renderiza si hay
`onSubmit` **y** no hay `children` **y** no hay `formId` externo (`:310`). Si pasás `formId`, se asume
botón externo vía `<button form={formId}>`.

### Refs estables

`valuesRef`, `onChangeRef`, `validateTriggerRef` (`:110-119`) se actualizan en un `useEffect` **sin
array de dependencias** (corre en cada render) para que los callbacks accedan a los valores más
nuevos sin recrearse.

---

## 5. Estado: tres capas

### Capa 1 — Estado local de `UIFormContent` (fuente de verdad real)

`values`, `errors`, `submitted`, `isSubmitting` (`:96-101`). Esto maneja TODO el render de los
campos. Es la fuente de verdad de los datos del form.

### Capa 2 — `FormContext` (coordinación entre campos)

Archivos: `src/context/FormContext.tsx`, `src/context/reduce.ts`.

`useReducer(formReducer, { formValues, asyncOptionsCache })`. Expone:

| Método | Uso |
|--------|-----|
| `updateFormValue(name, value)` | Actualiza un campo. **Expuesto pero NO usado por UIForm** (ver deuda técnica). |
| `setFormValues(values)` | Reemplaza todo `formValues`. Es lo que usa UIForm para sincronizar. |
| `getFormValues()` | Getter **ref-based** (`:75`): devuelve `formValuesRef.current` sin suscribir. |
| `setAsyncOptions` / `getAsyncOptions` | Cache de opciones async (usado por `SelectField`). |
| `setAsyncLoading` / `isAsyncLoading` | Estado de carga por `loaderId`. |
| `setAsyncError` / `getAsyncError` | Error por `loaderId`. |
| `clearAsyncCache(loaderId?)` | Limpia cache (uno o todo). |

El `contextValue` (`FormContext.tsx:82`) incluye `...state` completo en su `useMemo`. **Consecuencia:
cualquier componente que use `useFormContext()` se re-renderiza ante cualquier cambio de estado del
contexto.** `SelectField` lo usa directo (se suscribe); `AutocompleteField` deliberadamente NO (usa
el getter por props).

#### Patrón ref-based getter

Para evitar que componentes que solo *leen ocasionalmente* `formValues` se re-rendericen en cada
tecla, `FormProvider` mantiene `formValuesRef` (`:28`) actualizado por effect (`:31`), y `getFormValues`
(`:75`) lo devuelve con deps vacías → referencia estable. `AutocompleteField` recibe `getFormValues`
por props (no por contexto) para no suscribirse.

#### Reducer (`reduce.ts:46`)

Acciones: `UPDATE_FORM_VALUE`, `SET_FORM_VALUES`, `SET_ASYNC_OPTIONS` (stampa `Date.now()`),
`SET_ASYNC_LOADING`, `SET_ASYNC_ERROR`, `CLEAR_ASYNC_CACHE`.

### Capa 3 — Estado local de cada campo

Cada campo tiene `internalTouched` para saber si mostrar errores. `AutocompleteField` además tiene
`inputValue`, `internalOptions`, `loading`, `asyncError` (`AutocompleteField.tsx:101-110`).

---

## 6. Renderizado de campos: `useFieldRenderer`

Archivo: `src/hooks/useFieldRenderer.tsx`

`FIELD_COMPONENT_MAP` (`:18`) mapea `inputType` → componente:

| inputType | Componente |
|-----------|-----------|
| `text`, `email`, `hidden` | `TextField` |
| `number`, `money` | `NumberField` |
| `textarea` | `TextareaField` |
| `select`, `country` | `SelectField` |
| `autocomplete` | `AutocompleteField` |
| `radio` | `RadioField` |
| `checkbox` | `CheckboxField` |
| `date` | `DateField` |
| `file` | `FileField` |
| `fieldset` | `FieldsetField` |
| `group-array` | `GroupArrayField` |

`renderField` (`:63`): busca el componente; si no existe, renderiza una caja de error
"Unsupported field type". Arma `baseProps` (spread del field + `disabled`/`size` globales). Para
`fieldset` y `group-array` pasa `renderField` recursivamente (`:96`). Permite override vía
`customComponents`.

---

## 7. Catálogo de campos

Patrón común de todos: destructuran props → `internalTouched` (estado) → `isTouched = touched ??
internalTouched` → `handleChange`/`handleBlur` → `if (!isVisible) return null` → filtran props que no
van al DOM (`jsonType`, `_rootLayout`, `errorMessage`, `getFormValues`, `type`) en `filteredAntdProps`
→ renderizan `<FieldLabel>` + componente Ant + `<ErrorMessage>` cuando `(isTouched || submitted)`.

| Campo | Archivo | Notas reales |
|-------|---------|--------------|
| **TextField** | `TextField.tsx` | `text`/`email`/`hidden`. `hidden` → `<input type=hidden>`. `value \|\| ''`. |
| **NumberField** | `NumberField.tsx` | Parsea a número o `null`. `money` agrega `formatter`/`parser` con separador de miles y `precision: 2`. |
| **TextareaField** | `TextareaField.tsx` | `Input.TextArea`, `rows=4`, `autoSize`, `showCount`. |
| **SelectField** | `SelectField.tsx` | **Se suscribe al contexto** (`useFormContext`). Async vía **cache del contexto**. Soporta `dependencies` (recarga al cambiar). `multiple`. |
| **AutocompleteField** | `AutocompleteField.tsx` | Async vía **estado local** (no contexto). `getFormValues` por props. Wrapper `StableAutocomplete` con `React.memo`. Ver deuda técnica. |
| **RadioField** | `RadioField.tsx` | `Radio.Group` vertical con `Space`. |
| **CheckboxField** | `CheckboxField.tsx` | Soporta `checkboxValue` (valor custom cuando checked, `null` cuando no). Si no, booleano. |
| **DateField** | `DateField.tsx` | `dayjs` + `customParseFormat`. Parsea varios formatos comunes. Guarda string (`YYYY-MM-DD` o ISO si `showTime`). `disabledDate` por `minDate`/`maxDate`. |
| **FileField** | `FileField.tsx` | `Upload`/`Dragger`. **No sube automáticamente** (`beforeUpload` devuelve `false`, `customRequest` no-op). Valida `maxFileSize`/`accept`. Mantiene archivos en memoria. |
| **FieldsetField** | `FieldsetField.tsx` | `Card`. Anida campos con name prefijado `${name}.${field.name}`. Inyecta su propio CSS grid responsive. Mergea cambios anidados. |
| **GroupArrayField** | `GroupArrayField.tsx` | Lista repetible de `Card`. Add/remove/cambio por índice. `getDefaultValueForType` para items nuevos. `min/maxItems`, `Popconfirm` al borrar. |

### Componentes comunes

- **`FieldLabel`** (`commons/label.tsx`): renderiza label + asterisco si `required` + description.
  **Devuelve `null` si no hay `label`** (`:21`) → ver deuda técnica.
- **`ErrorMessage`** (`commons/errorMessage.tsx`): muestra string simple, u objeto de errores
  (lista de valores). `null` si no hay error.

---

## 8. Sistema de layout responsive

Archivo: `src/utils/responsive-layout.ts`

Breakpoints mobile-first: `sm: 0px`, `md: 768px`, `lg: 1024px`, `xl: 1280px`.

- `generateContainerResponsiveCSS` (`:9`): genera el `display: grid` + `grid-template-columns`
  responsivo del contenedor a partir de `layout` del schema (`x-jsf-layout`).
- `generateFieldResponsiveCSS` (`:68`): `grid-column: span N` por campo, usando `getFieldLayoutInfo`
  del motor (`colSpan` puede ser número u objeto responsivo).
- `generateFormResponsiveCSS` (`:129`): junta contenedor + todos los campos.
- `injectResponsiveCSS` (`:162`): crea/reemplaza un `<style id=...>` en `<head>`.
- `cleanupResponsiveCSS` (`:186`): lo remueve.
- `generateDirectResponsiveCSS` (`:198`): versión alternativa con `!important` (ver deuda técnica —
  casi duplicada).
- **`useResponsiveCSS`** (`:246`): genera el CSS (en cada render, no memoizado), y lo inyecta en un
  `useEffect` gated por `[css, styleId]`. Limpia al desmontar. Devuelve `containerClassName` y
  `getFieldClassName(name)`.

`FieldsetField` repite esta lógica internamente para su propio grid (`FieldsetField.tsx:73-103`).

> ⚠️ **Duplicación con el motor.** `@laus/json-schema-form` **ya exporta** generadores de CSS
> responsive: `generateResponsiveCSS`, `generateResponsiveFieldCSS`, `generateCSSGridProperties`,
> `getFormContainerLayout`, `getRootLayoutInfo`, `normalizeLayoutConfig`, `DEFAULT_LAYOUT_CONFIG`
> (verificado en `node_modules/@laus/json-schema-form/dist/index.d.ts`). UIForm **no los usa**: solo
> importa `getFieldLayoutInfo` y reimplementa toda la generación de CSS a mano en
> `responsive-layout.ts`. Es deuda técnica: convendría evaluar usar los del motor y borrar la
> reimplementación.

---

## 9. Async options: DOS patrones distintos (inconsistencia conocida)

| | `SelectField` | `AutocompleteField` |
|---|---|---|
| Dónde viven las opciones | **Cache del contexto** (`asyncOptionsCache`) | **Estado local** (`internalOptions`) |
| Acceso a `formValues` | `useFormContext()` (suscrito) | `getFormValues()` por props (no suscrito) |
| Re-render al tipear en otro campo | Sí (suscrito al contexto) | No (aislado) |
| `dependencies` | Sí, recarga al cambiar (`SelectField.tsx:73`) | No implementado igual |

Forma del loader (igual para ambos):

```typescript
const asyncLoaders: Record<string, AsyncOptionsLoader> = {
  myLoaderId: async ({ formValues, search }) => {
    return { options: [/* ... */] }
  }
}
```

Y en el schema: `x-jsf-presentation.asyncOptions.id` (+ `dependencies?`, `searchable?`).

Esta divergencia está reconocida como deuda (ver §11, ADR histórico "Local State for Autocomplete").

---

## 10. Transformación de valores (UI ↔ JSON)

Archivo: `src/utils/utils.ts` + `src/utils/setDeep.ts`

- `formValuesToJsonValues(values, fields)` (`utils.ts:11`): transforma valores de UI a formato JSON
  Schema antes de validar/enviar. Omite campos vacíos (`''`) e invisibles (`!isVisible`). Usa
  `setDeep` para paths anidados.
- `getDefaultValuesFromFields(fields, initialValues)` (`utils.ts:42`): arma los valores iniciales
  controlados desde `default` del schema o `initialValues`.
- `setDeep(obj, path, value)` (`setDeep.ts:5`): asigna en path tipo `"user.name"` o `"items[0].price"`
  creando objetos/arrays según corresponda.

> Estas funciones fueron corregidas (recursión para `fieldset`/`group-array` y manejo correcto de
> falsy values — ver §11.6 y §11.7). El comentario del archivo dice *"These utils will be part of
> json-schema-form soon"*: siguen pensadas como provisionales hasta migrarlas al motor.

---

## 11. Bugs conocidos y deuda técnica

Esta es la sección de mayor valor del documento. Cada ítem está verificado contra el código.

### 🔴 Críticos — ✅ RESUELTOS (2026-06-22)

1. **El form se re-parseaba en cada render y reseteaba lo tipeado.** — ✅ **CORREGIDO.**
   - Causa: `initialValues = {}` / `asyncLoaders = {}` como defaults creaban referencias nuevas cada
     render → invalidaban el `useMemo` de `createHeadlessForm` → recreaban `fields` → el `useEffect`
     que re-aplica `initialValues` corría casi siempre y pisaba lo tipeado.
   - Fix (`UIForm.tsx`): defaults a una constante estable `EMPTY_OBJECT`; el `useMemo` de
     `createHeadlessForm` ahora depende de `headlessFormKey` (`JSON.stringify({schema, initialValues})`,
     estable por VALOR) + `asyncLoaders`; el efecto de re-aplicar `initialValues` se gatea por
     `initialValuesKey` (valor) con un `ref`, así solo corre ante cambios reales (p. ej. un form de
     edición que carga datos async). `asyncLoaders` debe seguir viniendo memoizado por el caller.

2. **Falsy bugs: `0` y `false` se perdían.** — ✅ **CORREGIDO.**
   - `utils.ts` (`getDefaultValuesFromFields`): `|| ""` → `?? ""` (respeta `0`/`false`/`""`).
   - `utils.ts` (`formValuesToJsonValues`): `transform?.(v) || v` → `const transform = …;
     transform ? transform(v) : v` (un número `0` ya no cae al fallback ni se manda como string).
   - **Nota:** la implementación real vive en `utils.ts`, NO en `formValuesToJsonValues.ts` — ese
     archivo estaba **vacío** (stub muerto, nadie lo importaba) y fue **eliminado**.

### 🟠 Importantes — ✅ RESUELTOS 3–7 (2026-06-22); ⏸️ 8 diferido

3. **`console.log` de debug shippeados.** — ✅ **CORREGIDO.** Eliminados de `AutocompleteField`
   (estaban en el effect de `asyncOptions` y en `handleSearch`). Los `console.error` de `UIForm`
   (errores reales) se conservan.

4. **`React.memo` del Autocomplete comía cambios.** — ✅ **CORREGIDO.** El comparador de
   `StableAutocomplete` ya no compara por `length`: compara `autocompleteOptions` por referencia
   (estable por contenido vía useMemo, ver #5) e incluye `isTouched`/`submitted`/`required`/
   `placeholder`/`allowClear`/`isSearchable` (de los que dependen el render y el `status="error"`).

5. **`useMemo` impuro.** — ✅ **CORREGIDO.** `autocompleteOptions` ahora es un `useMemo` PURO (sin
   mutar refs adentro); se eliminó `optionsRef`. Devuelve una constante estable `EMPTY_OPTIONS` cuando
   no hay opciones.

6. **`formValuesToJsonValues` incompleto.** — ✅ **CORREGIDO.** Reescrito con recursión
   (`transformFieldValue`): maneja `fieldset` (objeto anidado) y `group-array` (array de objetos),
   agrega `money`, y omite hojas `null`/`undefined`/`""` (esto último también arregla que un número
   vacío se enviara como `0`). Conserva el comportamiento de los forms planos.

7. **`getDefaultValuesFromFields` sin recursión.** — ✅ **CORREGIDO.** Arma defaults anidados para
   `fieldset` (objeto) y `group-array` (array de items), manteniendo `??` para valores falsy.

8. **`SelectField` se suscribe a todo el contexto.** — ⏸️ **DIFERIDO (no es un fix seguro y rápido).**
   `useFormContext()` + `contextValue` con `...state` hace que cualquier cambio re-renderice todos los
   `SelectField`. Pero `SelectField` **necesita** `formValues` (para `dependencies`), así que no se
   puede "desuscribir" sin más. El fix correcto es suscripción por selector
   (`use-context-selector` / Zustand) o partir el contexto en dos — un cambio arquitectónico que
   conviene hacer **con tests de re-render primero**, no a ciegas. Queda como deuda consciente.

### 🟡 Menores / deuda

9. **`setTimeout(…, 0)` para validar** (`UIForm.tsx:177`) sin cleanup: frágil, propenso a closures
   viejos y races; no se cancela al desmontar.

10. **`formId` con `Math.random()` + `substr`** (`UIForm.tsx:105`; ídem `FieldsetField.tsx:40`):
    `substr` está deprecado y `Math.random` rompe hidratación en SSR. Usar `useId()` de React.

11. **`allowReorder` es cosmético** en `GroupArrayField` (`:118`): muestra el ícono de drag pero **no
    hay lógica de reordenamiento**. Feature muerta o a implementar.

12. **`FileField`: comentario vs realidad.** Habla de "convertir a base64" (`:55`) pero no convierte;
    mantiene los archivos en memoria. `customRequest` por defecto es no-op.

13. **`FieldLabel` devuelve `null` si no hay `label`** (`label.tsx:21`): un campo `required` sin
    `label` no muestra asterisco ni contenedor de label.

14. **CSS responsive reimplementado + duplicado internamente.** Dos problemas en capas:
    (a) `responsive-layout.ts` reimplementa generadores de CSS que **el motor ya exporta**
    (`generateResponsiveCSS`, `generateResponsiveFieldCSS`, etc. — ver §8). (b) Encima, dentro del
    propio repo hay dos versiones casi iguales: `generateContainerResponsiveCSS` vs
    `generateDirectResponsiveCSS` (esta última con `!important`). Consolidar y, idealmente, delegar al
    motor.

15. **`updateFormValue` expuesto pero sin uso** en UIForm: el form reemplaza todo `formValues` con
    `setFormValues` en cada cambio en vez de actualizar un campo. Decidir cuál patrón queda.

16. **`useResponsiveCSS` genera el CSS en cada render** (no memoizado, `responsive-layout.ts:252`);
    solo la inyección está gated por effect.

---

## 12. Limitaciones reales (para setear expectativas)

- **Sin tests.** No hay unit tests, e2e ni benchmarks en el repo. Cualquier afirmación de
  performance/cobertura/accesibilidad debe tratarse como no verificada hasta que existan.
- **Anidamiento: corregido en utils, sin tests.** La transformación de valores y los defaults ahora
  recorren `fieldset` y `group-array` recursivamente (§11.6, §11.7), pero **no hay tests** que cubran
  esos casos anidados todavía.
- **Dos patrones de async** conviven (§9).
- **Documentación previa.** El resto de `docs/*` (ASYNC_OPTIONS, FORM_CONTEXT, etc.) **todavía no fue
  auditada** contra el código y puede contener afirmaciones desactualizadas o inventadas, igual que la
  versión anterior de este archivo. Tratar con cautela hasta auditar.

---

## 13. Glosario rápido de archivos

```
src/
├── components/
│   ├── form/UIForm.tsx          ← componente principal + orquestador
│   ├── fields/                  ← un componente por inputType
│   └── commons/                 ← FieldLabel, ErrorMessage
├── context/
│   ├── FormContext.tsx          ← Provider + métodos
│   └── reduce.ts                ← reducer + tipos del contexto
├── hooks/
│   ├── useFieldRenderer.tsx     ← inputType → componente
│   └── useFormContext.ts        ← hook de acceso al contexto
├── utils/
│   ├── utils.ts                 ← formValuesToJsonValues, getDefaultValuesFromFields
│   ├── setDeep.ts               ← asignación por path anidado
│   └── responsive-layout.ts     ← generación + inyección de CSS grid
├── types/                       ← tipos públicos
└── lib/index.ts                 ← barrel de exports público
```
