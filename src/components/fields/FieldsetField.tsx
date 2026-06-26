/* eslint-disable @typescript-eslint/no-explicit-any */
// Controlador de fieldset: renderiza un Card + cada hijo como <Field name="parent.child"> (granular).
// NO se suscribe al valor del objeto → un cambio en un hijo NO re-renderiza a sus hermanos. (fix re-render)

import { Card } from "antd";
import { FieldLabel } from "../commons";
import { Field } from "../form/Field";
import styles from "./Field.module.css";

interface FieldsetFieldProps {
  name: string; // path del fieldset ("direccion")
  field: any; // metadata del motor (label, required, description, fields[])
  size?: "default" | "small";
}

export function FieldsetField({ name, field, size = "default" }: FieldsetFieldProps) {
  if (field?.isVisible === false) return null;

  const children: any[] = Array.isArray(field?.fields) ? field.fields : [];
  const title = field?.label ? (
    <FieldLabel label={field.label} required={field.required} description={field.description} />
  ) : undefined;

  return (
    <div className={styles.field}>
      <Card title={title} size={size} className={styles.fieldsetCard}>
        <div className={styles.fieldsetContainer}>
          {children.map((child) => (
            // Cada hijo es un <Field> con path completo: se suscribe SOLO a su propio slice.
            <Field key={child.name} name={`${name}.${child.name}`} />
          ))}
        </div>
      </Card>
    </div>
  );
}
