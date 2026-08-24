/* eslint-disable @typescript-eslint/no-explicit-any */
// Autocomplete presentacional sobre Ant Design: async unificado vía useAsyncOptions (del store), igual que Select. (ARCHITECTURE_V2.md §8)

import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { AutoComplete, Spin } from "antd";
import { ErrorMessage, FieldLabel } from "../commons";
import { useAsyncOptions } from "../../hooks/useAsyncOptions";
import type { AutocompleteFieldProps } from "../../types";
import styles from "./Field.module.css";

// Referencia estable para "sin opciones": evita crear un array nuevo por render.
const EMPTY_OPTIONS: any[] = [];

// Construye el shape { label, value } de AntD desde una opción (objeto u escalar).
function toOption(option: any) {
  if (typeof option === "object" && option !== null) {
    return {
      label: option.label || option.title || String(option.value),
      value: option.value,
      disabled: option.disabled,
      ...option,
    };
  }
  return { label: String(option), value: option };
}

// Extrae la etiqueta visible de una opción (objeto u escalar).
function optionLabel(option: any): string {
  if (typeof option === "object" && option !== null) {
    return option.label || option.title || String(option.value);
  }
  return String(option);
}

// Extrae el value de una opción (objeto u escalar).
function optionValue(option: any): any {
  return typeof option === "object" && option !== null ? option.value : option;
}

export const AutocompleteField = React.memo(function AutocompleteField({
  name,
  label,
  description,
  value,
  inputType,
  required,
  isVisible,
  error,
  submitted,
  touched,
  onChange,
  onBlur,
  className,
  style,
  disabled,
  placeholder,
  options,
  allowClear = true,
  asyncOptions,
  getFormValues,
  ...antdProps
}: AutocompleteFieldProps) {
  const [internalTouched, setInternalTouched] = useState(false);
  const isTouched = touched ?? internalTouched;

  // Estado local del texto del input: AntD AutoComplete es un input controlado por texto (no por value).
  const [inputValue, setInputValue] = useState<string>("");

  // El async vive en el store (igual que SelectField): activo solo si el field trae asyncOptions.id. (ARCHITECTURE_V2.md §8)
  const asyncLoaderId = asyncOptions?.id;
  const hasAsyncOptions = !!asyncLoaderId;
  // searchable: por default el autocomplete busca; respeta el flag explícito del schema si está.
  const searchable = (asyncOptions as any)?.searchable ?? true;
  // Umbral mínimo de caracteres antes de disparar el loader (default 0 = comportamiento previo, sin regresión).
  const minSearchLength = (asyncOptions as any)?.minSearchLength ?? 0;

  // Suscripción granular a async[loaderId] + recarga al cambiar deps; warning dev si el id no resuelve loader.
  const {
    options: asyncLoadedOptions,
    loading,
    error: asyncError,
    reload,
  } = useAsyncOptions(asyncLoaderId, asyncOptions?.dependencies);

  // Fuente de opciones: store si es async (aunque venga vacío → notFoundContent), estáticas si no.
  const autocompleteOptions = useMemo(() => {
    const source = hasAsyncOptions
      ? asyncLoadedOptions
      : Array.isArray(options)
        ? options
        : null;
    if (!source) return EMPTY_OPTIONS;
    return source.map(toOption);
  }, [hasAsyncOptions, asyncLoadedOptions, options]);

  // Mapa value→label para mostrar la etiqueta cuando el form solo nos da el value (selección externa/reset).
  const valueToLabelMap = useMemo(() => {
    const map = new Map<string, string>();
    const source = hasAsyncOptions ? asyncLoadedOptions : options;
    if (Array.isArray(source)) {
      for (const option of source) {
        map.set(String(optionValue(option)), optionLabel(option));
      }
    }
    return map;
  }, [hasAsyncOptions, asyncLoadedOptions, options]);

  // Sincroniza el texto del input SOLO cuando el value del form cambia de verdad (no mientras el usuario tipea):
  // así una selección/reset externo refleja su label, sin pisar lo que el usuario está escribiendo. (anti-loop)
  const prevValueRef = useRef(value);
  useEffect(() => {
    if (value !== prevValueRef.current) {
      setInputValue(value ? valueToLabelMap.get(String(value)) ?? String(value) : "");
      prevValueRef.current = value;
    }
  }, [value, valueToLabelMap]);

  // Búsqueda async: re-invoca el loader del store con el término (debounce simple para no spamear). (ARCHITECTURE_V2.md §8)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSearch = useCallback(
    (searchValue: string) => {
      if (!hasAsyncOptions || !searchable) return;
      if (searchValue.length < minSearchLength) return;
      if (searchTimer.current) clearTimeout(searchTimer.current);
      searchTimer.current = setTimeout(() => reload(searchValue), 250);
    },
    [hasAsyncOptions, searchable, minSearchLength, reload],
  );

  // Limpia el timer pendiente al desmontar para no llamar reload sobre un componente muerto.
  useEffect(() => {
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, []);

  // Selección del dropdown: muestra el label y guarda el value en el store. (contrato onChange(name, value))
  const handleSelect = useCallback(
    (selectedValue: string, option: any) => {
      if (!internalTouched) setInternalTouched(true);
      setInputValue(option?.label ?? selectedValue);
      onChange(name, selectedValue);
    },
    [name, onChange, internalTouched],
  );

  // Tipeo manual (sin seleccionar): actualiza el texto; limpia el value del form solo si el input se vacía.
  const handleChange = useCallback(
    (val: string) => {
      setInputValue(val);
      if (!val && value) {
        if (!internalTouched) setInternalTouched(true);
        onChange(name, "");
      }
    },
    [name, onChange, value, internalTouched],
  );

  const handleBlur = useCallback(() => {
    if (!internalTouched) setInternalTouched(true);
    onBlur?.(name);
  }, [name, onBlur, internalTouched]);

  if (isVisible === false) return null;

  const isSearchable = hasAsyncOptions ? searchable : true;

  // Stripping de props internas del motor (no son props válidas de <AutoComplete>). (ARCHITECTURE_V2.md §1 bis)
  const { type, jsonType, _rootLayout, errorMessage, ...filteredAntdProps } =
    antdProps as any;

  return (
    <div className={`${styles.field} ${className || ""}`} style={style}>
      <FieldLabel
        label={label}
        required={required}
        htmlFor={name}
        description={description}
      />

      <AutoComplete
        id={name}
        value={inputValue}
        onChange={handleChange}
        onSelect={handleSelect}
        onBlur={handleBlur}
        onSearch={isSearchable ? handleSearch : undefined}
        placeholder={placeholder || "Search..."}
        disabled={disabled}
        allowClear={allowClear}
        options={autocompleteOptions}
        // En búsqueda async el filtrado lo hace el loader (server-side) → sin filtro local.
        filterOption={false}
        getPopupContainer={(trigger: any) => trigger.parentElement}
        status={
          (error || asyncError) && (isTouched || submitted)
            ? ("error" as "" | "error" | "warning")
            : undefined
        }
        notFoundContent={
          loading ? <Spin size="small" /> : asyncError ? asyncError : "No results"
        }
        aria-invalid={!!(error || asyncError)}
        aria-describedby={error || asyncError ? `${name}-error` : undefined}
        aria-required={required}
        style={{ width: "100%" }}
        {...filteredAntdProps}
      />

      {(isTouched || submitted) && (
        <ErrorMessage error={error || asyncError} fieldName={name} />
      )}
    </div>
  );
});
