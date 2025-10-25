import { useState } from "react";

import { createHeadlessForm, type Field, type JsfObjectSchema, type SchemaValue, type ValidationResult } from "@remoteoss/json-schema-form";
// import { formValuesToJsonValues, getDefaultValuesFromFields } from "./utils";

import { useFieldRenderer } from "../hooks/useFieldRenderer";
import { formValuesToJsonValues, getDefaultValuesFromFields } from "../utils/utils";

import locale from 'antd/locale/es_ES'
import 'dayjs/locale/es'
import { ConfigProvider } from "antd";

const jsonSchemaDemo: JsfObjectSchema = {
  "type": "object",
  "additionalProperties": false,
  "properties": {
    "tabs": {
      "title": "Hola este es mi primer  ",
      "description": "How many open tabs do you have?",
      "x-jsf-presentation": {
        "inputType": "text"
      },
      "minimum": 1,
      "maxLength": 10,
      "type": "string",
      "x-jsf-errorMessage": {
        "required": "Campo requerido",
        "maxLength": "Máximo 10 letras",
      }
      
    }
  },
  "required": [
    "tabs"
  ],

}

// Ya no necesitamos fieldsMap, usaremos useFieldRenderer

const initialValuesFromAPI = {
  tabs: 'Mega team'
}

export default function Demo() {
  const { fields, handleValidation } = createHeadlessForm(jsonSchemaDemo, {
    strictInputType: false, // so you don't need to pass presentation.inputType,
    initialValues: initialValuesFromAPI,
  });

  async function handleOnSubmit(jsonValues: ValidationResult) {
    alert(
      `Submitted with succes! ${JSON.stringify(
        {  jsonValues },
        null,
        3
      )}`
    );
    console.log("Submitted!", {  jsonValues });
  }

  return (
    <article>
      <h1>json-schema-form + React</h1>
      <p>This demo uses React without any other Form library.</p>
      <br />

      <SmartForm
        onSubmit={handleOnSubmit}
        // From JSF
        fields={fields}
        initialValues={initialValuesFromAPI}
        handleValidation={handleValidation}
        name='form'
      />
    </article>
  );
}

// ===============================
// ====== UI COMPONENTS ==========
// ===============================

type SmartFormType = {
  handleValidation: (value: SchemaValue) => ValidationResult
  initialValues: Record<string, any>
  fields: Field[]
  name: string
  onSubmit: (jsonValues: ValidationResult)=> Promise<void>
}

function SmartForm({ name, fields, initialValues, handleValidation, onSubmit }: SmartFormType) {
  const [values, setValues] = useState<Record<string, any>>(() =>
    getDefaultValuesFromFields(fields, initialValues)
  );
  const [errors, setErrors] = useState<Record<string, any>>({});
  const [submitted, setSubmitted] = useState(false);
  
  // Usar el hook para renderizar campos
  const { renderField } = useFieldRenderer({
    onFieldChange: (fieldName: string, value: any) => {
      const newValues = {
        ...values,
        [fieldName]: value
      };
      setValues(newValues);
      handleInternalValidation(newValues);
    }
  });

  function handleInternalValidation(valuesToValidate: Record<string, any>) {
    const valuesForJson = formValuesToJsonValues(valuesToValidate, fields);
    const { formErrors } = handleValidation(valuesForJson);

    setErrors(formErrors || {});

    return {
      errors: formErrors,
      jsonValues: valuesForJson
    };
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);

    const validation = handleInternalValidation(values);

    if (validation.errors) {
      return null;
    }

    return onSubmit(validation.jsonValues);
  }

  return (
      <ConfigProvider
        locale={locale}
      >
      <form name={name} onSubmit={handleSubmit} noValidate>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {fields?.map((field, index) => {
            const fieldWithProps = {
              ...field,
              value: values?.[field.name],
              error: errors[field.name],
              submitted,
              onChange: (fieldName: string, value: any) => {
                const newValues = {
                  ...values,
                  [fieldName]: value
                };
                setValues(newValues);
                handleInternalValidation(newValues);
              }
            };

            return renderField(fieldWithProps, index);
          })}
        </div>

        <button 
          type="submit" 
          style={{ 
            marginTop: '24px',
            padding: '8px 24px',
            backgroundColor: '#1890ff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Submit
        </button>
      </form>
    </ConfigProvider>
  );
}
