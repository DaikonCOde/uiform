// Renderiza los campos de una sección: render default (encabezado + <Field> por name) o custom (render-prop). (ARCHITECTURE_V2.md §7)

import type { CSSProperties, ReactNode } from "react";

import { useSection } from "../../hooks/useSection";
import type { Field as FieldType } from "../../store/types";
import { Field } from "./Field";

/** Props de <FormSection>: el id de la sección + estilos opcionales y children (default o render-prop). */
export interface FormSectionProps {
  id: string;
  className?: string;
  style?: CSSProperties;
  // Render-prop: recibe los Field de la sección y el consumidor arma su propio layout.
  children?: (fields: FieldType[]) => ReactNode;
}

/** Renderiza una sección por id; con children (render-prop) delega el layout al consumidor. */
export function FormSection({ id, className, style, children }: FormSectionProps) {
  const { section, fields } = useSection(id);

  // Sección inexistente → no renderizamos nada (el warn ya lo dio useSection).
  if (!section) return null;

  // Render-prop: el consumidor recibe los fields y arma el layout custom (grid, columnas, etc.).
  if (typeof children === "function") {
    return (
      <div className={className} style={style}>
        {children(fields)}
      </div>
    );
  }

  // Render default: encabezado opcional (title/description) + un <Field> por cada name, en orden.
  return (
    <div className={className} style={style}>
      {section.title && <h3>{section.title}</h3>}
      {section.description && <p>{section.description}</p>}
      {section.fieldNames.map((name) => (
        <Field key={name} name={name} />
      ))}
    </div>
  );
}
