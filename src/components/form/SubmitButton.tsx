// Botón de submit: dispara useFormApi().submit y refleja isSubmitting como loading. (ARCHITECTURE_V2.md §7)

import { Button } from "antd";
import type { ButtonProps } from "antd";
import type { ReactNode } from "react";

import { useFormApi } from "../../hooks/useFormApi";

/** Props del botón: children es el label (default "Enviar") + props extra de AntD Button. */
export interface SubmitButtonProps extends Omit<ButtonProps, "loading" | "onClick"> {
  children?: ReactNode;
}

/** Renderiza un Button primario que ejecuta submit() y se pone en loading durante el envío. */
export function SubmitButton({ children = "Enviar", ...buttonProps }: SubmitButtonProps) {
  const { submit, isSubmitting } = useFormApi();

  return (
    <Button
      type="primary"
      loading={isSubmitting}
      onClick={() => submit()}
      {...buttonProps}
    >
      {children}
    </Button>
  );
}

export default SubmitButton;
