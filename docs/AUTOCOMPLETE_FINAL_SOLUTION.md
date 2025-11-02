# ✅ Solución Final: Focus en AutocompleteField

## 🐛 Problemas Detectados

### Caso 1: Recarga → Escribir directo en autocomplete
**Síntoma**: Por cada letra se llama al servicio Y se pierde el focus

**Causa**: `handleSearch` se recreaba en cada render porque dependía de `asyncOptions` que es un nuevo objeto en cada render del padre.

### Caso 2: Recarga → Escribir en otro campo → Luego autocomplete  
**Síntoma**: Ya no se pierde el focus PERO tampoco llama al servicio

**Causa**: `React.memo` con comparación personalizada bloqueaba todos los re-renders, por lo que `handleSearch` mantenía una referencia vieja de `asyncOptions`.

## 🔍 Análisis del Problema

El dilema era:
- **Sin memoización**: Se re-renderiza mucho → pierde focus
- **Con React.memo**: No se re-renderiza → callbacks quedan obsoletos

Necesitábamos: **Callbacks estables que siempre tengan acceso a valores actuales**.

## ✅ Solución Implementada

### 1. **Usar `useRef` para mantener valores actuales**

```typescript
// Refs para mantener valores actuales sin causar re-renders
const asyncOptionsRef = useRef(asyncOptions)
const formValuesRef = useRef(formValues)

// Actualizar refs en cada render (sin dependencias = cada render)
useEffect(() => {
  asyncOptionsRef.current = asyncOptions
  formValuesRef.current = formValues
})
```

**Beneficio**: Los refs siempre tienen el valor más reciente, pero cambiarlos NO causa re-renders.

### 2. **Callbacks estables con acceso a refs**

```typescript
// handleSearch SOLO depende de asyncLoaderId (estable)
const handleSearch = useCallback(async (searchValue: string) => {
  // Obtener valores actuales de los refs
  const asyncConfig = asyncOptionsRef.current
  const currentFormValues = formValuesRef.current
  
  if (!asyncConfig?.loader || !asyncLoaderId) return
  if (!searchValue && !asyncConfig.searchable) return

  setAsyncLoading(asyncLoaderId, true)
  setAsyncError(asyncLoaderId, null)
  
  try {
    // Usar valores actuales de los refs
    const result = await asyncConfig.loader({ 
      search: searchValue, 
      formValues: currentFormValues 
    })
    setAsyncOptions(asyncLoaderId, result.options || [])
  } catch (err) {
    // ...
  } finally {
    setAsyncLoading(asyncLoaderId, false)
  }
}, [asyncLoaderId]) // ✅ Solo asyncLoaderId - callback estable
```

**Beneficio**: 
- ✅ Callback NO se recrea (dependencia estable)
- ✅ Siempre tiene acceso a valores actuales (via refs)

### 3. **Eliminar React.memo personalizado**

**Antes**:
```typescript
}, (prevProps, nextProps) => {
  // Comparación personalizada bloqueaba actualizaciones necesarias
  return true // ❌ Siempre retornaba true
})
```

**Después**:
```typescript
}) // ✅ React.memo por defecto compara todas las props superficialmente
```

**Beneficio**: React decide automáticamente cuándo re-renderizar basado en cambios reales de props.

### 4. **Memoizar autocompleteProps**

```typescript
const autocompleteProps = useMemo(() => ({
  id: name,
  value: inputValue,
  onChange: handleChange,
  onSelect: handleSelect,
  onBlur: handleBlur,
  onSearch: isSearchable ? handleSearch : undefined, // handleSearch es estable
  // ...
}), [
  name,
  inputValue,
  handleChange, // estable
  handleSelect, // estable
  handleBlur,   // estable
  isSearchable,
  handleSearch, // ✅ estable ahora
  // ...
])
```

**Beneficio**: El objeto de props solo se recrea cuando cambian valores importantes, no en cada render.

## 📊 Flujo Corregido

### Caso 1: Recarga → Escribir en autocomplete
```
1. Usuario escribe "a"
   → handleSearch ejecuta (callback estable)
     → Usa asyncOptionsRef.current (valor actual)
       → Llama al servicio ✅
         → Input NO se re-renderiza innecesariamente
           → Mantiene focus ✅

2. Usuario escribe "b" 
   → Mismo flujo
     → Focus mantenido ✅
```

### Caso 2: Recarga → Campo X → Autocomplete
```
1. Usuario escribe en campo X
   → UIForm actualiza formValues
     → formValuesRef.current se actualiza
       → handleSearch sigue siendo el mismo callback

2. Usuario va a autocomplete y escribe "test"
   → handleSearch ejecuta
     → Usa formValuesRef.current (tiene valor actualizado del campo X) ✅
       → Llama al servicio con contexto correcto ✅
         → Mantiene focus ✅
```

## 🎯 Puntos Clave

1. **useRef para valores que cambian frecuentemente**
   - No causan re-renders
   - Siempre accesibles con valor actual
   - Perfectos para callbacks estables

2. **useCallback con dependencias mínimas**
   - Solo IDs o valores estables
   - Acceso a valores dinámicos via refs

3. **React.memo por defecto es suficiente**
   - Comparación superficial de props
   - No bloquea actualizaciones necesarias

4. **useMemo para objetos de props**
   - Evita recreación innecesaria
   - Solo cuando dependencias cambian

## ✅ Resultado Final

| Caso | Comportamiento |
|------|---------------|
| Escribir en autocomplete directamente | ✅ Mantiene focus, llama al servicio |
| Escribir en otro campo primero | ✅ Mantiene focus, llama al servicio con contexto |
| Búsqueda async | ✅ Funciona correctamente |
| Campos dependientes | ✅ Reciben formValues actualizados |

## 🔑 Lección Aprendida

**Pattern**: Para callbacks que necesitan valores actuales pero deben ser estables:

```typescript
// 1. Crear refs
const valueRef = useRef(initialValue)

// 2. Actualizar refs en cada render
useEffect(() => {
  valueRef.current = currentValue
})

// 3. Callback estable que usa refs
const stableCallback = useCallback(() => {
  const current = valueRef.current // Siempre actual
  // usar current...
}, []) // Sin dependencias = estable
```

## 📚 Archivos Modificados

- `src/components/fields/AutocompleteField.tsx`
  - Agregados refs para asyncOptions y formValues  
  - Optimizado handleSearch con refs
  - Removida comparación personalizada de React.memo
  - Memoizado autocompleteProps

---

**Problema resuelto**: 2025-11-02  
**Solución**: useRef + useCallback estable + React.memo default
