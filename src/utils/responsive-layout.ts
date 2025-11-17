import React from "react";
import {
  getFieldLayoutInfo,
} from "@laus/json-schema-form";

/**
 * Genera CSS responsivo para el contenedor del formulario
 */
export function generateContainerResponsiveCSS(
  containerLayout: any,
  className: string
): string {
  if (!containerLayout) return "";
  const { responsive, columns, gap } = containerLayout;

  let css = "";

  // Base styles (always applied)
  css += `.${className} {
  display: grid;
  gap: ${gap ?? "16px"};
`;

  // If no responsive config, use the columns value
  if (!responsive) {
    css += `  grid-template-columns: repeat(${columns || 1}, 1fr);\n}\n`;
    return css;
  }

  // Close the base style and add responsive grid-template-columns
  css += "}\n";

  // Breakpoints in mobile-first order
  const breakpoints = {
    sm: "0px", // Base mobile (no media query)
    md: "768px",
    lg: "1024px",
    xl: "1280px",
  };

  // Generate mobile-first CSS
  Object.entries(breakpoints).forEach(([breakpoint, minWidth]) => {
    const cols = responsive[breakpoint as keyof typeof responsive];

    if (cols !== undefined) {
      if (breakpoint === "sm" || minWidth === "0px") {
        // Base style for mobile (no media query)
        css += `.${className} {
  grid-template-columns: repeat(${cols}, 1fr);
}\n`;
      } else {
        // Media query for larger breakpoints
        css += `@media (min-width: ${minWidth}) {
  .${className} {
    grid-template-columns: repeat(${cols}, 1fr);
  }
}\n`;
      }
    }
  });

  return css;
}

/**
 * Genera CSS responsivo para un campo específico con colSpan responsivo
 */
export function generateFieldResponsiveCSS(
  field: any,
  className: string
): string {
  const fieldLayout = getFieldLayoutInfo(field);

  if (!fieldLayout?.colSpan || typeof fieldLayout.colSpan !== "object") {
    return "";
  }

  const colSpan = fieldLayout.colSpan;
  let css = "";

  // Breakpoints in mobile-first order
  const breakpoints = {
    sm: "0px", // Base mobile (no media query)
    md: "768px",
    lg: "1024px",
    xl: "1280px",
  };

  // Generate mobile-first CSS
  Object.entries(breakpoints).forEach(([breakpoint, minWidth]) => {
    const span = colSpan[breakpoint as keyof typeof colSpan];

    if (span !== undefined) {
      if (breakpoint === "sm" || minWidth === "0px") {
        // Base style for mobile (no media query)
        css += `.${className} {
  grid-column: span ${span};
}\n`;
      } else {
        // Media query for larger breakpoints
        css += `@media (min-width: ${minWidth}) {
  .${className} {
    grid-column: span ${span};
  }
}\n`;
      }
    }
  });

  return css;
}

/**
 * Genera CSS responsivo para todos los campos del formulario
 */
export function generateFormResponsiveCSS(
  fields: any[],
  containerLayout: any,
  baseClassName: string = "ui-form"
): string {
  let css = "";

  // CSS del contenedor
  const containerCSS = generateContainerResponsiveCSS(
    containerLayout,
    `${baseClassName}-container`
  );
  if (containerCSS) {
    css += containerCSS + "\n";
  }

  // CSS de campos individuales
  fields.forEach((field) => {
    const fieldCSS = generateFieldResponsiveCSS(
      field,
      `${baseClassName}-field-${field.name}`
    );
    if (fieldCSS) {
      css += fieldCSS + "\n";
    }
  });

  return css;
}

/**
 * Inyecta CSS responsivo en el DOM usando un style tag
 */
export function injectResponsiveCSS(
  css: string,
  id: string = "ui-form-responsive-css"
): void {
  // Remover el style tag anterior si existe
  const existingStyle = document.getElementById(id);
  if (existingStyle) {
    existingStyle.remove();
  }

  if (!css.trim()) {
    return;
  }

  // Crear y agregar el nuevo style tag
  const style = document.createElement("style");
  style.id = id;
  style.textContent = css;
  document.head.appendChild(style);
}

/**
 * Limpia el CSS responsivo inyectado
 */
export function cleanupResponsiveCSS(
  id: string = "ui-form-responsive-css"
): void {
  const existingStyle = document.getElementById(id);
  if (existingStyle) {
    existingStyle.remove();
  }
}

/**
 * Versión alternativa más directa de generación de CSS
 */
export function generateDirectResponsiveCSS(
  containerLayout: any,
  className: string
): string {
  if (!containerLayout?.responsive) return "";

  const { responsive } = containerLayout;
  let css = "";

  // Breakpoints por defecto (mobile-first)
  const breakpoints = {
    sm: "0px", // Móvil base (sin media query)
    md: "768px", // Tablet
    lg: "1024px", // Desktop
    xl: "1280px", // Desktop grande
  };

  // Ordenar breakpoints por tamaño
  const sortedBreakpoints = Object.entries(responsive).sort(([a], [b]) => {
    const order = { sm: 0, md: 1, lg: 2, xl: 3 };
    return order[a as keyof typeof order] - order[b as keyof typeof order];
  });

  // Generar CSS mobile-first
  sortedBreakpoints.forEach(([breakpoint, cols]) => {
    const minWidth = breakpoints[breakpoint as keyof typeof breakpoints];

    if (breakpoint === "sm" || minWidth === "0px") {
      // Para móvil, sin media query (base CSS)
      css += `.${className} {
  grid-template-columns: repeat(${cols}, 1fr) !important;
}\n`;
    } else {
      // Para otros breakpoints, usar min-width
      css += `@media (min-width: ${minWidth}) {
  .${className} {
    grid-template-columns: repeat(${cols}, 1fr) !important;
  }
}\n`;
    }
  });

  return css;
}

/**
 * Hook para manejar CSS responsivo automáticamente
 */
export function useResponsiveCSS(
  fields: any[],
  containerLayout: any,
  formId: string
) {
  // Generate responsive CSS for the form
  let css = generateFormResponsiveCSS(
    fields,
    containerLayout,
    `ui-form-${formId}`
  );

  // Fallback to direct method if needed
  if (!css && containerLayout?.responsive) {
    css = generateDirectResponsiveCSS(
      containerLayout,
      `ui-form-${formId}-container`
    );
  }

  const styleId = `ui-form-${formId}-responsive`;

  // Inject CSS when data changes
  React.useEffect(() => {
    injectResponsiveCSS(css, styleId);

    // Cleanup on unmount
    return () => cleanupResponsiveCSS(styleId);
  }, [css, styleId]);

  return {
    containerClassName: `ui-form-${formId}-container`,
    getFieldClassName: (fieldName: string) =>
      `ui-form-${formId}-field-${fieldName}`,
  };
}
