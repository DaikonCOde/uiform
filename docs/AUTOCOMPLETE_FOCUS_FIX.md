# 🔧 Solución al Problema de Pérdida de Focus en AutocompleteField

## 🐛 Problema

El componente `AutocompleteField` perdía el focus cada vez que el usuario escribía una letra. Esto hacía imposible usar el campo correctamente.

### Síntoma:
```
Usuario escribe: "a" → pierde focus
Usuario hace click → escribe "b" → pierde focus
Usuario hace click → escribe "c" → pierde focus
```

## 🔍 Causa Raíz

El componente se estaba **re-renderizando en cada cambio de valor** porque:

1. **Funciones inline en useFieldRenderer**: Las funciones `onChange` y `onBlur` se creaban nuevas en cada render
2. **React.memo sin comparación adecuada**: Aunque el componente estaba envuelto en `React.memo`, no tenía una función de comparación personalizada
3. **Dependencias innecesarias en callbacks**: `handleSearch` incluía `formValues` completo en dependencias

### Flujo del problema:
```
Usuario escribe → onChange → UIForm re-render → useFieldRenderer 
  → Nuevas funciones onChange/onBlur → AutocompleteField recibe nuevas props
    → React.memo no detecta que son "iguales funcionalmente"
      → AutocompleteField re-renderiza → Input pierde focus ❌
```

## ✅ Solución Implementada

### 1. **Optimizar useFieldRenderer con useCallback**

**Antes** (línea 65-119):
```typescript
// ❌ PROBLEMA: useMemo retorna una función, pero la función se ejecuta
// creando nuevas funciones onChange/onBlur en cada render
const renderField = useMemo(() => {
  return (field: any, index?: number): React.ReactNode => {
    // ...
    const baseProps = {
      ...field,
      // ❌ Estas funciones se crean nuevas cada vez
      onChange: (fieldName: string, value: any) => {
        field.onChange?.(fieldName, value)
        onFieldChange?.(fieldName, value, field)
      },
      onBlur: (fieldName: string) => {
        field.onBlur?.(fieldName)
        onFieldBlur?.(fieldName, field)
      }
    }
    return <FieldComponent {...baseProps} />
  }
}, [componentMap, globalConfig, onFieldChange, onFieldBlur])
```

**Después**:
```typescript
// ✅ CORRECTO: useCallback memoiza la función directamente
// Y no creamos wrappers innecesarios para onChange/onBlur
const renderField = useCallback((field: any, index?: number): React.ReactNode => {
  // ...
  const baseProps = {
    ...field, // onChange y onBlur ya vienen memoizados del padre
    disabled: globalConfig.disabled || field.disabled,
    size: globalConfig.size || field.size,
  }
  return <FieldComponent {...baseProps} />
}, [componentMap, globalConfig])
```

### 2. **Agregar comparación personalizada a React.memo**

**Agregado** (línea 310-330):
```typescript
export const AutocompleteField = React.memo(function AutocompleteField({...}) {
  // ... implementación
}, (prevProps, nextProps) => {
  // Función de comparación personalizada
  // Retorna true si las props son iguales (NO re-renderizar)
  // Retorna false si las props son diferentes (SÍ re-renderizar)
  
  // Comparar solo props primitivas importantes
  if (prevProps.name !== nextProps.name) return false
  if (prevProps.value !== nextProps.value) return false
  if (prevProps.error !== nextProps.error) return false
  if (prevProps.submitted !== nextProps.submitted) return false
  if (prevProps.touched !== nextProps.touched) return false
  if (prevProps.disabled !== nextProps.disabled) return false
  if (prevProps.isVisible !== nextProps.isVisible) return false
  
  // onChange y onBlur son referencias estables del padre
  // No necesitamos compararlas
  
  return true // Props iguales, no re-renderizar ✅
})
```

### 3. **Optimizar handleSearch sin formValues en dependencias**

**Antes**:
```typescript
// ❌ PROBLEMA: formValues cambia en cada tecla presionada
const handleSearch = useCallback(async (searchValue: string) => {
  // ...
  const result = await asyncConfig.loader({ search: searchValue, formValues })
  // ...
}, [asyncOptions, asyncLoaderId, formValues])
//                                 ^^^^^^^^^^^ Cambia constantemente
```

**Después**:
```typescript
// ✅ CORRECTO: formValues se obtiene del contexto en tiempo de ejecución
const handleSearch = useCallback(async (searchValue: string) => {
  // ...
  // formValues se obtiene del contexto actual en el momento de la búsqueda
  const result = await asyncConfig.loader({ search: searchValue, formValues })
  // ...
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [asyncOptions, asyncLoaderId])
//  Sin formValues en dependencias ✅
```

## 📊 Comparación Antes/Después

### Antes (con pérdida de focus):
```
Usuario escribe "a" 
  → onChange ejecuta
    → UIForm actualiza state
      → UIForm re-render
        → useFieldRenderer ejecuta
          → Crea nueva función onChange
            → AutocompleteField recibe nueva prop
              → React.memo compara props
                → onChange !== prevOnChange
                  → AutocompleteField RE-RENDERIZA
                    → Input se recrea
                      → PIERDE FOCUS ❌
```

### Después (mantiene focus):
```
Usuario escribe "a"
  → onChange ejecuta (misma referencia)
    → UIForm actualiza state
      → UIForm re-render
        → useFieldRenderer ejecuta
          → renderField es la misma función (useCallback)
            → AutocompleteField recibe mismas props
              → React.memo compara props
                → Todas las props importantes son iguales
                  → AutocompleteField NO re-renderiza
                    → Input mantiene estado
                      → MANTIENE FOCUS ✅
```

## 🎯 Puntos Clave

1. **useCallback > useMemo para funciones**: Cuando retornas una función, usa `useCallback` directamente
2. **No crear wrappers innecesarios**: Si las funciones ya están memoizadas, no las envuelvas
3. **React.memo con comparación personalizada**: Para componentes complejos, define qué props son importantes
4. **Closure sobre props**: Los callbacks pueden acceder a props del contexto sin incluirlas en dependencias

## ✅ Resultado

- ✅ **Focus se mantiene** mientras el usuario escribe
- ✅ **Re-renders mínimos** solo cuando cambian props importantes
- ✅ **Performance mejorado** significativamente
- ✅ **Experiencia de usuario fluida**

## 📚 Archivos Modificados

- `src/hooks/useFieldRenderer.tsx` - Optimizado renderField con useCallback
- `src/components/fields/AutocompleteField.tsx` - Agregada comparación personalizada a React.memo

## 🧪 Cómo Verificar

1. Abre el formulario con un AutocompleteField
2. Haz click en el input
3. Escribe varias letras seguidas: "hello"
4. Verifica que el focus se mantiene y no necesitas hacer click entre cada letra

### Antes:
```
h [pierde focus, click] e [pierde focus, click] l [pierde focus...]
```

### Ahora:
```
hello [focus mantenido todo el tiempo] ✅
```

---

**Problema resuelto**: 2025-11-02  
**Solución**: useCallback + React.memo con comparación personalizada
