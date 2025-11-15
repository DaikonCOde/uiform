import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from "react";
import { AutoComplete, Spin } from "antd";
import { ErrorMessage, FieldLabel } from "../commons";
import { useFormContext } from "../../hooks/useFormContext";
import type { AutocompleteFieldProps } from "../../types";
import styles from "./Field.module.css";

// Wrapper interno que mantiene el input estable
const StableAutocomplete = React.memo(({ 
  inputValue,
  onInputChange,
  onSelectOption,
  onBlurHandler,
  onSearchHandler,
  autocompleteOptions,
  isSearchable,
  placeholder,
  disabled,
  loading,
  allowClear,
  error,
  asyncError,
  isTouched,
  submitted,
  required,
  name,
  filteredAntdProps
}: any) => {
  const inputRef = useRef<any>(null);
  
  return (
    <AutoComplete
      ref={inputRef}
      key={`autocomplete-${name}`}
      id={name}
      value={inputValue}
      onChange={onInputChange}
      onSelect={onSelectOption}
      onBlur={onBlurHandler}
      onSearch={isSearchable ? onSearchHandler : undefined}
      placeholder={placeholder || `Search...`}
      disabled={disabled || loading}
      allowClear={allowClear}
      options={autocompleteOptions}
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
  );
}, (prevProps, nextProps) => {
  // Comparar solo props que realmente deben causar re-render
  return (
    prevProps.inputValue === nextProps.inputValue &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.loading === nextProps.loading &&
    prevProps.error === nextProps.error &&
    prevProps.asyncError === nextProps.asyncError &&
    JSON.stringify(prevProps.autocompleteOptions) === JSON.stringify(nextProps.autocompleteOptions)
  );
});

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
  ...antdProps
}: AutocompleteFieldProps) {
  const {
    formValues,
    getAsyncOptions,
    setAsyncOptions,
    isAsyncLoading,
    setAsyncLoading,
    getAsyncError,
    setAsyncError,
  } = useFormContext();

  const [internalTouched, setInternalTouched] = useState(false);
  const isTouched = touched ?? internalTouched;

  // Estado local para el valor del input (necesario para AutoComplete de Ant Design)
  const [inputValue, setInputValue] = useState<string>("");
  // Ref para acceder al componente AutoComplete
  const inputRef = useRef<any>(null);
  // Ref para evitar actualizaciones mientras se escribe
  const isTypingRef = useRef(false);

  // Determinar si el campo usa async options y su ID
  const asyncLoaderId = asyncOptions?.id;
  const hasAsyncOptions = useMemo(() => {
    return !!asyncOptions?.loader && !!asyncLoaderId;
  }, [asyncOptions, asyncLoaderId]);

  // Obtener opciones y estado desde el contexto
  const cachedOptions = asyncLoaderId
    ? getAsyncOptions(asyncLoaderId)
    : undefined;
  const loading = asyncLoaderId ? isAsyncLoading(asyncLoaderId) : false;
  const asyncError = asyncLoaderId ? getAsyncError(asyncLoaderId) : null;

  // Ref para tracking de carga inicial
  const hasLoadedRef = useRef(false);
  const prevDepsRef = useRef<string>("");

  // Ref para mantener la referencia más actual de asyncOptions y formValues
  const asyncOptionsRef = useRef(asyncOptions);
  const formValuesRef = useRef(formValues);

  // Actualizar refs en cada render
  useEffect(() => {
    asyncOptionsRef.current = asyncOptions;
    formValuesRef.current = formValues;
  });

  // Obtener valores de dependencias si existen
  const dependencies = asyncOptions?.dependencies || [];
  const dependencyValuesStr = JSON.stringify(
    dependencies.map((dep) => formValues[dep])
  );

  // Cargar opciones async al montar (si no es searchable)
  useEffect(() => {
    if (!hasAsyncOptions || !asyncLoaderId) return;

    const asyncConfig = asyncOptions;
    if (!asyncConfig?.loader || asyncConfig.searchable) return;

    // Verificar si ya se cargó y las dependencias no cambiaron
    const depsChanged = prevDepsRef.current !== dependencyValuesStr;

    if (hasLoadedRef.current && !depsChanged) {
      return; // Ya se cargó y no hay cambios en dependencias
    }

    // Si hay opciones en cache y no cambiaron las dependencias, no recargar
    if (cachedOptions && cachedOptions.length > 0 && !depsChanged) {
      hasLoadedRef.current = true;
      return;
    }

    const loadAsyncOptions = async () => {
      if (!asyncConfig.loader) return; // Extra safety check

      setAsyncLoading(asyncLoaderId, true);
      setAsyncError(asyncLoaderId, null);

      try {
        // Pasar el contexto completo al loader
        const result = await asyncConfig.loader({ formValues, search: "" });
        setAsyncOptions(asyncLoaderId, result.options || []);
        hasLoadedRef.current = true;
        prevDepsRef.current = dependencyValuesStr;
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Failed to load options";
        setAsyncError(asyncLoaderId, errorMsg);
        setAsyncOptions(asyncLoaderId, []);
      } finally {
        setAsyncLoading(asyncLoaderId, false);
      }
    };

    loadAsyncOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasAsyncOptions, asyncLoaderId, dependencyValuesStr]);

  // Mapa de value -> label para encontrar el label cuando tenemos solo el value
  const valueToLabelMap = useMemo(() => {
    const map = new Map<string, string>();

    if (hasAsyncOptions && cachedOptions && cachedOptions.length > 0) {
      cachedOptions.forEach((option: any) => {
        if (typeof option === "object" && option !== null) {
          map.set(
            String(option.value),
            option.label || option.title || String(option.value)
          );
        } else {
          map.set(String(option), String(option));
        }
      });
    } else if (options && Array.isArray(options)) {
      options.forEach((option: any) => {
        if (typeof option === "object" && option !== null) {
          map.set(
            String(option.value),
            option.label || option.title || String(option.value)
          );
        } else {
          map.set(String(option), String(option));
        }
      });
    }

    return map;
  }, [options, hasAsyncOptions, cachedOptions]);

  // Sincronizar valor inicial y cuando cambia desde el padre (reset, etc)
  useEffect(() => {
    // Solo actualizar si NO estamos escribiendo
    if (isTypingRef.current) return;
    
    if (value) {
      const label = valueToLabelMap.get(String(value));
      const newValue = label || String(value);
      if (newValue !== inputValue) {
        setInputValue(newValue);
      }
    } else if (inputValue) {
      // Limpiar cuando el valor se resetea
      setInputValue("");
    }
  }, [value, valueToLabelMap, inputValue]);

  // Handler para búsqueda en async options
  const handleSearch = useCallback(
    async (searchValue: string) => {
      // Usar refs para obtener los valores más actuales
      const asyncConfig = asyncOptionsRef.current;
      const currentFormValues = formValuesRef.current;

      // Si no hay configuración async o no es searchable, no hacer nada
      if (!asyncConfig?.loader || !asyncLoaderId) return;

      // Si el searchValue está vacío y no es searchable, no buscar
      if (!searchValue && !asyncConfig.searchable) return;

      setAsyncLoading(asyncLoaderId, true);
      setAsyncError(asyncLoaderId, null);

      try {
        // Usar valores actuales de los refs
        const result = await asyncConfig.loader({
          search: searchValue,
          formValues: currentFormValues,
        });
        setAsyncOptions(asyncLoaderId, result.options || []);
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Failed to search options";
        setAsyncError(asyncLoaderId, errorMsg);
        setAsyncOptions(asyncLoaderId, []);
      } finally {
      setAsyncLoading(asyncLoaderId, false);
      }
    },
    [asyncLoaderId]
  );

  // Handler cuando se selecciona una opción del dropdown
  const handleSelect = useCallback(
    (selectedValue: string, option: any) => {
      if (!internalTouched) setInternalTouched(true);
      isTypingRef.current = false; // Ya no está escribiendo

      // Actualizar el estado
      const label = option?.label || selectedValue;
      setInputValue(label);

      // Guardar el value en el form state
      onChange(name, selectedValue);
    },
    [name, onChange, internalTouched]
  );

  // Handler cuando se cambia el input manualmente (sin seleccionar)
  const handleChange = useCallback(
    (val: string) => {
      isTypingRef.current = true; // Marcar que está escribiendo
      setInputValue(val); // Actualizar estado (causa re-render pero necesario)

      // Solo limpiar el form value si el input se vacía completamente
      if (!val && value) {
        if (!internalTouched) setInternalTouched(true);
        onChange(name, "");
        isTypingRef.current = false;
      }
    },
    [name, onChange, value, internalTouched]
  );

  const handleBlur = useCallback(() => {
    if (!internalTouched) setInternalTouched(true);
    onBlur?.(name);
  }, [name, onBlur, internalTouched]);

  // Ref para mantener opciones estables mientras se escribe
  const optionsRef = useRef<any[]>([]);
  
  // Determinar las opciones a usar
  const autocompleteOptions = useMemo(() => {
    let newOptions: any[] = [];
    
    // Si tiene async options, usar las del cache
    if (hasAsyncOptions && cachedOptions && cachedOptions.length > 0) {
      newOptions = cachedOptions.map((option: any) => {
        if (typeof option === "object" && option !== null) {
          return {
            label: option.label || option.title || String(option.value),
            value: option.value,
            disabled: option.disabled,
            ...option,
          };
        }
        return {
          label: String(option),
          value: option,
        };
      });
    } else if (options && Array.isArray(options)) {
      newOptions = options.map((option: any) => {
        if (typeof option === "object" && option !== null) {
          return {
            label: option.label || option.title || String(option.value),
            value: option.value,
            disabled: option.disabled,
            ...option,
          };
        }
        return {
          label: String(option),
          value: String(option),
        };
      });
    }
    
    // Solo actualizar si realmente cambiaron
    if (JSON.stringify(newOptions) !== JSON.stringify(optionsRef.current)) {
      optionsRef.current = newOptions;
    }
    
    return optionsRef.current;
  }, [options, hasAsyncOptions, cachedOptions]);

  // Memoizar las props del AutoComplete para evitar re-creación innecesaria
  const isSearchable = hasAsyncOptions ? asyncOptions?.searchable : true;
  const { _rootLayout, jsonType, ...filteredAntdProps } = antdProps;
  
  if (!isVisible) return null;


  return (
    <div className={`${styles.field} ${className || ""}`} style={style}>
      <FieldLabel
        label={label}
        required={required}
        htmlFor={name}
        description={description}
      />

      <StableAutocomplete
        inputValue={inputValue}
        onInputChange={handleChange}
        onSelectOption={handleSelect}
        onBlurHandler={handleBlur}
        onSearchHandler={handleSearch}
        autocompleteOptions={autocompleteOptions}
        isSearchable={isSearchable}
        placeholder={placeholder}
        disabled={disabled}
        loading={loading}
        allowClear={allowClear}
        error={error}
        asyncError={asyncError}
        isTouched={isTouched}
        submitted={submitted}
        required={required}
        name={name}
        filteredAntdProps={filteredAntdProps}
      />

      {(isTouched || submitted) && (
        <ErrorMessage error={error || asyncError} fieldName={name} />
      )}
    </div>
  );
});
