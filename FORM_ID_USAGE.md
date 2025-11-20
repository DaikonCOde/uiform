# Uso del FormId para Botones de Submit Externos

## Descripción

A partir de esta versión, `UIForm` soporta botones de submit externos mediante la prop `formId`. Esto permite que el usuario tenga control total sobre el diseño y ubicación del botón de submit.

## ¿Cómo funciona?

Cuando pasas un `formId` al componente `UIForm`:
1. El formulario HTML recibirá ese `id` como atributo
2. No se renderizará el botón de submit por defecto
3. Puedes crear tu propio botón con `form={formId}` y `type="submit"` en cualquier parte de tu aplicación

## Ejemplos de Uso

### Ejemplo 1: Botón externo básico

```tsx
import { UIForm } from '@laus/uiform'
import { Button } from 'antd'

function MyComponent() {
  const handleSubmit = (values: any) => {
    console.log('Form submitted:', values)
  }

  return (
    <div>
      <UIForm
        formId="my-form"
        schema={mySchema}
        onSubmit={handleSubmit}
      />

      {/* Botón externo vinculado al formulario */}
      <Button
        type="primary"
        htmlType="submit"
        form="my-form"
      >
        Enviar Formulario
      </Button>
    </div>
  )
}
```

### Ejemplo 2: Botones en footer separado

```tsx
import { UIForm } from '@laus/uiform'
import { Button, Space, Card } from 'antd'

function MyFormPage() {
  const handleSubmit = (values: any) => {
    console.log('Form submitted:', values)
  }

  return (
    <div>
      <Card title="Datos del Usuario">
        <UIForm
          formId="user-form"
          schema={userSchema}
          onSubmit={handleSubmit}
        />
      </Card>

      {/* Footer con botones personalizados */}
      <div style={{ marginTop: 24, textAlign: 'right' }}>
        <Space>
          <Button href="/back">
            Cancelar
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            form="user-form"
          >
            Guardar Cambios
          </Button>
        </Space>
      </div>
    </div>
  )
}
```

### Ejemplo 3: Modal con formulario

```tsx
import { UIForm } from '@laus/uiform'
import { Modal } from 'antd'
import { useState } from 'react'

function UserModal() {
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (values: any) => {
    setLoading(true)
    try {
      await saveUser(values)
      setVisible(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      title="Crear Usuario"
      open={visible}
      onCancel={() => setVisible(false)}
      footer={[
        <Button key="cancel" onClick={() => setVisible(false)}>
          Cancelar
        </Button>,
        <Button
          key="submit"
          type="primary"
          htmlType="submit"
          form="user-modal-form"
          loading={loading}
        >
          Crear
        </Button>
      ]}
    >
      <UIForm
        formId="user-modal-form"
        schema={userSchema}
        onSubmit={handleSubmit}
      />
    </Modal>
  )
}
```

### Ejemplo 4: Formulario con botón personalizado (children)

Si prefieres usar `children` para mayor control:

```tsx
import { UIForm } from '@laus/uiform'
import { Button, Space } from 'antd'

function MyComponent() {
  return (
    <UIForm
      schema={mySchema}
      onSubmit={handleSubmit}
    >
      {/* Botones personalizados usando children */}
      <Space>
        <Button type="default">
          Limpiar
        </Button>
        <Button type="primary" htmlType="submit">
          Enviar
        </Button>
      </Space>
    </UIForm>
  )
}
```

## Comportamiento del Botón por Defecto

El botón de submit por defecto se renderiza **solo cuando**:
- Se proporciona la prop `onSubmit`
- NO se pasa `children`
- NO se proporciona `formId` (para uso externo)

Si quieres usar el botón por defecto, simplemente no pases `formId` ni `children`:

```tsx
<UIForm
  schema={mySchema}
  onSubmit={handleSubmit}
/>
```

## Notas Importantes

1. **Validación Automática**: El formulario valida automáticamente en `onSubmit`, sin importar dónde esté el botón
2. **Estado de Loading**: Si necesitas un indicador de loading en botones externos, deberás manejarlo en tu estado local
3. **Múltiples Botones**: Puedes tener múltiples botones con `form={formId}` en diferentes partes de tu aplicación
4. **Compatibilidad**: Funciona con cualquier componente de botón que soporte el atributo `form` de HTML5

## Migración desde versiones anteriores

Si usabas el botón por defecto:
```tsx
// ❌ Antes (sigue funcionando)
<UIForm schema={schema} onSubmit={handleSubmit} />

// ✅ Nuevo (más flexible)
<>
  <UIForm formId="my-form" schema={schema} onSubmit={handleSubmit} />
  <Button form="my-form" type="primary" htmlType="submit">Submit</Button>
</>
```

Tu código existente seguirá funcionando sin cambios.
