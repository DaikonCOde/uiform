/* eslint-disable @typescript-eslint/no-explicit-any */
// Genera e inyecta el CSS Grid de un contenedor (sección o form) y devuelve sus clases. SSR-safe. (grid responsivo)

import { useEffect, useMemo } from "react";

import { useStableId } from "./useStableId";
import {
  generateContainerResponsiveCSS,
  generateFieldResponsiveCSS,
  injectResponsiveCSS,
  cleanupResponsiveCSS,
} from "../utils/responsive-layout";
import type { Field, FormLayout } from "../store/types";

// Sanitiza un name a clase CSS válida: los paths anidados traen puntos ("address.calle" → "address-calle").
function cssSafe(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, "-");
}

/**
 * Arma el CSS Grid de `layout` (columnas + gap) y el `grid-column: span` de cada campo (según su colSpan),
 * lo inyecta en el <head> y devuelve la clase del contenedor + un resolvedor de clase por campo.
 * SSR-safe: la inyección vive en un useEffect (solo cliente). Si `layout` es null/undefined no inyecta
 * nada y las clases quedan inertes (el contenedor renderiza sin grid). `useStableId` (compat React 17/18)
 * evita colisiones entre instancias.
 */
export function useGridCSS(
  layout: FormLayout | null | undefined,
  fields: Field[],
  // colSpan ESTÁTICO por campo (del schema). Lo preferimos al field.layout del motor, que desaparece
  // cuando el campo se oculta → sin esto un campo condicional perdía su colSpan al mostrarse. (fix)
  colSpans?: Record<string, { colSpan?: unknown }>,
): { containerClassName: string; getFieldClassName: (name: string) => string } {
  const scope = `uiform-grid-${useStableId().replace(/:/g, "")}`;
  const containerClassName = `${scope}-container`;
  const getFieldClassName = (name: string) => `${scope}-field-${cssSafe(name)}`;

  // CSS estable: solo cambia si cambia el layout o el set de fields (estructura inmutable del store).
  const css = useMemo(() => {
    if (!layout) return "";
    let out = generateContainerResponsiveCSS(layout, containerClassName);
    for (const f of fields) {
      // colSpan estático del schema (persiste oculto/visible) con fallback al layout vivo del motor.
      const staticLayout = colSpans?.[f.name];
      const fieldForCss = staticLayout ? { ...f, layout: staticLayout } : f;
      out += generateFieldResponsiveCSS(fieldForCss, getFieldClassName(f.name));
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout, fields, containerClassName, colSpans]);

  useEffect(() => {
    const styleId = `${scope}-style`;
    injectResponsiveCSS(css, styleId); // injectResponsiveCSS ya guarda contra SSR (typeof document)
    return () => cleanupResponsiveCSS(styleId);
  }, [css, scope]);

  return { containerClassName, getFieldClassName };
}
