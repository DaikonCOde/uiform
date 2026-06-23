/* eslint-disable @typescript-eslint/no-explicit-any */
// Suscripción granular a UN campo: value+error+touched de ese name y callbacks estables. (ARCHITECTURE_V2.md §5)

import { useCallback } from "react";
import { shallow } from "zustand/shallow";

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

/**
 * Suscribe SOLO al slice de este campo (value/error/touched/field) con `shallow`.
 * Tipear en otro campo NO re-renderiza este hook: el selector devuelve la misma tupla
 * mientras este name no cambie (shallow sobre primitivos/refs estables). (ARCHITECTURE_V2.md §5)
 */
export function useField(name: string): UseFieldResult {
  // Una sola suscripción por tupla: minimiza lecturas del store y compara con shallow.
  const [value, error, touched, field] = useFormStore(
    (s: FormState) => [
      getPath(s.values, name),
      // errors top-level por name; anidados (fieldset/array) caen por getPath.
      (s.errors as Record<string, any>)[name] ?? getPath(s.errors as any, name),
      !!s.touched[name],
      s.fieldsByName[name],
    ],
    shallow,
  );

  // Acciones del store: referencias estables → seguras como deps. (integración: setValue/setTouched son estables)
  const setValue = useFormStore((s) => s.setValue);
  const setTouched = useFormStore((s) => s.setTouched);

  const onChange = useCallback((v: any) => setValue(name, v), [setValue, name]);
  const onBlur = useCallback(() => setTouched(name), [setTouched, name]);

  return { value, error, touched, onChange, onBlur, field };
}
