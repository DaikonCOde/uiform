/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Field } from "@laus/json-schema-form";
import { setDeep } from "./setDeep";

/*
📣 These utils will be part of json-schema-form soon
*/

// Transformaciones de valor UI → JSON por inputType (solo campos hoja).
const fieldValueTransform: Record<string, (val: any) => any> = {
  number: (val: any) => (val === "" ? "" : Number(val)),
  money: (val: any) => (val === "" ? "" : Number(val)),
  text: (val: any) => val,
};

// Sentinela interno para "omitir este campo del payload".
const OMIT = Symbol("omit");

/**
 * Transforma el valor de UN campo a su forma JSON, recursivamente para contenedores.
 * Devuelve OMIT cuando el campo no debe ir al payload (invisible, vacío o null/undefined).
 */
function transformFieldValue(field: any, value: any): any {
  const { inputType } = field;

  // Campos condicionales (invisibles) no van al payload.
  if (field.isVisible === false) return OMIT;

  // Contenedor: fieldset → objeto anidado.
  if (inputType === "fieldset" && Array.isArray(field.fields)) {
    const obj: Record<string, any> = {};
    field.fields.forEach((child: any) => {
      const childValue =
        value && typeof value === "object" ? value[child.name] : undefined;
      const transformed = transformFieldValue(child, childValue);
      if (transformed !== OMIT) obj[child.name] = transformed;
    });
    return obj;
  }

  // Contenedor: group-array → array de objetos anidados.
  if (inputType === "group-array" && Array.isArray(field.fields)) {
    const items = Array.isArray(value) ? value : [];
    return items.map((item: any) => {
      const obj: Record<string, any> = {};
      field.fields.forEach((child: any) => {
        const childValue =
          item && typeof item === "object" ? item[child.name] : undefined;
        const transformed = transformFieldValue(child, childValue);
        if (transformed !== OMIT) obj[child.name] = transformed;
      });
      return obj;
    });
  }

  // Hoja: null/undefined y "" se omiten; 0 y false se conservan.
  if (value === undefined || value === null) return OMIT;
  const transform = fieldValueTransform[inputType];
  const transformed = transform ? transform(value) : value;
  if (transformed === "") return OMIT;
  return transformed;
}

/**
 * Transforma los valores de la UI (controlados) al formato JSON Schema para validar/enviar.
 * Soporta `fieldset` (objeto anidado) y `group-array` (array de objetos) recursivamente.
 * Omite campos vacíos/invisibles para evitar errores de tipo en la validación.
 */
export function formValuesToJsonValues(values: Record<string, any>, fields: Field[]) {
  const jsonValues = {};

  fields.forEach((field: any) => {
    const transformed = transformFieldValue(field, values[field.name]);
    if (transformed !== OMIT) {
      setDeep(jsonValues, field.name, transformed);
    }
  });

  return jsonValues;
}

/**
 * Calcula los valores iniciales para los componentes controlados a partir del `default` del
 * schema o de `initialValues`. Soporta `fieldset` (objeto) y `group-array` (array) recursivamente.
 */
export function getDefaultValuesFromFields(
  fields: Field[],
  initialValues: Record<string, any> = {}
): Record<string, any> {
  return fields.reduce((acc: Record<string, any>, field: any) => {
    const provided = initialValues?.[field.name];

    if (field.inputType === "fieldset" && Array.isArray(field.fields)) {
      acc[field.name] = getDefaultValuesFromFields(field.fields, provided ?? {});
    } else if (field.inputType === "group-array" && Array.isArray(field.fields)) {
      const items = Array.isArray(provided)
        ? provided
        : Array.isArray(field.default)
        ? field.default
        : [];
      acc[field.name] = items.map((item: any) =>
        getDefaultValuesFromFields(field.fields, item ?? {})
      );
    } else {
      // `??` respeta valores falsy válidos (0, false, "").
      acc[field.name] = provided ?? field.default ?? "";
    }

    return acc;
  }, {});
}
