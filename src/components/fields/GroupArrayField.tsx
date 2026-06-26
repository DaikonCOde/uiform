/* eslint-disable @typescript-eslint/no-explicit-any */
// Controlador de group-array: se suscribe SOLO al LENGTH del array (estructura). Cada campo de cada item
// se renderiza como <Field name="parent.i.child"> (granular) → un cambio profundo NO re-renderiza a los
// otros items ni a los hermanos. El contenedor re-renderiza SOLO al agregar/quitar items. (fix re-render)

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, Button, Space, Popconfirm } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";

import { FieldLabel } from "../commons";
import { useFormStore, useFormStoreApi } from "../../context/FormStoreContext";
import { getPath } from "../../store/paths";
import { Field } from "../form/Field";
import styles from "./Field.module.css";

interface GroupArrayFieldProps {
  name: string; // path del array ("contactos")
  field: any; // metadata del motor (label, required, description, fields[], + config vía ui:options)
}

/** Valor por defecto de un item nuevo según el inputType del hijo. */
function defaultFor(inputType: string): any {
  switch (inputType) {
    case "text":
    case "email":
    case "textarea":
      return "";
    case "checkbox":
    case "boolean":
      return false;
    case "fieldset":
      return {};
    case "group-array":
      return [];
    default:
      return null;
  }
}

export function GroupArrayField({ name, field }: GroupArrayFieldProps) {
  const childFields: any[] = Array.isArray(field?.fields) ? field.fields : [];
  // Config del array vía ui:options (el motor la splatea sobre el field). Defaults en español.
  const minItems: number = field?.minItems ?? 0;
  const maxItems: number | undefined = field?.maxItems;
  const addButtonText: string = field?.addButtonText ?? "Agregar";
  const deleteButtonText: string = field?.deleteButtonText ?? "Eliminar";
  const confirmDelete: boolean = field?.confirmDelete ?? true;
  const store = useFormStoreApi();

  // Suscripción SOLO al length del array: re-render al add/remove, NO por cambios profundos de un campo.
  const length = useFormStore((s) => {
    const arr = getPath(s.values, name);
    return Array.isArray(arr) ? arr.length : 0;
  });

  // Keys sintéticas estables (no derivadas de campos editables): evitan remontar filas al editar.
  const uid = useRef(0);
  const makeKey = useCallback(() => `ga-${uid.current++}`, []);
  const [keys, setKeys] = useState<string[]>(() => Array.from({ length }, makeKey));

  // Resync ante cambios EXTERNOS del length (reset/hydrate); add/remove ya mantienen las keys en sync.
  useEffect(() => {
    setKeys((prev) => {
      if (prev.length === length) return prev;
      if (prev.length < length) {
        return [...prev, ...Array.from({ length: length - prev.length }, makeKey)];
      }
      return prev.slice(0, length);
    });
  }, [length, makeKey]);

  const addItem = useCallback(() => {
    const arr = getPath(store.getState().values, name);
    const current = Array.isArray(arr) ? arr : [];
    const item = childFields.reduce((acc: any, f: any) => {
      acc[f.name] = f.default ?? defaultFor(f.inputType);
      return acc;
    }, {});
    store.getState().setValue(name, [...current, item]);
    setKeys((k) => [...k, makeKey()]);
  }, [name, store, childFields, makeKey]);

  const removeItem = useCallback(
    (index: number) => {
      const arr = getPath(store.getState().values, name);
      const current = Array.isArray(arr) ? arr : [];
      store.getState().setValue(name, current.filter((_: any, i: number) => i !== index));
      setKeys((k) => k.filter((_, i) => i !== index));
    },
    [name, store],
  );

  if (field?.isVisible === false) return null;

  const canAddMore = !maxItems || length < maxItems;
  const canRemove = length > minItems;

  return (
    <div className={styles.field}>
      <FieldLabel label={field?.label} required={field?.required} description={field?.description} />

      <div className={styles.arrayContainer}>
        {length === 0 ? (
          <div className={styles.arrayEmpty}>
            Sin elementos. Hacé clic en &quot;{addButtonText}&quot; para empezar.
          </div>
        ) : (
          <Space direction="vertical" style={{ width: "100%" }}>
            {Array.from({ length }).map((_, index) => {
              const deleteBtn = (
                <Button type="text" danger size="small" icon={<DeleteOutlined />}>
                  {deleteButtonText}
                </Button>
              );
              return (
                <Card
                  key={keys[index] ?? `${name}-${index}`}
                  size="small"
                  title={
                    <div className={styles.arrayItemHeader}>
                      <span>Elemento {index + 1}</span>
                      {canRemove &&
                        (confirmDelete ? (
                          <Popconfirm
                            title="¿Seguro que querés eliminar este elemento?"
                            onConfirm={() => removeItem(index)}
                            okText="Sí"
                            cancelText="No"
                          >
                            {deleteBtn}
                          </Popconfirm>
                        ) : (
                          <span onClick={() => removeItem(index)}>{deleteBtn}</span>
                        ))}
                    </div>
                  }
                >
                  <div className={styles.arrayItemFields}>
                    {childFields.map((child) => (
                      // Cada campo del item es un <Field> con path completo → suscripción granular propia.
                      <Field key={child.name} name={`${name}.${index}.${child.name}`} />
                    ))}
                  </div>
                </Card>
              );
            })}
          </Space>
        )}

        {canAddMore && (
          <Button type="dashed" onClick={addItem} icon={<PlusOutlined />} className={styles.arrayAddButton}>
            {addButtonText}
          </Button>
        )}
      </div>
    </div>
  );
}
