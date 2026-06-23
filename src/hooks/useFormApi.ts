// API del formulario: acciones estables (submit/reset/validate) + flags suscritos por slice. (ARCHITECTURE_V2.md §5)

import { useFormStore } from "../context/FormStoreContext";
import type { FormErrors, FormState } from "../store/types";

/** Acciones del form + flags reactivos (isSubmitting/isValid). */
export interface UseFormApiResult {
  submit: () => Promise<void>;
  reset: (values?: Record<string, unknown>) => void;
  validate: () => FormErrors;
  isSubmitting: boolean;
  isValid: boolean;
}

/**
 * Expone las acciones del store (refs estables) y dos flags suscritos a su propio slice:
 * isSubmitting (s.isSubmitting) e isValid (no hay claves en s.errors).
 */
export function useFormApi(): UseFormApiResult {
  const submit = useFormStore((s) => s.submit);
  const reset = useFormStore((s) => s.reset);
  const validate = useFormStore((s) => s.validate);

  const isSubmitting = useFormStore((s: FormState) => s.isSubmitting);
  // isValid deriva de errors: sin claves = válido. Re-renderiza solo cuando ese booleano cambia.
  const isValid = useFormStore((s: FormState) => Object.keys(s.errors).length === 0);

  return { submit, reset, validate, isSubmitting, isValid };
}
