// Renderiza los campos de una sección: render default (encabezado + grid de <Field>) o custom (render-prop). (ARCHITECTURE_V2.md §7)

import type { CSSProperties, ReactNode } from "react";

import { useSection } from "../../hooks/useSection";
import { useFieldMeta } from "../../hooks/useField";
import { useFormStore } from "../../context/FormStoreContext";
import { useGridCSS } from "../../hooks/useGridCSS";
import type { Field as FieldType } from "../../store/types";
import { Field } from "./Field";

/**
 * Celda del grid: se suscribe SOLO a la visibilidad del campo (useFieldMeta → metadata, no value, mantiene
 * la granularidad). Si el campo está oculto (isVisible === false, p. ej. por una condición if/then/else),
 * NO renderiza el wrapper → la celda no queda vacía ocupando su colSpan en el grid. (fix celda fantasma)
 */
function GridFieldCell({ name, className }: { name: string; className: string }) {
  const field = useFieldMeta(name);
  if (field?.isVisible === false) return null;
  return (
    <div className={className}>
      <Field name={name} />
    </div>
  );
}

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
  // Layout efectivo: el de la sección gana; si no, el global del form. (grid responsivo)
  const globalLayout = useFormStore((s) => s.formLayout);
  const layout = section?.layout ?? globalLayout ?? null;
  // colSpan estático por campo (ref estable, se construye 1 vez): el grid conserva el colSpan de un campo
  // condicional aunque el motor le borre field.layout al ocultarlo. (fix colSpan de campo oculto)
  const fieldColSpans = useFormStore((s) => s.fieldColSpans);
  const { containerClassName, getFieldClassName } = useGridCSS(layout, fields, fieldColSpans);

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

  // Render default: encabezado opcional + grid. Con layout, los campos son hijos del grid y cada uno
  // lleva su clase de colSpan; sin layout, se apilan sin contenedor de grid.
  return (
    <div className={className} style={style}>
      {section.title && <h3>{section.title}</h3>}
      {section.description && <p>{section.description}</p>}
      <div className={layout ? containerClassName : undefined}>
        {section.fieldNames.map((name) =>
          layout ? (
            <GridFieldCell key={name} name={name} className={getFieldClassName(name)} />
          ) : (
            <Field key={name} name={name} />
          ),
        )}
      </div>
    </div>
  );
}
