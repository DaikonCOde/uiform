# CSS Modules en UIForm

Este proyecto utiliza **CSS Modules** para el estilo de los componentes, permitiendo a los usuarios finales personalizar completamente la apariencia sin conflictos de nombres de clases.

## ¿Qué son CSS Modules?

CSS Modules son archivos CSS que se importan localmente en componentes JavaScript/TypeScript. Todas las clases son automáticamente limitadas al componente, evitando conflictos globales.

## Archivos CSS Modules

### Componentes principales

#### `UIForm.module.css`
Estilos del formulario principal:
- `.container` - Contenedor principal del formulario
- `.formError` - Mensaje de error general del formulario
- `.fieldsContainer` - Contenedor de campos
- `.fieldItem` - Item individual de campo
- `.submitContainer` - Contenedor de botones de submit

#### `Field.module.css`
Estilos compartidos por todos los campos:
- `.field` - Contenedor base de cualquier campo
- `.checkboxDescription` - Descripción de checkboxes
- `.checkboxContainer` - Contenedor de checkbox
- `.radioOption` - Opción individual de radio
- `.fileHint` - Texto de ayuda para campos de archivo
- `.fieldsetCard` - Card de fieldset
- `.fieldsetDescription` - Descripción de fieldset
- `.fieldsetContainer` - Contenedor interno de fieldset
- `.arrayContainer` - Contenedor de array
- `.arrayEmpty` - Estado vacío del array
- `.arrayItemHeader` - Header de item de array
- `.arrayItemFields` - Campos dentro de item de array
- `.arrayItemError` - Error de item de array
- `.arrayAddButton` - Botón de agregar item
- `.arrayLimits` - Texto de límites del array

#### `label.module.css`
Estilos para labels:
- `.container` - Contenedor del label
- `.label` - Label del campo
- `.required` - Indicador de campo requerido (*)
- `.description` - Descripción del campo

#### `errorMessage.module.css`
Estilos para mensajes de error:
- `.error` - Mensaje de error simple
- `.errorContainer` - Contenedor de múltiples errores
- `.errorItem` - Item de error individual
- `.errorItemSpaced` - Item de error con espaciado superior

## Cómo personalizar los estilos

### Opción 1: Sobrescribir estilos globalmente

Crea un archivo CSS global en tu aplicación:

```css
/* app.css */

/* Personalizar el label */
:global(.label_container) {
  /* tus estilos */
}

/* Personalizar campos */
:global(.field_field) {
  padding: 20px;
  background-color: #f5f5f5;
}

/* Personalizar mensajes de error */
:global(.errorMessage_error) {
  color: #ff0000;
  font-weight: bold;
}
```

### Opción 2: Usar className y style props

Todos los componentes aceptan `className` y `style` props:

```tsx
<UIForm
  schema={schema}
  className="mi-formulario-personalizado"
  style={{ padding: '20px', backgroundColor: '#fff' }}
/>
```

### Opción 3: Usar CSS custom properties (variables CSS)

Define variables CSS en tu aplicación:

```css
:root {
  --form-error-color: #ff4d4f;
  --form-field-gap: 16px;
  --form-label-color: #000;
  --form-description-color: rgba(0, 0, 0, 0.45);
}
```

Luego modifica los archivos CSS Module para usar estas variables:

```css
/* errorMessage.module.css */
.error {
  color: var(--form-error-color, #ff4d4f);
  /* ... */
}
```

### Opción 4: Extender componentes

Puedes crear tus propios componentes wrapper:

```tsx
import { TextField } from 'uiform'
import styles from './MiTextField.module.css'

export function MiTextField(props) {
  return (
    <div className={styles.wrapper}>
      <TextField {...props} className={styles.field} />
    </div>
  )
}
```

## Ventajas de CSS Modules

1. **Sin conflictos**: Los nombres de clase son únicos automáticamente
2. **Modularidad**: Cada componente tiene sus propios estilos
3. **Type-safe**: TypeScript puede validar nombres de clase
4. **Composición**: Puedes combinar clases fácilmente
5. **Tree-shaking**: Solo se incluyen los estilos usados
6. **Fácil personalización**: Los usuarios pueden sobrescribir con facilidad

## Migración desde inline styles

Los estilos inline previos han sido movidos a CSS Modules. Si usabas props de estilo personalizados, estos siguen funcionando y se combinan con las clases CSS.

## Ejemplo completo

```tsx
import { UIForm } from 'uiform'
import './mi-formulario.css' // tus estilos personalizados

function MiFormulario() {
  return (
    <UIForm
      schema={schema}
      className="formulario-custom"
      config={{
        size: 'large'
      }}
    />
  )
}
```

```css
/* mi-formulario.css */
.formulario-custom {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

/* Personalizar todos los campos dentro de este formulario */
.formulario-custom :global(.field) {
  margin-bottom: 24px;
}

/* Personalizar labels */
.formulario-custom :global(.label) {
  font-weight: 600;
  color: #1890ff;
}
```

## Soporte de herramientas

Vite (usado en este proyecto) tiene soporte nativo para CSS Modules. No se requiere configuración adicional.
