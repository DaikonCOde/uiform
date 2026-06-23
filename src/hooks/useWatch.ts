/* eslint-disable @typescript-eslint/no-explicit-any */
// Observa valores puntuales del form (p. ej. dependencies de un Select): re-render SOLO si cambian. (ARCHITECTURE_V2.md §5, §8)

import { shallow } from "zustand/shallow";

import { useFormStore } from "../context/FormStoreContext";
import { getPath } from "../store/paths";
import type { FormState } from "../store/types";

export function useWatch(name: string): any;
export function useWatch(names: string[]): any[];
/**
 * Suscribe solo a los valores observados. Con un name devuelve el valor; con un array,
 * la tupla de valores. Siempre selecciona una tupla + `shallow` (mismo path de hooks
 * sin importar el tipo del arg) y desempaqueta al final para el caso único.
 */
export function useWatch(name: string | string[]): any {
  const names = Array.isArray(name) ? name : [name];

  // Selector único (tupla) + shallow: no re-renderiza si los valores observados no cambian. (ARCHITECTURE_V2.md §5)
  const values = useFormStore(
    (s: FormState) => names.map((n) => getPath(s.values, n)),
    shallow,
  );

  return Array.isArray(name) ? values : values[0];
}
