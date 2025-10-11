/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * setDeep - Asigna un valor en un objeto dado un path (ej: "user.name" o "items[0].price")
 */
export function setDeep(obj: any, path: string, value: any): void {
  const keys = path.replace(/\[(\d+)\]/g, ".$1").split("."); // convierte items[0].name -> ["items","0","name"]

  let current = obj;
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];

    if (i === keys.length - 1) {
      // Último nivel → asignar valor
      current[key] = value;
    } else {
      // Si no existe, inicializar objeto o array según la clave
      if (!(key in current)) {
        current[key] = isNaN(Number(keys[i + 1])) ? {} : [];
      }
      current = current[key];
    }
  }
}