# UIForm v2 — Roadmap de la semana

> **Objetivo:** lanzar v1 a producción en **1 semana** sobre la arquitectura v2 (store Zustand +
> suscripción granular + modelo RJSF de dos documentos `schema` + `uiSchema`).
>
> Este documento es la **brújula de ejecución**. El QUÉ y el PORQUÉ están en
> [`ARCHITECTURE_V2.md`](./ARCHITECTURE_V2.md); acá va el CÓMO y el CUÁNDO, fase por fase, con sus
> tests y su definición de "hecho".

---

## Principios que NO se negocian

1. **Compiler-first.** `compileUiSchema` es el corazón de la API. Se construye y se blinda PRIMERO:
   si la traducción `uiSchema → x-jsf-*` está mal, todo lo demás hereda el bug.
2. **Tests acoplados a cada fase**, nunca al final. Una fase no está "hecha" sin sus tests verdes.
3. **Vertical slice temprano.** Al final de la Fase 3 tiene que renderizar un form real (text + number
   + select) de punta a punta. Validamos el diseño con algo que funciona, no con teoría.
4. **El motor no se toca.** `@laus/json-schema-form` queda intacto; trabajamos por encima.
5. **DROP al final, no a mitad.** El código v1 (`FormContext`, `reduce`, `useFormContext`) se elimina en
   la Fase 7, cuando el reemplazo ya está probado. No se borra nada sin red.

---

## Mapa de dependencias (orden de construcción)

```
Fase 1  tipos + compileUiSchema + paths      ← fundación, sin dependencias
   │
Fase 2  createFormStore + Provider           ← usa compileUiSchema + paths
   │
Fase 3  hooks + <Field> + FIELD_COMPONENT_MAP ← usa el store    ◀── VERTICAL SLICE
   │
Fase 4  migrar campos presentacionales       ← usan el contrato de <Field>
   │
Fase 5  secciones (resolveSections, FormSection)
   │
Fase 6  UIForm + SubmitButton + responsive
   │
Fase 7  limpieza (DROP v1) + endurecer + docs
```

---

## Fase 1 — Núcleo de compilación (Día 1, primera mitad)

**Objetivo:** la pieza más riesgosa, primero y blindada. Tipos públicos + compilador + paths.

**Entregables**
- `src/store/types.ts` — `UiSchema`, `FormState`, `FormStoreOptions`, `ResolvedSection`, `FieldComponentProps`.
- `src/store/compileUiSchema.ts` — `compileUiSchema(schema, uiSchema)`: baja `uiSchema` a `x-jsf-*` y
  mergea al schema interno. Tabla de mapeo (`ui:widget`, `ui:placeholder`, `ui:autofocus`,
  `ui:options.*`, `ui:sections`, `ui:order`).
- `src/store/paths.ts` — `getPath`/`setPath` sobre `setDeep` (soporte `"address.street"`).

**Tests** (`test/store/`)
- `compileUiSchema.test.ts`: cada regla de mapeo en aislamiento; `ui:sections` → `x-jsf-sections`;
  schema sin uiSchema (passthrough); name en uiSchema que no existe en `properties` → no rompe.
- `paths.test.ts`: get/set anidado, creación de ramas, no muta el original, preserva falsy (0/false).

**Hecho cuando:** todas las reglas de la tabla tienen test verde y el merge no pisa props del schema.

---

## Fase 2 — Store + Provider (Día 1, segunda mitad → Día 2)

**Objetivo:** una sola fuente de verdad (el store) y el Context que solo guarda su referencia.

**Entregables**
- `src/store/createFormStore.ts` — factory Zustand (`zustand/vanilla`). Compila uiSchema →
  `createHeadlessForm` → estado + acciones (`setValue`, `validate`, `submit`, `reset`, `loadAsyncOptions`).
- `src/store/resolveSections.ts` — `x-jsf-sections` (interno) → `ResolvedSection[]` (se usa acá pero se
  testea a fondo en Fase 5).
- `src/context/FormStoreContext.tsx` — Context (ref al store) + `FormProvider` + `useFormStore`.

**Tests**
- `createFormStore.test.ts`: defaults (incl. falsy 0/false), `setValue` con paths anidados, `validate`
  setea errores, `submit` llama `onSubmit` solo si no hay errores, `reset`.
- `FormProvider.test.tsx`: el store se crea una sola vez (ref); se recrea solo si cambia la key por valor.

**Hecho cuando:** el store maneja values/validación/submit y el Provider no dispara re-renders por sí mismo.

---

## Fase 3 — Hooks + Field controller + vertical slice (Día 2 → Día 3) ◀ HITO

**Objetivo:** suscripción granular real y el primer form funcionando de punta a punta.

**Entregables**
- `src/hooks/useField.ts`, `useWatch.ts`, `useFormApi.ts` — cada uno suscrito SOLO a su slice (selector + `shallow`).
- `src/components/form/Field.tsx` — controlador: resuelve `useField` y delega en el presentacional por
  `inputType` vía `FIELD_COMPONENT_MAP` (`ui:widget`). Arma el `FieldComponentProps` limpio (sin prop-stripping).
- Migrar **text + number + select** como vertical slice.

**Tests**
- `useField.test.tsx`: value/error/touched correctos; `onChange`/`onBlur` estables.
- **`reRenderIsolation.test.tsx`**: tipear en el campo A NO re-renderiza al campo B (el corazón del §11.8).
- `useWatch.test.tsx`: re-render solo cuando cambian los names observados.

**Hecho cuando:** un `<FormProvider>` con 3 campos renderiza, valida y tipear en uno no re-renderiza los otros.

---

## Fase 4 — Migrar campos presentacionales (Día 3)

**Objetivo:** todos los campos al contrato limpio; matar la complejidad heredada del Autocomplete.

**Entregables**
- Resto de presentacionales (`checkbox`, `radio`, `date`, `textarea`, `autocomplete`, `file`, …) al
  contrato `FieldComponentProps`.
- `src/hooks/useAsyncOptions.ts` — opciones async desde el store (`store.async[loaderId]` + `useWatch(deps)`).
- **Borrar** `StableAutocomplete`, su `React.memo` custom y la memoización a mano (innecesarios con el store).

**Tests**
- `useAsyncOptions.test.tsx`: carga inicial, recarga al cambiar deps, estados loading/error.
- `AutocompleteField.test.tsx`: sin loop de render; el value no dispara recargas innecesarias.

**Hecho cuando:** todos los `inputType` renderizan por el controlador y el Autocomplete no loopea.

---

## Fase 5 — Secciones (Día 3 → Día 4)

**Objetivo:** render componible por secciones, autoradas en `uiSchema`.

**Entregables**
- `resolveSections` endurecido (Fase 2 lo dejó funcional; acá se cubre a fondo).
- `src/components/form/FormSection.tsx` — render default o custom (render-prop).
- `src/hooks/useSection.ts` / `useSections.ts` — metadata de sección (sin valores → no re-render por tipeo).

**Tests**
- `resolveSections.test.ts`: orden preservado, sección implícita `__default__`, name inexistente → `warn` sin romper.
- `FormSection.test.tsx`: render default y render-prop custom.

**Hecho cuando:** se puede renderizar una sección en un componente propio vía `<FormSection>`/`useSection`.

---

## Fase 6 — UIForm + SubmitButton + responsive (Día 4)

**Objetivo:** el atajo de conveniencia y el responsive consolidado en una sola vía.

**Entregables**
- `src/components/form/UIForm.tsx` — azúcar sobre `FormProvider` + `AllSections`.
- `src/components/form/SubmitButton.tsx` — usa `useFormApi().submit` + `isSubmitting`.
- Responsive sobre los generadores que **el motor ya exporta** (`generateResponsiveCSS`,
  `generateResponsiveFieldCSS`) + inyección **SSR-safe** (guard de `document`), IDs con `useId()`.

**Tests**
- `UIForm.test.tsx`: render completo, submit, validación end-to-end.
- `responsive.test.ts`: CSS generado por breakpoint; guard SSR (no rompe sin `document`).

**Hecho cuando:** `<UIForm schema uiSchema/>` funciona end-to-end y el responsive sale de una sola fuente.

---

## Fase 7 — Limpieza (DROP) + endurecer + docs (Día 5)

**Objetivo:** borrar lo viejo (ya con reemplazo probado) y dejar la lib lista para publicar.

**Entregables**
- **Eliminar** `src/context/FormContext.tsx`, `src/context/reduce.ts`, `src/hooks/useFormContext.ts`,
  generadores de CSS duplicados, estado duplicado.
- `src/lib/index.ts` — exports públicos: `FormProvider`, `FormSection`, `Field`, `SubmitButton`, hooks,
  `UIForm`, tipos (`UiSchema`, etc.).
- `npm run build` sanity (type-check + bundle); zustand bundleado (no externalizado).
- Playground + README/docs al día con el modelo `schema` + `uiSchema`.

**Tests / verificación**
- Cobertura de los caminos críticos (compilador, store, hooks, secciones) revisada.
- Build verde; el playground arranca con la API nueva.

**Hecho cuando:** no queda código v1 muerto, `npm run build` pasa y la doc refleja la API real.

---

## Definición de "hecho" global (la base, Fases 1–3)

- [ ] Tipear en un campo NO re-renderiza a sus hermanos (test de aislamiento).
- [ ] `SelectField` con `dependencies` re-renderiza solo ante sus deps.
- [ ] `compileUiSchema` traduce todas las reglas de la tabla, con tests.
- [ ] Se renderiza una sección en un componente custom vía `<FormSection>`/`useSection`.
- [ ] `<UIForm schema uiSchema/>` funciona end-to-end (submit/validación/async).

---

## Guía de comentarios

> Filosofía: **el código dice QUÉ hace; el comentario dice POR QUÉ** (o aclara lo no-obvio). Comentario
> que repite el código es ruido y se borra. Español, consistente con el repo.

### 1. Encabezado de archivo/módulo — una línea
Qué resuelve el módulo, no su contenido.
```ts
// Compila el uiSchema (RJSF) a x-jsf-* y lo mergea al schema interno del motor.
```

### 2. Funciones — descripción breve de QUÉ logra (no el cómo)
Una línea para funciones públicas o no-triviales. Las triviales no necesitan comentario.
```ts
// Traduce ui:widget/ui:placeholder/etc. de un campo a su x-jsf-presentation.
function compileField(name: string, ui: UiFieldOptions): JsfPresentation { … }
```
Para API pública, JSDoc corto si aporta (params no evidentes, valor de retorno):
```ts
/** Resuelve x-jsf-sections (interno) a secciones con sus Field, preservando el orden. */
function resolveSections(internalSchema: JsfObjectSchema, fields: Field[]): ResolvedSection[] { … }
```

### 3. Comentarios inline — solo para lo no-obvio (el PORQUÉ)
Decisiones, gotchas, workarounds, invariantes. Nunca narrar lo evidente.
```ts
// El motor splatea TODO x-jsf-presentation al field → metemos las props de UI acá. (ver §1 ter)
presentation.placeholder = ui['ui:placeholder']

// setValue usa setPath (no spread directo) para soportar paths anidados sin perder falsy.
set((s) => ({ values: setPath({ ...s.values }, name, value) }))
```
❌ Evitar:
```ts
// incrementa i en uno
i++
```

### 4. Referencias cruzadas
Cuando una decisión está documentada, apuntá a la sección en vez de re-explicar.
```ts
// Suscripción granular: selector + shallow. (ARCHITECTURE_V2.md §5)
```

### 5. TODOs
Con contexto y dueño/condición, no sueltos.
```ts
// TODO(v1.1): validación por sección para wizards. Fuera de alcance de la semana.
```

### Reglas rápidas
- Sin comentarios que repiten el nombre de la función/variable.
- Sin código comentado "por las dudas" → para eso está git.
- Cada test `describe`/`it` con texto que explica el comportamiento esperado (es documentación viva).
