import { useState } from 'react'
import { Button, ConfigProvider, Alert } from 'antd'
import esES from 'antd/locale/es_ES'
import 'dayjs/locale/es'
import './App.css'

// Consumimos la API PÚBLICA (@laus/uiform) — en dev, el alias de Vite la mapea a src/lib/index.ts.
import {
  FormProvider,
  FormSection,
  SubmitButton,
  useFormStore,
  useFormApi,
  useSections,
  // Building blocks para componer un widget custom:
  CheckboxField,
  Field,
  FieldLabel,
} from '@laus/uiform'
import type { JsfObjectSchema, UiSchema, FormLayout, AsyncOptionsLoader } from '@laus/uiform'

// ── Widget CUSTOM compuesto: SIN UI extra (no Card/borde) → se renderiza como un campo cualquiera y hereda
//    el colSpan del schema. Una fila "label + checkbox" y debajo el campo dependiente (texto o select),
//    embebido SIN su propio label (los dependientes no tienen `title` en el schema). El schema decide cuál
//    se ve. El componente solo compone piezas de la librería.
function ToggleCard({ name, value, label, required, onChange }: any) {
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <FieldLabel label={label} required={required} />
        <label>
          <CheckboxField name={name} value={value} onChange={(_n: string, v: any) => onChange(name, v)} />
            ¿Es sede tercero?
        </label> 
      </div>
      {/* el oculto se renderiza como null solo (regla del schema) */}
      <Field name="detalleTexto" />
      <Field name="detalleOpcion" />
    </>
  )
}

/**
 * Playground de verificación de UIForm v2.
 *
 * Demo "complejo": grid responsivo, select dependiente (país→provincia), visibilidad condicional
 * (CUIT solo si facturás), validaciones con mensajes en español, fieldset y group-array.
 */

// ── 1) schema PURO: dato + validación (incl. condición if/then/else para CUIT) ──
const schema: JsfObjectSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['nombre', 'email', 'edad'],
  properties: {
    nombre: { type: 'string', title: 'Nombre' },
    email: { type: 'string', title: 'Email', format: 'email' },
    edad: { type: 'number', title: 'Edad', minimum: 18, maximum: 120 },
    pais: { type: 'string', title: 'País' },
    provincia: { type: 'string', title: 'Provincia' },
    ciudad: { type: 'string', title: 'Ciudad' },
    usuario: { type: 'string', title: 'Usuario (búsqueda en API)' },
    nacimiento: { type: 'string', title: 'Fecha de nacimiento' },
    hora: { type: 'string', title: 'Hora preferida de contacto', format: 'time' },
    bio: { type: 'string', title: 'Bio', maxLength: 200 },
    facturaElectronica: { type: 'boolean', title: '¿Emitís factura electrónica?' },
    cuit: { type: 'string', title: 'CUIT', pattern: '^\\d{2}-\\d{8}-\\d{1}$' },
    acepta: { type: 'boolean', title: 'Acepto los términos y condiciones' },
    // Widget custom: el checkbox decide si abajo va texto (input) o select.
    usarLista: { type: 'boolean', title: 'Detalle' },
    // Sin `title`: el label lo pone el ToggleCard una sola vez (al lado del checkbox).
    detalleTexto: { type: 'string' },
    detalleOpcion: {
      type: 'string',
      oneOf: [
        { const: 'urgente', title: 'Urgente' },
        { const: 'normal', title: 'Normal' },
        { const: 'baja', title: 'Baja prioridad' },
      ],
    },
    // Contenedor: fieldset → objeto anidado.
    direccion: {
      type: 'object',
      title: 'Dirección',
      properties: {
        calle: { type: 'string', title: 'Calle' },
        numero: { type: 'number', title: 'Número' },
        ciudad: { type: 'string', title: 'Ciudad' },
        cp: { type: 'string', title: 'Código postal' },
      },
    },
    // Contenedor: group-array → array de objetos.
    contactos: {
      type: 'array',
      title: 'Contactos',
      items: {
        type: 'object',
        properties: {
          nombre: { type: 'string', title: 'Nombre' },
          tipo: {
            type: 'string',
            title: 'Tipo',
            oneOf: [
              { const: 'personal', title: 'Personal' },
              { const: 'laboral', title: 'Laboral' },
            ],
          },
          telefono: { type: 'string', title: 'Teléfono' },
        },
      },
    },
  },
  // Visibilidad condicional: el CUIT solo aparece (y es requerido) si facturaElectronica = true.
  allOf: [
    {
      if: { properties: { facturaElectronica: { const: true } }, required: ['facturaElectronica'] },
      then: { required: ['cuit'] },
      else: { properties: { cuit: false } },
    },
    // Widget custom: usarLista=true → muestra el select y oculta el texto; y viceversa.
    {
      if: { properties: { usarLista: { const: true } }, required: ['usarLista'] },
      then: { properties: { detalleTexto: false } },
      else: { properties: { detalleOpcion: false } },
    },
  ],
}

// ── 2) uiSchema: presentación + GRID (colSpan por campo, layout por sección) ──
const uiSchema: UiSchema = {
  'ui:sections': [
    { id: 'datos', title: 'Datos personales', fields: ['nombre', 'email', 'edad', 'usuario', 'usarLista'] },
    { id: 'ubicacion', title: 'Ubicación', fields: ['pais', 'provincia', 'ciudad', 'nacimiento', 'hora'] },
    { id: 'extra', title: 'Información adicional', fields: ['bio', 'facturaElectronica', 'cuit', 'acepta'] },
    // SOLO el checkbox en la sección; el ToggleCard embebe los dependientes (no van en ninguna sección).s
    // Esta sección overridea el grid global a 1 columna (contenedores a lo ancho).
    { id: 'contenedores', title: 'Dirección y contactos', fields: ['direccion', 'contactos'], layout: { columns: 1 } },
  ],
  nombre: { 'ui:widget': 'text', 'ui:placeholder': 'Tu nombre', 'ui:autofocus': true },
  email: { 'ui:widget': 'email', 'ui:placeholder': 'tu@mail.com', 'ui:errorMessages': { format: 'Ingresá un email válido' } },
  edad: {
    'ui:widget': 'number',
    'ui:placeholder': '18',
    'ui:errorMessages': { minimum: 'Tenés que ser mayor de 18', maximum: 'Edad inválida' },
  },
  pais: { 'ui:widget': 'select', 'ui:options': { asyncOptions: { id: 'paises' } } },
  // Select DEPENDIENTE: recarga sus opciones cuando cambia `pais`.
  provincia: { 'ui:widget': 'select', 'ui:options': { asyncOptions: { id: 'provincias', dependencies: ['pais'] } } },
  ciudad: { 'ui:widget': 'autocomplete', 'ui:placeholder': 'Buscá tu ciudad...', 'ui:options': { asyncOptions: { id: 'ciudades', searchable: true } } },
  usuario: { 'ui:widget': 'autocomplete', 'ui:placeholder': 'Buscá un usuario (JSONPlaceholder)...', 'ui:options': { asyncOptions: { id: 'usuarios', searchable: true } } },
  nacimiento: { 'ui:widget': 'date', 'ui:options': { format: 'DD/MM/YYYY' } },
  hora: { 'ui:widget': 'time', 'ui:options': { format: 'HH:mm' } },
  bio: { 'ui:widget': 'textarea', 'ui:placeholder': 'Contanos algo...', 'ui:colSpan': 2 },
  facturaElectronica: { 'ui:widget': 'checkbox' },
  cuit: { 'ui:widget': 'text', 'ui:placeholder': '20-12345678-3', 'ui:colSpan': 2, 'ui:errorMessages': { pattern: 'CUIT inválido (formato XX-XXXXXXXX-X)' } },
  acepta: { 'ui:widget': 'checkbox', 'ui:colSpan': 2 },
  usarLista: { 'ui:widget': 'toggleCard', 'ui:colSpan': 1 },
  detalleTexto: { 'ui:widget': 'text', 'ui:placeholder': 'Escribí el detalle...' },
  detalleOpcion: { 'ui:widget': 'select', 'ui:placeholder': 'Elegí una opción...' },
  direccion: {
    'ui:widget': 'fieldset',
    calle: { 'ui:widget': 'text', 'ui:placeholder': 'Av. Siempreviva' },
    numero: { 'ui:widget': 'number', 'ui:placeholder': '742' },
    ciudad: { 'ui:widget': 'text' },
    cp: { 'ui:widget': 'text', 'ui:placeholder': '1414' },
  },
  contactos: {
    'ui:widget': 'group-array',
    nombre: { 'ui:widget': 'text' },
    tipo: { 'ui:widget': 'select' },
    telefono: { 'ui:widget': 'text' },
  },
}

// ── Grid GLOBAL del formulario: 2 columnas (1 en mobile), gap 16px por default ──
const layout: FormLayout = { gap: '16px', responsive: { sm: 1, md: 6 } }

// ── Mensajes de validación globales (i18n) en español. Un campo puede overridear con ui:errorMessages ──
const errorMessages: Record<string, string> = {
  required: 'Este campo es obligatorio',
  format: 'El formato no es válido',
  type: 'El valor no es del tipo esperado',
  minimum: 'El valor es demasiado bajo',
  maximum: 'El valor es demasiado alto',
  pattern: 'El formato no es válido',
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

// ── 3) asyncLoaders ──
const asyncLoaders: Record<string, AsyncOptionsLoader> = {
  paises: async () => {
    await delay(500)
    return {
      options: [
        { label: 'Argentina', value: 'ar' },
        { label: 'Uruguay', value: 'uy' },
        { label: 'Chile', value: 'cl' },
        { label: 'Brasil', value: 'br' },
      ],
    }
  },
  // DEPENDIENTE de `pais`: devuelve las provincias del país elegido.
  provincias: async ({ formValues }) => {
    await delay(400)
    const byPais: Record<string, string[]> = {
      ar: ['Buenos Aires', 'Córdoba', 'Santa Fe', 'Mendoza'],
      uy: ['Montevideo', 'Canelones', 'Maldonado'],
      cl: ['Región Metropolitana', 'Valparaíso', 'Biobío'],
      br: ['São Paulo', 'Rio de Janeiro', 'Minas Gerais'],
    }
    const provs = byPais[formValues?.pais as string] ?? []
    return { options: provs.map((p) => ({ label: p, value: p })) }
  },
  ciudades: async ({ search }) => {
    await delay(300)
    const all = ['Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza', 'La Plata', 'Mar del Plata', 'Salta']
    const q = norm(search ?? '')
    return { options: all.filter((c) => norm(c).includes(q)).map((c) => ({ label: c, value: c })) }
  },
  // Búsqueda en API REAL (JSONPlaceholder): trae los usuarios y filtra por nombre/username con el término.
  // (JSONPlaceholder no tiene endpoint de search; en una API real reemplazarías esto por /search?q=...)
  usuarios: async ({ search }) => {
    const res = await fetch('https://jsonplaceholder.typicode.com/users')
    if (!res.ok) throw new Error('No se pudieron cargar los usuarios')
    const users: Array<{ id: number; name: string; username: string }> = await res.json()
    const q = norm(search ?? '')
    return {
      options: users
        .filter((u) => norm(u.name).includes(q) || norm(u.username).includes(q))
        .map((u) => ({ label: `${u.name} (@${u.username})`, value: u.name })),
    }
  },
}

/** Renderiza el formulario por secciones (el grid lo aplica cada FormSection según el layout). */
function FormBody() {
  const sections = useSections()
  return (
    <>
      {sections
        // detalleTexto/detalleOpcion no van en ninguna sección (los embebe ToggleCard) → caen en la
        // sección implícita __default__; la salteamos para que no se rendericen sueltos.
        .filter((section) => section.id !== '__default__')
        .map((section) => (
          <FormSection key={section.id} id={section.id} />
        ))}
    </>
  )
}

/** Barra de submit + feedback de error de submit (submitError). */
function SubmitBar() {
  const { reset, submitError } = useFormApi()
  return (
    <div style={{ marginTop: 8 }}>
      {submitError && <Alert type="error" message={submitError} style={{ marginBottom: 8 }} />}
      <div style={{ display: 'flex', gap: 8 }}>
        <SubmitButton>Enviar</SubmitButton>
        <Button onClick={() => reset()}>Reset</Button>
      </div>
    </div>
  )
}

/** Inspector en vivo: values + errors. */
function StoreInspector() {
  const values = useFormStore((s) => s.values)
  const errors = useFormStore((s) => s.errors)
  const submitted = useFormStore((s) => s.submitted)
  return (
    <div style={{ fontSize: 12 }}>
      <h4 style={{ margin: '0 0 6px' }}>values</h4>
      <pre style={panel}>{JSON.stringify(values, null, 2)}</pre>
      <h4 style={{ margin: '12px 0 6px' }}>errors {submitted ? '(validado)' : ''}</h4>
      <pre style={panel}>{JSON.stringify(errors, null, 2)}</pre>
    </div>
  )
}

const panel: React.CSSProperties = {
  background: '#0a0a0a',
  color: '#7CFC9B',
  padding: 12,
  borderRadius: 6,
  maxHeight: 240,
  overflow: 'auto',
  margin: 0,
}

function App() {
  const [submitted, setSubmitted] = useState<unknown>(null)

  return (
    <ConfigProvider locale={esES}>
      <div style={{ padding: 32, maxWidth: 1100, margin: '0 auto' }}>
        <h1 style={{ marginBottom: 4 }}>UIForm v2 — Playground</h1>
        <p style={{ color: 'rgba(0,0,0,0.45)', marginTop: 0 }}>
          Grid responsivo · select dependiente (país→provincia) · CUIT condicional (tildá "factura
          electrónica") · validaciones en español · fieldset y group-array.
        </p>

        <FormProvider
          schema={schema}
          uiSchema={uiSchema}
          layout={layout}
          asyncLoaders={asyncLoaders}
          errorMessages={errorMessages}
          components={{ toggleCard: ToggleCard }}
          config={{ validateTrigger: 'onSubmit' }}
          onSubmit={(json) => setSubmitted(json)}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 32, alignItems: 'start' }}>
            <div>
              <FormBody />
              <SubmitBar />
            </div>
            <aside>
              <StoreInspector />
              <h4 style={{ margin: '12px 0 6px' }}>último onSubmit</h4>
              <pre style={panel}>{submitted ? JSON.stringify(submitted, null, 2) : '—'}</pre>
            </aside>
          </div>
        </FormProvider>
      </div>
    </ConfigProvider>
  )
}

export default App
