/* eslint-disable @typescript-eslint/no-explicit-any */
// Suscripción granular a UN campo: value+error+touched de ese name y callbacks estables. (ARCHITECTURE_V2.md §5)

import { useCallback } from "react";

import { useFormStore } from "../context/FormStoreContext";
import { getPath } from "../store/paths";
import type { Field, FormState } from "../store/types";

/** Lo que recibe el controlador <Field>: estado del campo + callbacks estables + metadata. */
export interface UseFieldResult {
  value: any;
  error?: string | object;
  touched: boolean;
  onChange: (value: any) => void; // estable
  onBlur: () => void; // estable
  field: Field;
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

// Slice de useField: value/touched/field por identidad (Object.is) — son primitivos o refs estables del
// store; error por VALOR (deepEqual) porque el objeto de errores se recrea en cada validación.
function fieldSliceEqual(
  a: [any, any, boolean, Field],
  b: [any, any, boolean, Field],
): boolean {
  return (
    Object.is(a[0], b[0]) && // value
    Object.is(a[2], b[2]) && // touched
    Object.is(a[3], b[3]) && // field (ref inmutable)
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
    (s: FormState): [any, any, boolean, Field] => [
      getPath(s.values, name),
      // errors top-level por name; anidados (fieldset/array) caen por getPath.
      (s.errors as Record<string, any>)[name] ?? getPath(s.errors as any, name),
      !!s.touched[name],
      s.fieldsByName[name],
    ],
    fieldSliceEqual,
  );

  // Acciones del store: referencias estables → seguras como deps. (integración: setValue/setTouched son estables)
  const setValue = useFormStore((s) => s.setValue);
  const setTouched = useFormStore((s) => s.setTouched);

  const onChange = useCallback((v: any) => setValue(name, v), [setValue, name]);
  const onBlur = useCallback(() => setTouched(name), [setTouched, name]);

  return { value, error, touched, onChange, onBlur, field };
}
