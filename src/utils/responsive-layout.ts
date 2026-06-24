/* eslint-disable @typescript-eslint/no-explicit-any */
// Generadores de CSS Grid responsivo (mobile-first) + inyección/limpieza en el DOM.
// Una sola vía: lo usan FieldsetField (grid interno) y el hook useResponsiveCSS (grid raíz). (ROADMAP_V2.md §6)

import { getFieldLayoutInfo } from "@laus/json-schema-form";

const BREAKPOINTS = {
  sm: "0px", // móvil base (sin media query)
  md: "768px",
  lg: "1024px",
  xl: "1280px",
};

// Sanitiza a entero >= 1 (input del consumidor: 0/negativo/no-entero → 1, evita CSS basura). (revisión grid)
function posInt(n: unknown): number {
  const v = Math.floor(Number(n));
  return Number.isFinite(v) && v >= 1 ? v : 1;
}

/** Genera el CSS Grid del contenedor (columnas fijas o responsivas) para una clase dada. */
export function generateContainerResponsiveCSS(
  containerLayout: any,
  className: string,
): string {
  if (!containerLayout) return "";
  const { responsive, columns, gap } = containerLayout;

  let css = `.${className} {\n  display: grid;\n  gap: ${gap ?? "16px"};\n`;

  // Sin config responsiva → columnas fijas (1 por default).
  if (!responsive) {
    css += `  grid-template-columns: repeat(${posInt(columns)}, 1fr);\n}\n`;
    return css;
  }

  css += "}\n";

  // Mobile-first: la sm va sin media query; el resto con min-width. Si NO se especifica `sm` pero hay
  // responsive, la base cae a 1 columna (sin esto el móvil quedaba sin grid-template-columns). (revisión grid)
  Object.entries(BREAKPOINTS).forEach(([breakpoint, minWidth]) => {
    const raw = responsive[breakpoint as keyof typeof responsive];
    const cols = raw === undefined ? (breakpoint === "sm" ? 1 : undefined) : raw;
    if (cols === undefined) return;
    if (breakpoint === "sm" || minWidth === "0px") {
      css += `.${className} {\n  grid-template-columns: repeat(${posInt(cols)}, 1fr);\n}\n`;
    } else {
      css += `@media (min-width: ${minWidth}) {\n  .${className} {\n    grid-template-columns: repeat(${posInt(cols)}, 1fr);\n  }\n}\n`;
    }
  });

  return css;
}

/** Genera el `grid-column: span` de un campo según su colSpan (número o responsivo). */
export function generateFieldResponsiveCSS(field: any, className: string): string {
  const fieldLayout = getFieldLayoutInfo(field);
  if (!fieldLayout?.colSpan) return "";

  const colSpan = fieldLayout.colSpan;

  if (typeof colSpan === "number") {
    return `.${className} {\n  grid-column: span ${posInt(colSpan)};\n}\n`;
  }
  if (typeof colSpan !== "object") return "";

  let css = "";
  Object.entries(BREAKPOINTS).forEach(([breakpoint, minWidth]) => {
    const span = (colSpan as any)[breakpoint];
    if (span === undefined) return;
    if (breakpoint === "sm" || minWidth === "0px") {
      css += `.${className} {\n  grid-column: span ${posInt(span)};\n}\n`;
    } else {
      css += `@media (min-width: ${minWidth}) {\n  .${className} {\n    grid-column: span ${posInt(span)};\n  }\n}\n`;
    }
  });
  return css;
}

/** Inyecta (o reemplaza) un <style> con el CSS dado. SSR-safe: el caller debe llamarla client-side. */
export function injectResponsiveCSS(css: string, id: string): void {
  if (typeof document === "undefined") return;
  document.getElementById(id)?.remove();
  if (!css.trim()) return;

  const style = document.createElement("style");
  style.id = id;
  style.textContent = css;
  document.head.appendChild(style);
}

/** Quita el <style> inyectado (cleanup al desmontar). */
export function cleanupResponsiveCSS(id: string): void {
  if (typeof document === "undefined") return;
  document.getElementById(id)?.remove();
}
