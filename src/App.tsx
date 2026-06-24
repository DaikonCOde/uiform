import { useState } from 'react'
import { Button, ConfigProvider } from 'antd'
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
} from '@laus/uiform'
import type { JsfObjectSchema, UiSchema, AsyncOptionsLoader } from '@laus/uiform'

/**
 * Playground de verificación de UIForm v2 (Fases 1-4).
 *
 * Ejercita el camino completo: schema + uiSchema → compileUiSchema → store → hooks →
 * controlador <Field> → presentacionales AntD. Sirve para VER (no solo testear) que
 * el compilador, la suscripción granular, el async y la validación funcionan de verdad.
 */

// ── 1) schema PURO (contrato de datos): tipos + validación, sin presentación ──
const schema: JsfObjectSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['nombre', 'email'],
  properties: {
    nombre: { type: 'string', title: 'Nombre' },
    email: { type: 'string', title: 'Email', format: 'email' },
    edad: { type: 'number', title: 'Edad', minimum: 0 },
    pais: { type: 'string', title: 'País' },
    ciudad: { type: 'string', title: 'Ciudad' },
    bio: { type: 'string', title: 'Bio' },
    nacimiento: { type: 'string', title: 'Fecha de nacimiento' },
    acepta: { type: 'boolean', title: 'Acepto los términos' },
    // Contenedor: fieldset → objeto anidado.
    direccion: {
      type: 'object',
      title: 'Dirección',
      properties: {
        calle: { type: 'string', title: 'Calle' },
        numero: { type: 'number', title: 'Número' },
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
          telefono: { type: 'string', title: 'Teléfono' },
        },
      },
    },
  },
}

// ── 2) uiSchema (presentación RJSF): widget, placeholder, autofocus, async y SECCIONES ──
const uiSchema: UiSchema = {
  'ui:sections': [
    { id: 'datos', title: 'Datos personales xd', fields: ['nombre', 'email', 'edad'] },
    { id: 'extra', title: 'Información adicional', fields: ['pais', 'ciudad', 'nacimiento', 'bio', 'acepta'] },
    { id: 'avanzado', title: 'Contenedores (fieldset + group-array)', fields: ['direccion', 'contactos'] },
  ],
  nombre: { 'ui:widget': 'text', 'ui:placeholder': 'Tu nombre', 'ui:autofocus': true },
  email: { 'ui:widget': 'email', 'ui:placeholder': 'tu@mail.com', 'ui:errorMessages': { format: 'Ingresá un email válido' } },
  edad: { 'ui:widget': 'number', 'ui:placeholder': '0' },
  pais: { 'ui:widget': 'select', 'ui:options': { asyncOptions: { id: 'paises' } } },
  ciudad: { 'ui:widget': 'autocomplete', 'ui:placeholder': 'Buscá tu ciudad...', 'ui:options': { asyncOptions: { id: 'ciudades', searchable: true } } },
  bio: { 'ui:widget': 'textarea', 'ui:placeholder': 'Contanos algo...' },
  nacimiento: { 'ui:widget': 'date' },
  acepta: { 'ui:widget': 'checkbox' },
  direccion: {
    'ui:widget': 'fieldset',
    calle: { 'ui:widget': 'text', 'ui:placeholder': 'Av. Siempreviva' },
    numero: { 'ui:widget': 'number', 'ui:placeholder': '742' },
  },
  contactos: {
    'ui:widget': 'group-array',
    nombre: { 'ui:widget': 'text' },
    telefono: { 'ui:widget': 'text' },
  },
}

// ── 2b) errorMessages: mensajes de validación globales (i18n) en español. Un campo puede
//        sobreescribirlos con `ui:errorMessages` (ver email). ──
const errorMessages: Record<string, string> = {
  required: 'Este campo es obligatorio',
  format: 'El formato no es válido',
  type: 'El valor no es del tipo esperado',
  minimum: 'El valor es demasiado bajo',
}

// ── 3) asyncLoaders: opciones del Select cargadas async desde el store ──
const asyncLoaders: Record<string, AsyncOptionsLoader> = {
  paises: async () => {
    // Simula latencia de red para ver el estado loading del Select.
    await new Promise((r) => setTimeout(r, 600))
    return {
      options: [
        { label: 'Argentina', value: 'ar' },
        { label: 'Uruguay', value: 'uy' },
        { label: 'Chile', value: 'cl' },
        { label: 'Brasil', value: 'br' },
      ],
    }
  },
  // Autocomplete searchable: filtra server-side por el término tipeado (insensible a acentos).
  ciudades: async ({ search }) => {
    await new Promise((r) => setTimeout(r, 300))
    const all = ['Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza', 'La Plata', 'Mar del Plata', 'Salta']
    const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    const q = norm(search ?? '')
    return { options: all.filter((c) => norm(c).includes(q)).map((c) => ({ label: c, value: c })) }
  },
}

/** Renderiza el formulario por secciones, leyendo la metadata resuelta del store. */
function FormBody() {
  // Render por secciones usando el componente público <FormSection> (su default arma título + campos).
  const sections = useSections()
  return (
    <>
      {sections.map((section) => (
        <FormSection key={section.id} id={section.id} />
      ))}
    </>
  )
}

/** Botón de submit cableado al store vía useFormApi (acciones estables + flags). */
function SubmitBar() {
  const { reset } = useFormApi()
  return (
    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
      <SubmitButton>Enviar</SubmitButton>
      <Button onClick={() => reset()}>Reset</Button>
      <span style={{ alignSelf: 'center', color: 'rgba(0,0,0,0.45)', fontSize: 12 }}>
        onSubmit imprime el payload JSON en el panel derecho
      </span>
    </div>
  )
}

/** Inspector en vivo: values + errors + validez. Prueba la reactividad granular. */
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
  maxHeight: 220,
  overflow: 'auto',
  margin: 0,
}

function App() {
  const [submitted, setSubmitted] = useState<unknown>(null)

  return (
    <ConfigProvider locale={esES}>
      <div style={{ padding: 32, maxWidth: 1040, margin: '0 auto' }}>
        <h1 style={{ marginBottom: 4 }}>UIForm v2 — Playground (Fases 1-4)</h1>
        <p style={{ color: 'rgba(0,0,0,0.45)', marginTop: 0 }}>
          schema + uiSchema → compilador → store → hooks → <code>&lt;Field&gt;</code>. Tipeá y mirá el
          panel derecho reaccionar; "Enviar" valida contra el JSON Schema.
        </p>

        <FormProvider
          schema={schema}
          uiSchema={uiSchema}
          asyncLoaders={asyncLoaders}
          errorMessages={errorMessages}
          config={{ validateTrigger: 'onSubmit' }}
          onSubmit={(json) => setSubmitted(json)}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 32, alignItems: 'start' }}>
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
