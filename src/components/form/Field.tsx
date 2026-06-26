/* eslint-disable @typescript-eslint/no-explicit-any */
// Controlador (patrón Controller): se suscribe SOLO a la metadata del campo (no al valor) y despacha
// hoja vs contenedor. Los hijos de un contenedor se renderizan como <Field> propios → un cambio en un
// hijo NO re-renderiza a sus hermanos (suscripción granular real). (ARCHITECTURE_V2.md §7.1 / fix re-render)

import React, { useCallback } from "react";

import { useField, useFieldMeta } from "../../hooks/useField";
import { useFieldComponents } from "../../context/FormStoreContext";
import {
  FIELD_COMPONENT_MAP,
  CONTAINER_INPUT_TYPES,
  Fallback,
  type FieldComponentMap,
} from "./fieldComponentMap";

// Props internas del motor (createHeadlessForm) que NO deben llegar al presentacional ni filtrarse al
// DOM/AntD. Un solo punto de strip para TODOS los campos. (REVIEW_V2.md §1)
const ENGINE_ONLY_PROPS = new Set([
  "type",
  "jsonType",
  "_rootLayout",
  "errorMessage",
  "computedAttributes",
  "anyOf",
  "const",
  "nameKey",
]);

/** Quita del field las props internas del motor antes de spreadearlo sobre el presentacional. */
function omitEngineProps(field: Record<string, any>): Record<string, any> {
  const clean: Record<string, any> = {};
  for (const key in field) {
    if (!ENGINE_ONLY_PROPS.has(key)) clean[key] = field[key];
  }
  return clean;
}

/** Resuelve el componente por inputType respetando el registry de widgets custom. */
function useResolve(): (inputType: string) => React.ComponentType<any> {
  const components = useFieldComponents();
  return useCallback(
    (inputType: string): React.ComponentType<any> =>
      (components[inputType] ??
        FIELD_COMPONENT_MAP[inputType as keyof FieldComponentMap] ??
        Fallback) as React.ComponentType<any>,
    [components],
  );
}

/** Campo HOJA: acá vive la suscripción al VALOR. Solo re-renderiza cuando cambia SU slice. */
function LeafField({
  name,
  field,
  Component,
}: {
  name: string;
  field: any;
  Component: React.ComponentType<any>;
}) {
  const { value, error, touched, onChange, onBlur } = useField(name);

  // Adaptadores memoizados: el contrato presentacional es onChange(name, value); el hook da onChange(value).
  const handleChange = useCallback((_n: string, v: any) => onChange(v), [onChange]);
  const handleBlur = useCallback(() => onBlur(), [onBlur]);

  return (
    <Component
      {...omitEngineProps(field)}
      name={name} // path COMPLETO: id/onChange correctos también para campos anidados
      value={value}
      error={error}
      touched={touched}
      onChange={handleChange}
      onBlur={handleBlur}
    />
  );
}

/** Un campo por name: metadata-only acá → no re-renderiza por cambios de valor (ni propios ni anidados). */
export function Field({ name }: { name: string }) {
  const field = useFieldMeta(name);
  const resolve = useResolve();

  if (!field) {
    return <Fallback inputType="undefined" name={name} />;
  }

  // Contenedor: el componente es un CONTROLADOR ({ name, field }) que renderiza sus hijos como <Field>
  // propios (granular). NO le pasamos el valor → el contenedor no re-renderiza por cambios profundos.
  if (CONTAINER_INPUT_TYPES.has(field.inputType)) {
    const Container = resolve(field.inputType);
    return <Container name={name} field={field} />;
  }

  return <LeafField name={name} field={field} Component={resolve(field.inputType)} />;
}
