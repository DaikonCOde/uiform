// Resuelve las secciones internas (x-jsf-sections) a ResolvedSection[], mapeando names → Field.

import type {
  Field,
  JsfObjectSchema,
  ResolvedSection,
  UiSection,
} from "./types";

// El compilador deja las secciones acá; el motor no conoce esta clave. (ARCHITECTURE_V2.md §6)
const SECTIONS_KEY = "x-jsf-sections";

// Sección implícita para los campos que no quedaron en ninguna sección autorada.
const DEFAULT_SECTION_ID = "__default__";

/** Índice O(1) de fields top-level por name (lo reusa también el store). */
export function indexByName(fields: Field[]): Record<string, Field> {
  const index: Record<string, Field> = {};
  for (const field of fields) index[field.name] = field;
  return index;
}

/** Resuelve x-jsf-sections (interno) a secciones con sus Field, preservando el orden. */
export function resolveSections(
  internalSchema: JsfObjectSchema,
  fields: Field[]
): ResolvedSection[] {
  const index = indexByName(fields);
  const uiSections = (internalSchema as Record<string, unknown>)[SECTIONS_KEY] as
    | UiSection[]
    | undefined;

  // Sin secciones autoradas → una única sección con TODOS los campos, en orden.
  if (!uiSections || uiSections.length === 0) {
    return [
      {
        id: DEFAULT_SECTION_ID,
        fieldNames: fields.map((f) => f.name),
        fields: [...fields],
      },
    ];
  }

  const sections: ResolvedSection[] = [];
  const seen = new Set<string>();

  for (const ui of uiSections) {
    const resolvedNames: string[] = [];
    const resolvedFields: Field[] = [];

    // Guard contra ui:sections malformado: si `fields` no es array, la sección se trata como vacía
    // (jamás rompemos el render por un uiSchema mal autorado). (REVIEW_V2 resolveSections)
    const names = Array.isArray(ui.fields) ? ui.fields : [];
    if (!Array.isArray(ui.fields)) {
      console.warn(
        `[resolveSections] La sección "${ui.id}" no trae un array \`fields\`. Se trata como vacía.`
      );
    }

    for (const name of names) {
      const field = index[name];
      // Name referenciado que no existe en el schema → avisamos y lo salteamos (no rompemos).
      if (!field) {
        console.warn(
          `[resolveSections] La sección "${ui.id}" referencia el campo "${name}", que no existe. Se omite.`
        );
        continue;
      }
      resolvedNames.push(name);
      resolvedFields.push(field);
      seen.add(name);
    }

    sections.push({
      id: ui.id,
      title: ui.title,
      description: ui.description,
      fieldNames: resolvedNames,
      fields: resolvedFields,
    });
  }

  // Campos que ninguna sección reclamó → sección implícita al final, en su orden original.
  const leftover = fields.filter((f) => !seen.has(f.name));
  if (leftover.length > 0) {
    sections.push({
      id: DEFAULT_SECTION_ID,
      fieldNames: leftover.map((f) => f.name),
      fields: leftover,
    });
  }

  return sections;
}
