# Desarrollo local

Cómo está organizado el proyecto para que **convivan** la librería, el playground de pruebas y tu
**fork local** del motor `@laus/json-schema-form`.

## Piezas

| Pieza | Qué es | Dónde |
|-------|--------|-------|
| **Librería UI** (`@laus/uiform`) | Lo que se publica | `src/lib/index.ts` (entry) + `src/components`, `src/hooks`, `src/context`, `src/utils`, `src/types` |
| **Playground** | Sistema de pruebas visual | `index.html` → `src/main.tsx` → `src/App.tsx` |
| **Playground** | Hoy un placeholder; se reconstruye en v2 a medida que avanza el rebuild | `src/App.tsx` |
| **Motor headless** | Tu fork de `@remoteoss/json-schema-form` | `/Users/alexocsa/Documents/dev/laus/json-schema-form` (repo hermano) |

## Cómo se consume el fork local

En **modo dev** (`npm run dev`), `vite.config.ts` aliasa:

```
@laus/json-schema-form  →  ../json-schema-form/src/index.ts   (source del fork, HMR en vivo)
@laus/uiform            →  ./src/lib/index.ts                 (dogfooding del entry público)
```

Esto significa que **editás el fork y el cambio se refleja al toque** en el playground, sin
rebuildear ni re-linkear nada. Una sola terminal.

> El alias **solo aplica en dev**. En `npm run build` NO se aliasa: `@laus/json-schema-form` queda
> **externalizado** (`rollupOptions.external`) para no bundlearse en el paquete publicado. La versión
> que se usa en producción es la declarada en `package.json` (`@laus/json-schema-form@^1.2.4`).

Para que Vite pueda servir archivos del fork (fuera del root) está configurado
`server.fs.allow: ['..']`.

## Comandos

```bash
npm run dev          # Playground en http://localhost:5173 consumiendo el fork local
npm run build        # Build de la librería (tsc -p tsconfig.lib.json && vite build)
npm run lint         # ESLint
```

Si además querés iterar sobre el fork con su propio watch (opcional, no es necesario con el alias a
`src`):

```bash
# En el repo del fork:
cd ../json-schema-form && npm run dev   # tsup --watch (reconstruye dist)
```

## El playground

`src/App.tsx` es el playground de desarrollo. Tras la limpieza para el rebuild v2 quedó como un
**placeholder**; se irá poblando con demos a medida que se implementen el store, los hooks y las
secciones (ver `ARCHITECTURE_V2.md`).

> Los demos/examples de v1 (`src/demo/`, `examples/`) fueron **eliminados**: ejercitaban una API que
> se está reemplazando. El nuevo playground se construye sobre la API v2 (componible).

## Tipos en el editor

`tsconfig.app.json` mapea `@laus/uiform` → `src/lib/index.ts` para que el editor resuelva igual que
Vite. `@laus/json-schema-form` se resuelve desde `node_modules` (la versión instalada) para tipos
estables. El build de la librería usa `tsconfig.lib.json`, que **excluye** el playground
(`src/App.tsx`, `src/main.tsx`).
