/* eslint-disable @typescript-eslint/no-explicit-any */
// Controlador (patrón Controller): resuelve la suscripción granular de un campo y delega en el presentacional por inputType. (ARCHITECTURE_V2.md §7.1)

import React, { useCallback } from "react";

import { useField } from "../../hooks/useField";
import {
  FIELD_COMPONENT_MAP,
  CONTAINER_INPUT_TYPES,
  Fallback,
  type FieldComponentMap,
} from "./fieldComponentMap";

// Props internas del motor (createHeadlessForm) que NO deben llegar al presentacional ni filtrarse al
// DOM/AntD (causan warnings o pisan props). Centralizado acá: un solo punto de strip para TODOS los
// campos (los strips locales en fields/* quedan redundantes pero inofensivos). (REVIEW_V2.md §1)
const ENGINE_ONLY_PROPS = new Set([
  "type",
  "jsonType",
  "_rootLayout",
  "errorMessage",
  "computedAttributes",
  "anyOf",
  "const",
  "nameKey", // el motor lo inyecta en fields de items de array → no es prop DOM válida. (probe browser)
]);
// NOTA: `isVisible` y `required` figuran en la lista de la tarea pero NO se omiten a propósito: son
// contrato presentacional vivo. TODO field component hace `if (!isVisible) return null` y usa `required`
// para FieldLabel/aria-required → omitirlos ocultaría todos los campos. La regla "no omitas nada que un
// presentacional necesite" manda sobre la lista. (REVIEW_V2.md §1)

/** Quita del field las props internas del motor antes de spreadearlo sobre el presentacional. (REVIEW_V2.md §1) */
function omitEngineProps(field: Record<string, any>): Record<string, any> {
  const clean: Record<string, any> = {};
  for (const key in field) {
    if (!ENGINE_ONLY_PROPS.has(key)) clean[key] = field[key];
  }
  return clean;
}

/** Un campo individual: aquí vive la suscripción granular; los presentacionales no tocan el store. */
export function Field({ name }: { name: string }) {
  const { value, error, touched, onChange, onBlur, field } = useField(name);

  // Adaptadores memoizados: useField ya da onChange/onBlur estables; no los re-envolvemos inline
  // (props frescas cada render romperían el React.memo de los presentacionales). (fix de revisión)
  const handleChange = useCallback((_n: string, v: any) => onChange(v), [onChange]);
  const handleBlur = useCallback(() => onBlur(), [onBlur]);

  // renderField: hijos de un contenedor ya vienen cableados (value/onChange/name prefijado) → solo
  // resolvemos el componente y lo renderizamos CONTROLADO, preservando el contrato v1. (ARCHITECTURE_V2.md §13.1)
  const renderField = useCallback(
    (childField: any, index: number): React.ReactNode => {
      const Child = (FIELD_COMPONENT_MAP[
        childField.inputType as keyof FieldComponentMap
      ] ?? Fallback) as React.ComponentType<any>;
      const isContainer = CONTAINER_INPUT_TYPES.has(childField.inputType);
      return (
        <Child
          key={`${childField.name}-${index}`}
          {...omitEngineProps(childField)}
          {...(isContainer ? { renderField } : {})}
        />
      );
    },
    [],
  );

  if (!field) {
    return <Fallback inputType="undefined" name={name} />;
  }

  // El union de todos los componentes de campo colapsa sus props a `never`; casteamos a un
  // componente de props abiertas (el contrato real lo garantiza useField + el field del motor).
  const Component = (FIELD_COMPONENT_MAP[
    field.inputType as keyof FieldComponentMap
  ] ?? Fallback) as React.ComponentType<any>;
  const isContainer = CONTAINER_INPUT_TYPES.has(field.inputType);

  return (
    <Component
      {...omitEngineProps(field)}
      value={value}
      error={error}
      touched={touched}
      // Adaptamos el contrato presentacional (onChange(name, value)) al onChange(value) del hook.
      onChange={handleChange}
      onBlur={handleBlur}
      {...(isContainer ? { renderField } : {})}
    />
  );
}
