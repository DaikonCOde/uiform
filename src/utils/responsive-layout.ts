import React from "react";
import {
  generateResponsiveCSS,
  getFieldLayoutInfo,
  generateResponsiveFieldCSS,
} from "@remoteoss/json-schema-form";

/**
 * Genera CSS responsivo para el contenedor del formulario
 */
export function generateContainerResponsiveCSS(
  containerLayout: any,
  className: string
): string {
  if (!containerLayout) return "";
  const { responsive, columns, gap } = containerLayout;

  const responsiveCSS = generateResponsiveCSS(containerLayout);

  if (!responsiveCSS) return "";

  // let processedCSS = "";
  let processedCSS = `.${className} {
      display: grid;
      gap: ${gap ?? 16};
    }`;

  // Procesar el CSS para mobile-first
  if (responsive?.sm) {
    // Agregar CSS base para móvil (sin media query)
    processedCSS += `.${className} {
      grid-template-columns: repeat(${responsive.sm}, 1fr);
    }\n`;
  }

  // Aplicar media queries para otros breakpoints
  const mediaQueryCSS = responsiveCSS.replace(
    /(@media[^{]+)\{([^}]*)\}/g,
    (match, mediaQuery, rules) => {
      // Solo agregar media queries que NO sean para sm (móvil)
      if (!mediaQuery.includes("640px")) {
        return `${mediaQuery} {
  .${className} {
    ${rules.trim()}
  }
}`;
      }
      return "";
    }
  );

  processedCSS += mediaQueryCSS;

  return processedCSS;
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

  const responsiveCSS = generateResponsiveFieldCSS(fieldLayout);
  if (!responsiveCSS) return "";

  // Aplicar el CSS al className específico
  return responsiveCSS.replace(/(@media[^{]+\{[^}]*\})/g, (match) => {
    return match.replace(/\{/, `{ .${className} `);
  });
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
  fields.forEach((field, index) => {
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

  const { responsive, columns, gap } = containerLayout;
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
  sortedBreakpoints.forEach(([breakpoint, cols], index) => {
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
  // Intentar primero con la API de la librería
  let css = generateFormResponsiveCSS(
    fields,
    containerLayout,
    `ui-form-${formId}`
  );

  // Si no hay CSS generado, usar método alternativo
  if (!css && containerLayout?.responsive) {
    css = generateDirectResponsiveCSS(
      containerLayout,
      `ui-form-${formId}-container`
    );
  }

  const styleId = `ui-form-${formId}-responsive`;

  // Inyectar CSS cuando cambian los datos
  React.useEffect(() => {
    injectResponsiveCSS(css, styleId);

    // Cleanup al desmontar el componente
    return () => cleanupResponsiveCSS(styleId);
  }, [css, styleId]);

  return {
    containerClassName: `ui-form-${formId}-container`,
    getFieldClassName: (fieldName: string) =>
      `ui-form-${formId}-field-${fieldName}`,
  };
}
