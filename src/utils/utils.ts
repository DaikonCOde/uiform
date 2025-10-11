/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Field } from "@remoteoss/json-schema-form";
import { setDeep } from "./setDeep";


/*
📣 These utils will be part of json-schema-form soon
*/


export function formValuesToJsonValues(values: Record<string, any>, fields: Field[] ) {
  const fieldValueTransform: Record<string, (val: string) => any > = {
    number: (val: string) => (val === '' ? val : +val),
    text: (val: string) => val,
    // TODO support all types, including fieldsets
  };

  const jsonValues = {};

  fields.forEach(({ name, inputType, isVisible }) => {
    const formValue = values[name];
    const transformedValue = fieldValueTransform[inputType]?.(formValue) || formValue;

    if (transformedValue === '') {
      // Omit empty fields from the payload to avoid type error.
      // eg { team_size: "" } -> The value ("") must be a number.
    } else if (!isVisible) {
      // Omit conditional (invisible) fields to avoid error.
      // eg { has_pet: "no", pet_name: "" } -> The "team_size" is invalid
    } else {
      setDeep(jsonValues, name, transformedValue);
    }
  });

  return jsonValues;
}

/**
 * Set the initial values for the UI (controlled) components
 * based on the JSON Schema structure ("default" key) or arbitatry initialValues
 */
export function getDefaultValuesFromFields(fields: Field[], initialValues: Record<string, any>) {
  // TODO/BUG needs to support fieldsets recursively
  return fields.reduce((acc, cur) => {
    return {
      ...acc,
      [cur.name]: initialValues[cur.name] || cur.default || ""
    };
  }, {});
}
