// API del formulario: acciones estables (submit/reset/validate) + flags suscritos por slice. (ARCHITECTURE_V2.md §5)

import { useFormStore } from "../context/FormStoreContext";
import type { FormErrors, FormState } from "../store/types";

/** Acciones del form + flags reactivos (isSubmitting/isValid/submitError). */
export interface UseFormApiResult {
  submit: () => Promise<void>;
  reset: (values?: Record<string, unknown>) => void;
  validate: () => FormErrors;
  hydrate: (values: Record<string, unknown>) => void; // carga datos (edición async) sin pisar lo tocado
  isSubmitting: boolean;
  isValid: boolean;
  submitError: string | null; // error que tiró onSubmit; null si no hubo.
}

/**
 * Expone las acciones del store (refs estables) y los flags reactivos suscritos a su propio slice:
 * isSubmitting, isValid (no hay claves en s.errors) y submitError.
 */
export function useFormApi(): UseFormApiResult {
  const submit = useFormStore((s) => s.submit);
  const reset = useFormStore((s) => s.reset);
  const validate = useFormStore((s) => s.validate);
  const hydrate = useFormStore((s) => s.hydrate);

  const isSubmitting = useFormStore((s: FormState) => s.isSubmitting);
  // isValid deriva de errors: sin claves = válido. Re-renderiza solo cuando ese booleano cambia.
  const isValid = useFormStore((s: FormState) => Object.keys(s.errors).length === 0);
  const submitError = useFormStore((s: FormState) => s.submitError);

  return { submit, reset, validate, hydrate, isSubmitting, isValid, submitError };
}
