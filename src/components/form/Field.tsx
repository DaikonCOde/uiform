/* eslint-disable @typescript-eslint/no-explicit-any */
// Controlador (patrón Controller): resuelve la suscripción granular de un campo y delega en el presentacional por inputType. (ARCHITECTURE_V2.md §7.1)

import React, { useCallback } from "react";

import { useField } from "../../hooks/useField";
import { useFormStore } from "../../context/FormStoreContext";
import {
  FIELD_COMPONENT_MAP,
  CONTAINER_INPUT_TYPES,
  Fallback,
  type FieldComponentMap,
} from "./fieldComponentMap";

/** Un campo individual: aquí vive la suscripción granular; los presentacionales no tocan el store. */
export function Field({ name }: { name: string }) {
  const { value, error, touched, onChange, onBlur, field } = useField(name);

  // Getter de valores para componentes que lo aceptan (AutocompleteField); ref estable del store.
  const getFormValues = useFormStore((s) => () => s.values);

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
          {...childField}
          getFormValues={getFormValues}
          {...(isContainer ? { renderField } : {})}
        />
      );
    },
    [getFormValues],
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
      {...field}
      value={value}
      error={error}
      touched={touched}
      getFormValues={getFormValues}
      // Adaptamos el contrato presentacional (onChange(name, value)) al onChange(value) del hook.
      onChange={(_n: string, v: any) => onChange(v)}
      onBlur={() => onBlur()}
      {...(isContainer ? { renderField } : {})}
    />
  );
}
