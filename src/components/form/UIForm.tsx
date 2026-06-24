// Atajo de conveniencia: azúcar sobre FormProvider + secciones + barra de submit. (ARCHITECTURE_V2.md §7.2)

import type { CSSProperties, ReactNode } from "react";
import { Button, Space } from "antd";

import { FormProvider } from "../../context/FormStoreContext";
import type { FormProviderProps } from "../../context/FormStoreContext";
import { useFormApi } from "../../hooks/useFormApi";
import { useSections } from "../../hooks/useSections";
import { FormSection } from "./FormSection";
import { SubmitButton } from "./SubmitButton";
import styles from "./UIForm.module.css";

/** Props del atajo: los dos documentos + opciones del store, más estilos y children opcionales. */
export interface UIFormProps extends Omit<FormProviderProps, "children"> {
  className?: string;
  style?: CSSProperties;
  // children reemplaza la barra de submit por defecto (botones custom). Si se omite, usamos DefaultSubmitBar.
  children?: ReactNode;
}

/** Barra por defecto: Enviar + Reset. Se muestra cuando UIForm no recibe children. */
function DefaultSubmitBar() {
  const { reset } = useFormApi();
  return (
    <Space className={styles.submitContainer}>
      <SubmitButton />
      <Button onClick={() => reset()}>Reset</Button>
    </Space>
  );
}

/** Cuerpo del form: renderiza las secciones (incl. __default__) y la barra de submit, dentro del Provider. */
function UIFormBody({
  className,
  style,
  children,
}: Pick<UIFormProps, "className" | "style" | "children">) {
  // NOTA: el grid responsivo a nivel raíz es post-v1 (no hay aún una API pública ui:layout para
  // configurarlo). Cuando se agregue, este cuerpo aplicará el grid sobre las secciones. (REVIEW_V2.md)
  const sections = useSections();

  return (
    <div className={className} style={style}>
      {sections.map((sec) => (
        <FormSection key={sec.id} id={sec.id} />
      ))}
      {children ?? <DefaultSubmitBar />}
    </div>
  );
}

/** `<UIForm schema uiSchema/>`: envuelve en FormProvider y arma el caso simple sin layout custom. */
export function UIForm({
  schema,
  uiSchema,
  className,
  style,
  children,
  ...opts
}: UIFormProps) {
  return (
    <FormProvider schema={schema} uiSchema={uiSchema} {...opts}>
      <UIFormBody className={className} style={style}>
        {children}
      </UIFormBody>
    </FormProvider>
  );
}

export default UIForm;
