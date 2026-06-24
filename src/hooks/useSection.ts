// Metadata de UNA sección por id (sin valores → no re-render por tipeo). (ARCHITECTURE_V2.md §5)

import { useFormStore } from "../context/FormStoreContext";
import type { Field, ResolvedSection } from "../store/types";

/** Lo que recibe <FormSection>: la sección (o undefined si no existe) y sus Field. */
export interface UseSectionResult {
  section: ResolvedSection | undefined;
  fields: Field[];
}

/**
 * Suscribe a UNA sección por id. Si el id no existe, avisa y devuelve `{ section: undefined, fields: [] }`
 * (jamás rompe el render). El selector devuelve la sección puntual: como es estructura inmutable del
 * store, su ref es estable → Object.is no dispara re-renders por tipeo.
 */
export function useSection(id: string): UseSectionResult {
  const section = useFormStore((s) => s.sections.find((sec) => sec.id === id));

  if (!section) {
    // Warn UNA sola vez por id: el cuerpo del hook corre en cada render, así que sin este guard
    // un <FormSection id="typo"> montado spamearía la consola. (revisión Fase 5)
    if (!warnedIds.has(id)) {
      warnedIds.add(id);
      console.warn(`[useSection] No existe ninguna sección con id "${id}".`);
    }
    // EMPTY_FIELDS es una constante module-level (misma ref) para no romper la REGLA DE ORO:
    // un `[]` inline sería ref nueva cada render y forzaría re-renders en el consumidor.
    return { section: undefined, fields: EMPTY_FIELDS };
  }

  return { section, fields: section.fields };
}

// Ref vacía estable para el caso "sección inexistente". (ver nota en useSection)
const EMPTY_FIELDS: Field[] = [];
// Ids ya avisados (warn-once, no spamear en cada render).
const warnedIds = new Set<string>();
