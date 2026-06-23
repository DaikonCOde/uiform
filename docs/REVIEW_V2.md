# UIForm v2 — Revisión adversarial (Fases 1-4)

> Revisión exhaustiva de lo implementado en Fases 1-4, hecha por 3 agentes adversariales (capa
> store/compilador, capa hooks/suscripción, capa presentacional/integración) + un demo de
> verificación (`src/App.tsx`). Fecha: 2026-06-23.

## Veredicto

Las piezas puras (paths, resolveSections, compileUiSchema para objetos) eran sólidas. Pero la
**promesa central de v2 —re-render granular— estaba ROTA en el controlador**, y el test que la
"probaba" era un falso positivo. Corregido. Suite 89/89 verde, tsc limpio, dev server bootea OK.

---

## ✅ Corregido (commit `a77ded1`)

| Sev | Dónde | Bug | Fix |
|-----|-------|-----|-----|
| 🔴 | `Field.tsx:20` | `useFormStore((s) => () => s.values)` devolvía función nueva cada cambio → **cada `<Field>` re-renderizaba ante cualquier tecla** (§11.8 resucitado) | `useFormStoreApi()` (ref estable, sin suscripción) + `getFormValues` memoizado |
| 🔴 | `Field.tsx:59-63` | `onChange`/`onBlur` inline cada render rompían el `React.memo` de los presentacionales | adaptadores `handleChange`/`handleBlur` memoizados |
| 🔴 | `reRenderIsolation.test` | Falso positivo: testeaba `useField` aislado, **nunca renderizaba `<Field>`** | agregado test nivel-controlador con `<Field>` real + `Profiler` |
| 🔴 | `FormStoreContext` | Provider congelaba `onSubmit`/`onChange`/`asyncLoaders` al crear el store (handlers inline nunca se refrescaban) | delegación por ref viva (`optsRef`) + `useFormStoreApi` |
| 🟠 | `createFormStore` loadAsyncOptions | Race "gana el último en resolver" → opciones viejas pisan nuevas | guard de secuencia por loader |
| 🟠 | `compileUiSchema` | No llegaba a items de arrays (`group-array`) | recursión a `items.properties` |
| 🟠 | `compileUiSchema` | `ui:options` podía pisar `ui:widget`→inputType | splat de `ui:options` ANTES de las claves dedicadas |
| 🟡 | `TextareaField`/`SelectField` | Filtraban `type`/`errorMessage` a AntD (warnings) | emparejado el stripping |
| 🟡 | `createFormStore` setValue | Doble clon de la raíz (`{...s.values}` + `setPath`) | `setPath(s.values, …)` directo |

---

## 🔲 Diferido (próxima iteración — con la Fase 5+)

| Sev | Dónde | Issue | Fix sugerido |
|-----|-------|-------|--------------|
| 🟠 | `Field.tsx` + todos los `fields/*` | El **prop-stripping no se eliminó**, solo se relocalizó y es inconsistente (cada componente strippea a mano). El doc §1 decía eliminarlo | Centralizar `omitEngineProps(field)` en el controlador → presentacionales reciben `FieldComponentProps` limpio |
| 🟠 | `SelectField` vs `AutocompleteField` | Dos mecanismos async DISTINTOS (Select usa store, Autocomplete usa loader inyectado en local state). Loader inexistente = silencio (sin warning) | Unificar Autocomplete sobre `useAsyncOptions`; dev-warning si `asyncOptions.id` no resuelve loader |
| 🟠 | `createFormStore` setValue | `onChange(json, errors)` entrega `errors` STALE salvo `validateTrigger:'onChange'` | Documentar el contrato, o recomputar errores antes de `onChange` |
| 🟠 | `useField.ts:31-33` | Error anidado (fieldset/array) es ref nueva en cada `validate()` → esos `<Field>` re-renderizan en cada validación | Igualdad por valor del slice de error, o normalizar a primitivo |
| 🟡 | `SelectField:84-92` | Búsqueda async que devuelve 0 resultados cae a opciones estáticas (no muestra "sin resultados") | Ramificar por `hasAsyncOptions` solo; `notFoundContent` para el vacío |
| 🟡 | `CheckboxField` | Checkbox con `checkboxValue` emite `null` al destildar → puede romper validación de `boolean` requerido | Emitir `undefined`/`false` según tipo del schema |
| 🟡 | `GroupArrayField:106` | React key desde `item.id` editable por el usuario → remonta fila al editar | key sintética estable generada al agregar |
| 🔵 | `test/components/` | **Sin cobertura de contenedores** (fieldset/group-array) — el código más riesgoso | Test vertical-slice con fieldset (text+select) y group-array |
| 🔵 | `compileUiSchema` / `resolveSections` | `as UiSection[]` sin validar shape → sección sin `fields` rompería | Guardar contra `ui:sections` malformado |

---

## Notas de verificación

- **Demo** (`src/App.tsx`): schema + uiSchema (con `ui:sections` + async select) → compilador → store →
  `<Field>`. Corré `npm run dev` (localhost:5173) para verlo. Bootea OK, HTTP 200, transpila sin errores.
- El controlador **SÍ cablea bien los hijos de contenedores** (era una sospecha de la revisión, descartada):
  el container arma `nestedField` con value/onChange/name prefijado y `renderField` lo renderiza controlado.
