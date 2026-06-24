// Metadata de todas las secciones resueltas (sin valores → no re-render por tipeo). (ARCHITECTURE_V2.md §5)

import { useFormStore } from "../context/FormStoreContext";
import type { ResolvedSection } from "../store/types";

/** Devuelve las secciones resueltas del form, en orden. */
export function useSections(): ResolvedSection[] {
  // s.sections es estructura inmutable (se resuelve al crear el store) → ref estable, sin re-renders por valores.
  return useFormStore((s) => s.sections);
}
