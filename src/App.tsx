import { ConfigProvider } from 'antd'
import esES from 'antd/locale/es_ES'
import 'dayjs/locale/es'
import './App.css'

/**
 * Playground de desarrollo para UIForm v2.
 *
 * Se irá poblando a medida que avance el rebuild (store → hooks → secciones).
 * Plan completo en docs/ARCHITECTURE_V2.md.
 *
 * Consume el fork local de @laus/json-schema-form en vivo (alias de Vite, ver vite.config.ts)
 * y la librería como @laus/uiform.
 */
function App() {
  return (
    <ConfigProvider locale={esES}>
      <div style={{ padding: 32, maxWidth: 880, margin: '0 auto' }}>
        <h1 style={{ marginBottom: 4 }}>UIForm v2 — Playground</h1>
        <p style={{ color: 'rgba(0,0,0,0.45)', marginTop: 0 }}>
          En construcción. Los demos se agregan a medida que se implementan el store, los hooks y
          las secciones (ver <code>docs/ARCHITECTURE_V2.md</code>).
        </p>
      </div>
    </ConfigProvider>
  )
}

export default App
