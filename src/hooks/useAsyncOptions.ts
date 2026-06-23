/* eslint-disable @typescript-eslint/no-explicit-any */
// Opciones async de un loader (Select/Autocomplete) desde el store: suscribe solo a async[loaderId] y recarga al cambiar deps. (ARCHITECTURE_V2.md §8)

import { useCallback, useEffect } from "react";
import { shallow } from "zustand/shallow";

import { useFormStore } from "../context/FormStoreContext";
import { useWatch } from "./useWatch";
import type { AsyncOptionState, FormState } from "../store/types";

// Estado por defecto cuando el loader aún no corrió o no hay loaderId: evita undefined en los consumidores.
const EMPTY: AsyncOptionState = { options: [], loading: false, error: null };

export interface UseAsyncOptions {
  options: any[];
  loading: boolean;
  error: string | null;
  reload: (search?: string) => void;
}

/**
 * Conecta un Select/Autocomplete al cache async del store.
 * @param loaderId  id del loader (de field.asyncOptions.id); si falta, queda inerte (sin side effects).
 * @param deps  names de campos que, al cambiar, fuerzan recarga (field.asyncOptions.dependencies).
 * @returns { options, loading, error, reload } — reload(search?) re-invoca el loader (búsqueda incluida).
 */
export function useAsyncOptions(
  loaderId?: string,
  deps?: string[],
): UseAsyncOptions {
  // Suscripción granular: solo a async[loaderId]; default EMPTY si ausente o sin loaderId. (ARCHITECTURE_V2.md §8)
  // Normalizamos campo a campo: al marcar loading el store puede dejar `options` sin definir. (createFormStore loadAsyncOptions)
  const { options, loading, error } = useFormStore((s: FormState) => {
    const slice = loaderId ? s.async[loaderId] : undefined;
    return {
      options: slice?.options ?? EMPTY.options,
      loading: slice?.loading ?? EMPTY.loading,
      error: slice?.error ?? EMPTY.error,
    };
  }, shallow);

  // Acción estable del store (referencia fija → no recrea callbacks ni reanima el effect).
  const loadAsyncOptions = useFormStore((s: FormState) => s.loadAsyncOptions);

  const reload = useCallback(
    (search?: string) => {
      if (loaderId) loadAsyncOptions(loaderId, search);
    },
    [loaderId, loadAsyncOptions],
  );

  // Valores de las dependencias: re-render (y re-carga) solo cuando cambian SUS deps. (ARCHITECTURE_V2.md §8)
  const depValues = useWatch(deps ?? []);
  const depKey = JSON.stringify(depValues);

  // Carga al montar y cada vez que cambian las deps o el loaderId; guard contra loaderId undefined.
  useEffect(() => {
    if (loaderId) reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaderId, depKey]);

  return { options, loading, error, reload };
}
