// Compila el uiSchema (RJSF) a x-jsf-* y lo mergea sobre un clon del schema interno del motor.
// Única vía pública de presentación: el consumidor escribe schema + uiSchema, nunca x-jsf-* a mano. (ARCHITECTURE_V2.md §1 ter)

import type { JsfObjectSchema } from "@laus/json-schema-form";
import type { UiSchema, UiFieldOptions, UiSection } from "./types";

/**
 * Compila un uiSchema (RJSF) bajándolo a x-jsf-* sobre un clon del schema.
 * @param schema  JSON Schema puro (contrato de datos). Nunca se muta.
 * @param uiSchema  Documento de presentación (ui:*). Si falta, se devuelve el clon tal cual.
 * @returns Clon del schema con x-jsf-presentation / x-jsf-order / x-jsf-sections listos para createHeadlessForm.
 */
export function compileUiSchema(
  schema: JsfObjectSchema,
  uiSchema?: UiSchema,
  // Mensajes de error globales (i18n): { [tipoDeValidación]: mensaje }. Se inyectan en TODOS los campos.
  defaultErrorMessages?: Record<string, string>,
): JsfObjectSchema {
  // Clon profundo: la inmutabilidad del input es invariante del compilador. (ARCHITECTURE_V2.md §1 ter, decisión #1)
  const out = structuredClone(schema);

  const hasUi = !!uiSchema && Object.keys(uiSchema).length > 0;
  const hasDefaults =
    !!defaultErrorMessages && Object.keys(defaultErrorMessages).length > 0;
  if (!hasUi && !hasDefaults) return out;

  if (hasUi) {
    // Raíz: secciones y orden son presentación pura → viven en el uiSchema y bajan a x-jsf-*. (§1 ter, decisión #2)
    if (uiSchema!["ui:sections"] !== undefined) {
      // x-jsf-sections es desconocido para el motor (lo ignora); lo lee luego resolveSections (§6).
      (out as Record<string, unknown>)["x-jsf-sections"] =
        uiSchema!["ui:sections"] as UiSection[];
    }
    if (uiSchema!["ui:order"] !== undefined) {
      out["x-jsf-order"] = uiSchema!["ui:order"] as string[];
    }

    const properties = out.properties;

    // Por campo: cada clave no-raíz del uiSchema debe corresponder a una property del schema.
    for (const key of Object.keys(uiSchema!)) {
      if (key === "ui:sections" || key === "ui:order") continue;

      if (!properties || !(key in properties)) {
        // Robustez: referencia colgada → avisar y seguir, nunca romper el compilado. (§1 ter robustez)
        console.warn(
          `[compileUiSchema] uiSchema referencia "${key}", que no existe en schema.properties. Se ignora.`,
        );
        continue;
      }

      const fieldUi = uiSchema![key] as UiFieldOptions | undefined;
      if (!fieldUi) continue;

      compileField(properties[key] as JsfObjectSchema, fieldUi);
    }
  }

  // Mensajes globales: se inyectan en cada property (incl. anidadas); los por-campo (ui:errorMessages) ganan.
  if (hasDefaults) {
    injectDefaultErrorMessages(out.properties, defaultErrorMessages!);
  }

  return out;
}

/** Inyecta mensajes de error globales (i18n) en el x-jsf-errorMessage de cada property; los por-campo ganan. */
function injectDefaultErrorMessages(
  properties: Record<string, any> | undefined,
  defaults: Record<string, string>,
): void {
  if (!properties) return;
  for (const key of Object.keys(properties)) {
    const prop = properties[key];
    if (typeof prop !== "object" || prop === null) continue;
    // `{ ...defaults, ...existing }` → lo por-campo (ya seteado por compileField) pisa al global.
    prop["x-jsf-errorMessage"] = { ...defaults, ...(prop["x-jsf-errorMessage"] ?? {}) };
    if (prop.properties) injectDefaultErrorMessages(prop.properties, defaults); // fieldset
    if (prop.items?.properties) injectDefaultErrorMessages(prop.items.properties, defaults); // group-array
  }
}

/** Baja las claves ui:* de un campo a su x-jsf-presentation (con uiSchema teniendo precedencia) y recurse en fieldsets. */
function compileField(prop: JsfObjectSchema, ui: UiFieldOptions): void {
  // El motor splatea TODO x-jsf-presentation sobre el field → metemos acá toda la presentación. (§1 ter)
  const presentation: Record<string, unknown> = {
    ...(prop["x-jsf-presentation"] ?? {}),
  };

  // ui:options PRIMERO (escape hatch): las claves dedicadas de abajo tienen precedencia y no se dejan
  // pisar (p. ej. ui:options.inputType no puede sobrescribir a ui:widget). (fix de revisión)
  if (ui["ui:options"]) {
    for (const [k, v] of Object.entries(ui["ui:options"])) {
      presentation[k] = v;
    }
  }

  if (ui["ui:widget"] !== undefined) presentation.inputType = ui["ui:widget"];
  if (ui["ui:placeholder"] !== undefined) presentation.placeholder = ui["ui:placeholder"];
  // React usa `autoFocus` (camelCase); el field se splatea como prop → debe ir camelCase. (fix de revisión)
  if (ui["ui:autofocus"] !== undefined) presentation.autoFocus = ui["ui:autofocus"];
  if (ui["ui:disabled"] !== undefined) presentation.disabled = ui["ui:disabled"];
  if (ui["ui:description"] !== undefined) presentation.description = ui["ui:description"];

  if (Object.keys(presentation).length > 0) {
    prop["x-jsf-presentation"] = presentation;
  }

  // ui:title sobreescribe el label (semántica RJSF) → mapea al title de la property, no a presentation.
  if (ui["ui:title"] !== undefined) prop.title = ui["ui:title"];

  // ui:order ordena los hijos de un fieldset → x-jsf-order de la property objeto.
  if (ui["ui:order"] !== undefined) prop["x-jsf-order"] = ui["ui:order"];

  // ui:errorMessages → x-jsf-errorMessage del campo: mensajes custom por tipo de validación
  // (required/format/minimum/...). El motor los aplica en form.ts:applyCustomErrorMessages. (fix casos de uso)
  if (ui["ui:errorMessages"]) {
    prop["x-jsf-errorMessage"] = {
      ...((prop["x-jsf-errorMessage"] as Record<string, string>) ?? {}),
      ...(ui["ui:errorMessages"] as Record<string, string>),
    };
  }

  // Recursión en contenedores: las claves no-ui:* del entry son names de hijos con sus UiFieldOptions. (§1 ter punto 3)
  // fieldset → prop.properties; group-array → prop.items.properties. (fix de revisión: items de arrays)
  const childProps =
    prop.properties ??
    ((prop as { items?: { properties?: Record<string, unknown> } }).items?.properties as
      | Record<string, JsfObjectSchema>
      | undefined);
  if (childProps) {
    for (const childKey of Object.keys(ui)) {
      if (childKey.startsWith("ui:")) continue;
      if (!(childKey in childProps)) continue; // hijo desconocido: lo ignoramos silenciosamente (igual que RJSF)

      const childUi = ui[childKey] as UiFieldOptions | undefined;
      if (childUi && typeof childUi === "object") {
        compileField(childProps[childKey] as JsfObjectSchema, childUi);
      }
    }
  }
}
