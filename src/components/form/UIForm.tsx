import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from "react";
import { createHeadlessForm } from "@remoteoss/json-schema-form";
import { Form, Button, Space, Alert } from "antd";
import { useFieldRenderer } from "../../hooks/useFieldRenderer";
import {
  formValuesToJsonValues,
  getDefaultValuesFromFields,
} from "../../utils/utils";
import { useResponsiveCSS } from "../../utils/responsive-layout";
import { FormProvider } from "../../context/FormContext";
import { useFormContext } from "../../hooks/useFormContext";
import type { UIFormProps } from "../../types";
import styles from "./UIForm.module.css";

// Componente interno que usa el contexto
function UIFormContent({
  schema,
  initialValues = {},
  asyncLoaders = {},
  onSubmit,
  onChange,
  config = {},
  className,
  style,
  children,
  ...formProps
}: UIFormProps & {
  children?: React.ReactNode;
}) {
  // We need to call useFormContext to get the latest context,
  // but store methods in refs to keep callbacks stable
  const context = useFormContext();

  // Store context in ref - updated on every render but doesn't affect callback identity
  const contextRef = useRef(context);

  // Update ref whenever context changes (keeps methods fresh)
  useEffect(() => {
    contextRef.current = context;
  }, [context]);

  // Create stable wrapper functions that access context via ref
  // These callbacks never change identity, which prevents child re-renders
  const setContextFormValues = useCallback((values: Record<string, any>) => {
    contextRef.current?.setFormValues(values);
  }, []);

  const getFormValues = useCallback(() => {
    return contextRef.current?.getFormValues() || {};
  }, []);

  const {
    showRequiredMark = true,
    validateTrigger = "onChange",
    size = "middle",
    layout = "horizontal",
    disabled = false,
  } = config;

  // Crear formulario headless con json-schema-form
  const {
    fields,
    handleValidation,
    isError,
    error,
    layout: containerLayout,
  } = useMemo(() => {
    try {
      return createHeadlessForm(schema, {
        strictInputType: false,
        initialValues,
        asyncLoaders,
      });
    } catch (err) {
      console.error("Error creating headless form:", err);
      return {
        fields: [],
        handleValidation: () => ({
          formErrors: { "": "Error initializing form" },
        }),
        isError: true,
        error: "Failed to initialize form from schema",
        layout: null,
      };
    }
  }, [schema, initialValues, asyncLoaders]);

  // Estados del formulario
  const [values, setValues] = useState<Record<string, any>>(() =>
    getDefaultValuesFromFields(fields, initialValues)
  );
  const [errors, setErrors] = useState<Record<string, any>>({});
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generar ID único para el formulario
  const formId = useMemo(() => Math.random().toString(36).substr(2, 9), []);

  // Refs para valores estables en callbacks
  const valuesRef = useRef(values);
  const onChangeRef = useRef(onChange);
  const validateTriggerRef = useRef(validateTrigger);

  // Actualizar refs cuando cambien
  useEffect(() => {
    valuesRef.current = values;
    onChangeRef.current = onChange;
    validateTriggerRef.current = validateTrigger;
  });

  // Hook para manejar CSS responsivo automáticamente
  const { containerClassName, getFieldClassName } = useResponsiveCSS(
    fields,
    containerLayout,
    formId
  );

  // Generar estilos CSS para el layout del contenedor

  // Hook para renderizar campos
  const { renderField } = useFieldRenderer({
    globalConfig: {
      disabled,
      size,
      validateTrigger,
    },
  });

  // Función para validar valores
  const validateValues = useCallback(
    (valuesToValidate: Record<string, any>) => {
      try {
        const valuesForJson = formValuesToJsonValues(valuesToValidate, fields);
        const { formErrors } = handleValidation(valuesForJson);

        setErrors(formErrors || {});

        return {
          errors: formErrors,
          jsonValues: valuesForJson,
        };
      } catch (err) {
        console.error("Validation error:", err);
        const errorMsg = "Validation failed";
        setErrors({ "": errorMsg });
        return {
          errors: { "": errorMsg },
          jsonValues: valuesToValidate,
        };
      }
    },
    [fields, handleValidation]
  );

  // Manejar cambios de campo - ESTABLE (no cambia en cada render)
  const handleFieldChange = useCallback(
    (fieldName: string, value: any) => {
      setValues((prevValues) => {
        const newValues = {
          ...prevValues,
          [fieldName]: value,
        };

        // Actualizar contexto con los nuevos valores
        setContextFormValues(newValues);

        // Validar según la configuración usando ref
        if (validateTriggerRef.current === "onChange") {
          // Usar setTimeout para asegurar que la validación ocurre después del render
          setTimeout(() => {
            const validation = validateValues(newValues);
            // Llamar onChange si está definido usando ref
            onChangeRef.current?.(validation.jsonValues, validation.errors);
          }, 0);
        }

        return newValues;
      });
    },
    [validateValues, setContextFormValues]
  ); // Solo depende de funciones estables

  // Manejar blur de campo - ESTABLE (no cambia en cada render)
  const handleFieldBlur = useCallback(
    (_fieldName: string) => {
      // Usar refs para obtener valores actuales
      if (validateTriggerRef.current === "onBlur") {
        const validation = validateValues(valuesRef.current);
        onChangeRef.current?.(validation.jsonValues, validation.errors);
      }
    },
    [validateValues]
  ); // Solo depende de validateValues que es estable

  // Manejar envío del formulario
  const handleSubmit = useCallback(async () => {
    setSubmitted(true);
    setIsSubmitting(true);

    try {
      const validation = validateValues(values);

      // Si hay errores, no enviar
      if (validation.errors && Object.keys(validation.errors).length > 0) {
        setIsSubmitting(false);
        return;
      }

      // Llamar onSubmit si está definido
      if (onSubmit) {
        await onSubmit(validation.jsonValues, validation.errors);
      }
    } catch (err) {
      console.error("Submit error:", err);
      setErrors({ "": "Failed to submit form" });
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validateValues, onSubmit]);

  // Sincronizar valores iniciales con el contexto
  useEffect(() => {
    const newValues = getDefaultValuesFromFields(fields, initialValues);
    setValues(newValues);
    setContextFormValues(newValues);
  }, []); // Solo al montar

  // Actualizar cuando cambian initialValues (después del montaje inicial)
  useEffect(() => {
    if (Object.keys(initialValues).length > 0) {
      const newValues = getDefaultValuesFromFields(fields, initialValues);
      setValues(newValues);
      setContextFormValues(newValues);
    }
  }, [initialValues, fields, setContextFormValues]);

  // Si hay error en la inicialización, mostrar mensaje
  if (isError) {
    return (
      <Alert
        message="Form Initialization Error"
        description={error || "Failed to initialize form from schema"}
        type="error"
        showIcon
        className={className}
        style={style}
      />
    );
  }

  return (
    <div className={className} style={style}>
      <Form
        layout={layout}
        size={size}
        requiredMark={showRequiredMark}
        disabled={disabled}
        onFinish={handleSubmit}
        {...formProps}
      >
        {/* Error general del formulario */}
        {errors[""] && (
          <Alert
            message={errors[""]}
            type="error"
            showIcon
            className={styles.formError}
          />
        )}

        {/* Renderizar campos con layout */}
        <div className={containerClassName}>
          {fields.map((field, index) => {
            const fieldWithProps = {
              ...field,
              value: values[field.name],
              error: errors[field.name],
              submitted,
              onChange: handleFieldChange,
              onBlur: handleFieldBlur,
              getFormValues,
            };

            // Obtener layout específico del campo
            const fieldClassName = getFieldClassName(field.name);

            return (
              <Form.Item
                key={field.name}
                className={`${styles.fieldItem} ${fieldClassName}`}
              >
                {renderField(fieldWithProps, index)}
              </Form.Item>
            );
          })}
        </div>

        {/* Botón de envío por defecto si se proporciona onSubmit */}
        {onSubmit && !children && (
          <Form.Item className={styles.submitContainer}>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={isSubmitting}
                disabled={disabled}
              >
                Submit
              </Button>
              {/* Botón de reset opcional */}
              <Button
                onClick={() => {
                  const resetValues = getDefaultValuesFromFields(fields, {});
                  setValues(resetValues);
                  setContextFormValues(resetValues);
                  setErrors({});
                  setSubmitted(false);
                }}
                disabled={disabled || isSubmitting}
              >
                Reset
              </Button>
            </Space>
          </Form.Item>
        )}

        {/* Contenido personalizado (botones, etc.) */}
        {children && (
          <Form.Item className={styles.submitContainer}>{children}</Form.Item>
        )}
      </Form>
    </div>
  );
}

// Componente exportado que envuelve con FormProvider
export function UIForm(props: UIFormProps & { children?: React.ReactNode }) {
  return (
    <FormProvider initialValues={props.initialValues}>
      <UIFormContent {...props} />
    </FormProvider>
  );
}

export default UIForm;
