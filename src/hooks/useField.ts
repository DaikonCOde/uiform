/* eslint-disable @typescript-eslint/no-explicit-any */
// Suscripción granular a UN campo: value+error+touched de ese name y callbacks estables. (ARCHITECTURE_V2.md §5)

import { useCallback } from "react";
import { shallow } from "zustand/shallow";

import { useFormStore } from "../context/FormStoreContext";
import { getPath } from "../store/paths";
import { getFieldByPath } from "../store/resolveSections";
import type { Field, FormState } from "../store/types";

/** Lo que recibe el controlador <Field>: estado del campo + callbacks estables + metadata. */
export interface UseFieldResult {
  value: any;
  error?: string | object;
  touched: boolean;
  onChange: (value: any) => void; // estable
  onBlur: () => void; // estable
  field: Field | undefined; // undefined si el path no resuelve (campo anidado inexistente)
}

/**
 * Suscripción SOLO a la metadata de un campo (su Field + isVisible) — NO al valor. Usada por el
 * controlador <Field> para decidir leaf vs contenedor sin re-renderizar cuando cambia un valor anidado:
 * así un fieldset/group-array no re-renderiza a todos sus hijos cuando uno cambia. (fix re-render contenedores)
 */
export function useFieldMeta(name: string): Field | undefined {
  const [field] = useFormStore(
    (s: FormState): [Field | undefined, boolean] => {
      const f = getFieldByPath(s.fieldsByName, name);
      return [f, (f?.isVisible as boolean) ?? true];
    },
    shallow,
  );
  return field;
}

// Igualdad estructural liviana: el error de un campo fieldset/array es un OBJETO recreado en cada
// validate() (el store hace `set({ errors: nuevoObjeto })`); con shallow esa ref nueva re-renderizaba
// el campo aunque su error no cambiara. Comparamos ese slot por VALOR. (REVIEW_V2 useField:31-33)
function deepEqual(a: any, b: any): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== "object" || a === null || typeof b !== "object" || b === null) {
    return false;
  }
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  for (const k of aKeys) {
    if (!Object.prototype.hasOwnProperty.call(b, k)) return false;
    if (!deepEqual(a[k], b[k])) return false;
  }
  return true;
}

// Slice de useField: value/touched/field por identidad (Object.is); error por VALOR (deepEqual, se recrea
// en cada validate); e isVisible por VALOR — el motor MUTA el field in-place al re-derivar visibilidad
// condicional (if/then), así que la ref del field no cambia pero su .isVisible sí. (fix casos de uso)
function fieldSliceEqual(
  a: [any, any, boolean, Field | undefined, boolean],
  b: [any, any, boolean, Field | undefined, boolean],
): boolean {
  return (
    Object.is(a[0], b[0]) && // value
    Object.is(a[2], b[2]) && // touched
    Object.is(a[3], b[3]) && // field (ref; mutado in-place por el motor)
    Object.is(a[4], b[4]) && // isVisible (primitivo: detecta la mutación de visibilidad)
    deepEqual(a[1], b[1]) // error (objeto recreado en cada validate)
  );
}

/**
 * Suscribe SOLO al slice de este campo (value/error/touched/field).
 * Tipear en otro campo NO re-renderiza este hook: el selector devuelve la misma tupla mientras este
 * name no cambie, y la igualdad custom estabiliza el slot `error` por valor. (ARCHITECTURE_V2.md §5)
 */
export function useField(name: string): UseFieldResult {
  // Una sola suscripción por tupla: minimiza lecturas del store y compara con `fieldSliceEqual`.
  const [value, error, touched, field] = useFormStore(
    (s: FormState): [any, any, boolean, Field | undefined, boolean] => {
      // getFieldByPath resuelve metadata de campos anidados (fieldset/array), no solo top-level.
      const f = getFieldByPath(s.fieldsByName, name);
      return [
        getPath(s.values, name),
        // errors top-level por name; anidados (fieldset/array) caen por getPath.
        (s.errors as Record<string, any>)[name] ?? getPath(s.errors as any, name),
        !!s.touched[name],
        f,
        // isVisible vivo: el motor lo re-deriva mutando el field en cada setValue (visibilidad condicional).
        (f?.isVisible as boolean) ?? true,
      ];
    },
    fieldSliceEqual,
  );

  // Acciones del store: referencias estables → seguras como deps. (integración: setValue/setTouched son estables)
  const setValue = useFormStore((s) => s.setValue);
  const setTouched = useFormStore((s) => s.setTouched);

  const onChange = useCallback((v: any) => setValue(name, v), [setValue, name]);
  const onBlur = useCallback(() => setTouched(name), [setTouched, name]);

  return { value, error, touched, onChange, onBlur, field };
}
