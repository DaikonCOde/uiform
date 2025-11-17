import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from "react";
import { AutoComplete, Spin } from "antd";
import { ErrorMessage, FieldLabel } from "../commons";
import type { AutocompleteFieldProps } from "../../types";
import styles from "./Field.module.css";

// Wrapper interno simplificado - ya no necesita workaround de focus
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
  return (
    <AutoComplete
      id={name}
      value={inputValue}
      onChange={onInputChange}
      onSelect={onSelectOption}
      onBlur={onBlurHandler}
      onSearch={isSearchable ? onSearchHandler : undefined}
      placeholder={placeholder || `Search...`}
      disabled={disabled}  // Don't disable on loading - causes focus loss
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
  // Solo re-renderizar si props críticas cambian
  return (
    prevProps.inputValue === nextProps.inputValue &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.loading === nextProps.loading &&
    prevProps.error === nextProps.error &&
    prevProps.asyncError === nextProps.asyncError &&
    prevProps.name === nextProps.name &&
    prevProps.autocompleteOptions?.length === nextProps.autocompleteOptions?.length
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
  getFormValues,
  ...antdProps
}: AutocompleteFieldProps) {
  // getFormValues now comes from props to avoid context subscription

  const [internalTouched, setInternalTouched] = useState(false);
  const isTouched = touched ?? internalTouched;

  // Estado local para el valor del input (necesario para AutoComplete de Ant Design)
  const [inputValue, setInputValue] = useState<string>("");

  // NUEVO: Estado interno para async options (en lugar de context)
  const [internalOptions, setInternalOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [asyncError, setAsyncError] = useState<string | null>(null);

  // Determinar si el campo usa async options y su ID
  const asyncLoaderId = asyncOptions?.id;
  const hasAsyncOptions = useMemo(() => {
    return !!asyncOptions?.loader && !!asyncLoaderId;
  }, [asyncOptions, asyncLoaderId]);

  // Ref para mantener la referencia más actual de asyncOptions
  const asyncOptionsRef = useRef(asyncOptions);

  // Actualizar refs en cada render
  useEffect(() => {
    asyncOptionsRef.current = asyncOptions;
    console.log({asyncOptions})

  }, [asyncOptions]);

  // Cargar opciones async al montar (si no es searchable)
  // Este effect NO se ejecuta cuando formValues cambia (para evitar re-renders)
  // Solo se ejecuta cuando el loader o sus dependencias estructurales cambian
  useEffect(() => {
    if (!hasAsyncOptions || !asyncLoaderId) return;

    const asyncConfig = asyncOptions;
    if (!asyncConfig?.loader || asyncConfig.searchable) return;

    const loadAsyncOptions = async () => {
      if (!asyncConfig.loader) return; // Extra safety check

      setLoading(true);
      setAsyncError(null);

      try {
        // Get current form values without subscribing
        if (!getFormValues) return;
        const currentFormValues = getFormValues();

        // Pasar el contexto completo al loader
        const result = await asyncConfig.loader({ formValues: currentFormValues, search: "" });
        setInternalOptions(result.options || []);
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Failed to load options";
        setAsyncError(errorMsg);
        setInternalOptions([]);
      } finally {
        setLoading(false);
      }
    };

    loadAsyncOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasAsyncOptions, asyncLoaderId]);

  // Mapa de value -> label para encontrar el label cuando tenemos solo el value
  const valueToLabelMap = useMemo(() => {
    const map = new Map<string, string>();

    if (hasAsyncOptions && internalOptions.length > 0) {
      internalOptions.forEach((option: any) => {
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
  }, [options, hasAsyncOptions, internalOptions]);

  // Ref para trackear el valor anterior y detectar cambios reales
  const prevValueRef = useRef(value);

  // Sincronizar SOLO cuando el value del form realmente cambia (no cuando el usuario escribe)
  useEffect(() => {
    // Solo actuar si el value del form cambió realmente
    if (value !== prevValueRef.current) {
      if (value) {
        // Hay un nuevo value del form, sincronizar el input
        const label = valueToLabelMap.get(String(value));
        const newValue = label || String(value);
        setInputValue(newValue);
      } else {
        // El value cambió a vacío (reset explícito del form)
        setInputValue("");
      }
      prevValueRef.current = value;
    }
  }, [value, valueToLabelMap]);

  // Handler para búsqueda en async options
  const handleSearch = useCallback(
    async (searchValue: string) => {
      console.log({searchValue})
      // Usar ref para obtener la configuración async más actual
      const asyncConfig = asyncOptionsRef.current;

      // Si no hay configuración async o no es searchable, no hacer nada
      if (!asyncConfig?.loader || !asyncLoaderId) return;

      // Si el searchValue está vacío y no es searchable, no buscar
      if (!searchValue && !asyncConfig.searchable) return;

      setLoading(true);
      setAsyncError(null);

      try {
        if (!getFormValues) return;
        // Get current form values without subscribing
        const currentFormValues = getFormValues();

        // Llamar al loader con los valores actuales
        const result = await asyncConfig.loader({
          search: searchValue,
          formValues: currentFormValues,
        });
        setInternalOptions(result.options || []);
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Failed to search options";
        setAsyncError(errorMsg);
        setInternalOptions([]);
      } finally {
        setLoading(false);
      }
    },
    [asyncLoaderId]  // getFormValues is stable, no need in deps
  );

  // Handler cuando se selecciona una opción del dropdown
  const handleSelect = useCallback(
    (selectedValue: string, option: any) => {
      if (!internalTouched) setInternalTouched(true);

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

      setInputValue(val); // Actualizar estado (causa re-render pero necesario)

      // Solo limpiar el form value si el input se vacía completamente
      if (!val && value) {
        if (!internalTouched) setInternalTouched(true);
        onChange(name, "");
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

    // Si tiene async options, usar las internas
    if (hasAsyncOptions && internalOptions.length > 0) {
      newOptions = internalOptions.map((option: any) => {
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
  }, [options, hasAsyncOptions, internalOptions]);

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
