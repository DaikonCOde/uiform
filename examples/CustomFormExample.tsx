import { UIForm } from '../src/components/form'
import styles from './custom-styles.css'

// Ejemplo de uso con estilos personalizados
export function CustomFormExample() {
  const schema = {
    title: 'Formulario Personalizado',
    type: 'object',
    required: ['name', 'email'],
    properties: {
      name: {
        type: 'string',
        title: 'Nombre Completo',
        description: 'Ingresa tu nombre y apellido'
      },
      email: {
        type: 'string',
        format: 'email',
        title: 'Correo Electrónico'
      },
      age: {
        type: 'number',
        title: 'Edad',
        minimum: 18,
        maximum: 100
      },
      bio: {
        type: 'string',
        title: 'Biografía',
        description: 'Cuéntanos sobre ti'
      }
    }
  }

  const handleSubmit = (values: any) => {
    console.log('Form submitted:', values)
  }

  return (
    <div>
      <h1>Formulario con Estilos Personalizados</h1>
      
      {/* Formulario con tema personalizado */}
      <UIForm
        schema={schema}
        onSubmit={handleSubmit}
        className={styles.customForm}
      />

      <hr style={{ margin: '48px 0' }} />

      {/* Formulario con tema oscuro */}
      <UIForm
        schema={schema}
        onSubmit={handleSubmit}
        className={styles.darkForm}
      />
    </div>
  )
}

// Ejemplo con CSS inline + CSS Modules
export function MixedStylesExample() {
  const schema = {
    title: 'Formulario Mixto',
    type: 'object',
    properties: {
      username: {
        type: 'string',
        title: 'Usuario'
      },
      password: {
        type: 'string',
        title: 'Contraseña'
      }
    }
  }

  return (
    <UIForm
      schema={schema}
      // Combinar className de CSS Module con estilos inline
      className={styles.customForm}
      style={{
        maxWidth: '400px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
      }}
    />
  )
}
