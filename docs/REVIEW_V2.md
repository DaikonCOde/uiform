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

## ✅ Resuelto en la última iteración (todos los diferidos + hallazgos del browser)

| Sev | Dónde | Issue | Cómo se resolvió |
|-----|-------|-------|------------------|
| 🟠 | `Field.tsx` | prop-stripping disperso e inconsistente | `omitEngineProps()` centralizado en el controlador (un solo punto de strip) |
| 🟠 | Select vs Autocomplete | dos mecanismos async distintos | `AutocompleteField` migrado a `useAsyncOptions` (sin `StableAutocomplete`); warning dev si el `loaderId` no resuelve |
| 🟠 | `createFormStore` setValue | `onChange(errors)` stale | contrato documentado + tests (frescos con `validateTrigger:'onChange'`) |
| 🟠 | `useField` | error anidado re-renderiza en cada validate | equalityFn custom: `error` se compara por VALOR (deepEqual liviano) |
| 🟡 | `SelectField` | búsqueda vacía caía a opciones estáticas | `source` ramifica por `hasAsyncOptions` solo; `notFoundContent` para el vacío |
| 🟡 | `CheckboxField` | destildar emitía `null`/`undefined` | boolean → `false`; value-checkbox (const no-bool) → `undefined`. Detección por `typeof checkboxValue` |
| 🟡 | `GroupArrayField` | React key desde campo editable | uid sintético interno generado al agregar |
| 🔵 | `test/components/containers.test.tsx` | sin cobertura de contenedores | 15 tests (fieldset + group-array: round-trip anidado, add/remove, falsy, key estable) |
| 🔵 | `resolveSections` | `ui:sections` malformado rompía | guard `Array.isArray(fields)` + warn |

### Hallazgos extra que cazó el browser (no estaban en la revisión estática)

| Sev | Dónde | Issue | Fix |
|-----|-------|-------|-----|
| 🟠 | `Field.tsx` | `getFormValues` quedó MUERTO tras migrar Autocomplete, pero el controlador lo pasaba a todos → leak al DOM (`FieldsetField`) | eliminado del controlador (kill en el origen) |
| 🟡 | `Field.tsx` | el motor inyecta `nameKey` en fields de items de array → leak al input | agregado a `ENGINE_ONLY_PROPS` |

---

## ✅ Verificación funcional en browser (Playwright headless contra el dev server)

Demo `src/App.tsx` extendido con las 3 secciones (datos / extra / contenedores) cubriendo TODOS los
tipos de campo. Cada funcionalidad probada manejando el browser real:

| Funcionalidad | Resultado |
|---|---|
| Render + 3 secciones (desde `ui:sections`) | ✅ |
| text / email / number (numérico) / textarea | ✅ |
| select async (carga diferida + selección) | ✅ |
| autocomplete searchable (busca server-side + selección) | ✅ |
| checkbox (tildar→`true`, destildar→`false`, NO null) | ✅ |
| fieldset → objeto anidado en el store | ✅ |
| group-array → add item + array anidado | ✅ |
| submit válido → `onSubmit` con payload completo | ✅ |
| reset → limpia values | ✅ |
| validación (submit vacío → errores de requeridos) | ✅ |
| **consola del browser** | ✅ limpia (cero errores/warnings) |

> Estado: las Fases 1-4 están **completamente funcionales y verificadas end-to-end**. Quedan para la
> próxima iteración las Fases 5-7 (FormSection/useSection componibles, UIForm v2 + SubmitButton +
> responsive SSR-safe, DROP del v1 y exports públicos).
