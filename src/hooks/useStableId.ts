// ID único y estable por instancia, compatible con React 17 Y 18.
//
// `useId` es de React 18. La lib promete React 17 en peerDependencies, así que NO podemos llamarlo
// directo (en React 17 es `undefined` → "useId is not a function"). Elegimos UNA sola vez, al cargar el
// módulo: si el runtime tiene `useId` lo usamos (SSR-safe); si no, caemos a un contador + useRef. La
// versión de React es fija durante toda la app, así que la elección es estable y SIEMPRE se llama el
// mismo hook en cada render → no viola las reglas de hooks.

import * as React from "react";

let fallbackCounter = 0;

// Fallback para React 17: id incremental por instancia, fijado en el primer render con useRef.
function useFallbackId(): string {
  const ref = React.useRef<string | null>(null);
  if (ref.current === null) {
    ref.current = `uiform-${(fallbackCounter++).toString(36)}`;
  }
  return ref.current;
}

// Lectura por PROPIEDAD (no `import { useId }`): en React 17 da `undefined` sin romper el import.
const reactUseId = (React as { useId?: () => string }).useId;

export const useStableId: () => string =
  typeof reactUseId === "function" ? reactUseId : useFallbackId;
