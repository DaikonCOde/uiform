/* eslint-disable @typescript-eslint/no-explicit-any */
// Lectura/escritura de valores anidados por dot-path con escritura inmutable (clona solo la rama tocada).

// Normaliza el path a segmentos: convierte items[0].price -> ["items","0","price"].
function toKeys(path: string): string[] {
  return path.replace(/\[(\d+)\]/g, ".$1").split(".");
}

// Lee un valor por path; devuelve undefined si algún segmento no existe (no lanza).
export function getPath(obj: Record<string, any>, path: string): any {
  const keys = toKeys(path);
  let current: any = obj;
  for (const key of keys) {
    if (current == null) return undefined;
    current = current[key];
  }
  return current;
}

// Escribe un valor por path de forma INMUTABLE: devuelve un objeto nuevo con la rama modificada clonada.
export function setPath(
  obj: Record<string, any>,
  path: string,
  value: any
): Record<string, any> {
  const keys = toKeys(path);

  // Clonamos cada nodo a lo largo del path (no usamos setDeep, que MUTA) para que la rama tocada
  // tenga refs nuevas y los hermanos conserven las suyas: el store Zustand suscribe por igualdad
  // referencial, así que mutar pisaría las suscripciones granulares de los hermanos.
  const root: any = clone(obj);
  let current: any = root;

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];

    if (i === keys.length - 1) {
      current[key] = value;
    } else {
      // Crea la rama faltante: array si el siguiente segmento es índice numérico, objeto si no.
      const child = current[key];
      current[key] =
        child == null
          ? isNaN(Number(keys[i + 1]))
            ? {}
            : []
          : clone(child);
      current = current[key];
    }
  }

  return root;
}

// Clon superficial preservando el tipo array/objeto del nodo.
function clone(node: any): any {
  return Array.isArray(node) ? [...node] : { ...node };
}
