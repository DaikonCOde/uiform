/* eslint-disable @typescript-eslint/no-explicit-any */
// Mapa inputType → componente presentacional (clave de FIELD_COMPONENT_MAP) + Fallback para tipos desconocidos. (ARCHITECTURE_V2.md §7.1)

import {
  TextField,
  NumberField,
  TextareaField,
  SelectField,
  AutocompleteField,
  RadioField,
  CheckboxField,
  DateField,
  TimeField,
  FileField,
  FieldsetField,
  GroupArrayField,
} from "../fields";

// Mismo mapeo que el v1 useFieldRenderer: ui:widget/inputType resuelve acá el componente.
export const FIELD_COMPONENT_MAP = {
  text: TextField,
  email: TextField,
  hidden: TextField,
  number: NumberField,
  money: NumberField,
  textarea: TextareaField,
  select: SelectField,
  autocomplete: AutocompleteField,
  country: SelectField,
  radio: RadioField,
  checkbox: CheckboxField,
  date: DateField,
  time: TimeField,
  file: FileField,
  fieldset: FieldsetField,
  "group-array": GroupArrayField,
} as const;

export type FieldComponentMap = typeof FIELD_COMPONENT_MAP;

// inputTypes que son contenedores: renderizan hijos vía la prop renderField. (ARCHITECTURE_V2.md §13.1)
export const CONTAINER_INPUT_TYPES = new Set(["fieldset", "group-array"]);

/** Caja de aviso para un inputType sin componente registrado (no rompe el render). */
export function Fallback({ inputType, name }: { inputType?: string; name?: string }) {
  return (
    <div
      style={{
        padding: "8px",
        border: "1px dashed #ff4d4f",
        borderRadius: "4px",
        color: "#ff4d4f",
      }}
    >
      Unsupported field type: {String(inputType)} ({String(name)})
    </div>
  );
}
