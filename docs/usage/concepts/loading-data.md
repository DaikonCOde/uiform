# Cargar datos en el formulario

Hay dos formas de meter datos en un form, según **cuándo** los tenés disponibles:

| Cuándo llegan los datos | Usá | Comportamiento |
|-------------------------|-----|----------------|
| Ya están al montar (sincrónicos) | `initialValues` | Semilla inicial del store. |
| Llegan **después** (fetch que resuelve post-mount) | `hydrate()` | Mergea sin pisar lo que el usuario ya tocó. |

## `initialValues`: datos sincrónicos al montar

Si los valores ya existen cuando renderizás el form, pasalos como `initialValues` al
[`<FormProvider>`](../components/form-provider.md):

```tsx
<FormProvider
  schema={schema}
  uiSchema={uiSchema}
  initialValues={{ nombre: 'Ada', email: 'ada@ejemplo.com' }}
>
  {/* … */}
</FormProvider>
```

`initialValues` se lee **una sola vez**, al crear el store. **Cambiarlo después NO recrea el form** y NO
re-siembra los valores: es a propósito. Si la prop estuviera atada a la recreación, un fetch de edición
que resuelve tarde recrearía el store y **borraría lo que el usuario ya tipeó**.

> Por eso, para datos que llegan de forma asíncrona, `initialValues` **no** es la herramienta. Usá
> `hydrate()`.

## `hydrate()`: datos async sin pisar lo tocado

Para el caso típico de **edición** —montás el form vacío (o con un esqueleto), disparás un fetch, y los
datos llegan después— usás [`useFormApi().hydrate(values)`](../hooks/use-form-api.md). Mergea los valores
recibidos **respetando los campos que el usuario ya tocó** (`touched`): un valor que viene del fetch no
sobreescribe lo que la persona ya empezó a editar.

```tsx
import { useEffect } from 'react'
import { useFormApi } from '@laus/uiform'

function EditorUsuario({ userId }: { userId: string }) {
  const { hydrate } = useFormApi()

  useEffect(() => {
    let cancelado = false
    fetch(`/api/usuarios/${userId}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelado) hydrate(data) // mergea sin pisar lo que el usuario ya tocó
      })
    return () => {
      cancelado = true
    }
  }, [userId, hydrate])

  return null // este componente solo orquesta la carga
}
```

`hydrate` es una **acción estable** (su identidad no cambia entre renders), así que es seguro ponerla en
las dependencias del `useEffect`.

## Feedback al guardar: `submitError`

Cuando tu `onSubmit` falla (la API tira un error), UIForm **no re-lanza** la excepción —`submit()` suele
dispararse desde un `onClick` y un throw quedaría como unhandled rejection—. En su lugar, guarda el
mensaje en [`useFormApi().submitError`](../hooks/use-form-api.md) para que muestres feedback:

```tsx
import { useFormApi } from '@laus/uiform'

function BarraGuardar() {
  const { submit, isSubmitting, isValid, submitError } = useFormApi()

  return (
    <div>
      <button disabled={!isValid || isSubmitting} onClick={() => submit()}>
        {isSubmitting ? 'Guardando…' : 'Guardar'}
      </button>
      {submitError && <p role="alert">Error al guardar: {submitError}</p>}
    </div>
  )
}
```

`submitError` es `string | null`. Se **limpia al re-enviar** (cada `submit()` lo resetea a `null` antes de
intentar de nuevo), así que el mensaje de error no queda pegado tras un reintento exitoso.

> El submit valida primero: si hay errores de validación, `onSubmit` **no** se ejecuta y `submitError`
> queda en `null`. `submitError` solo refleja errores que tira **tu** `onSubmit` (ver
> [Validación](./validation.md)).

## Nota sobre `setValues`

Además de `hydrate`, el store expone `setValues(values)`, que hace un **merge parcial**: combina los
valores que pasás con los actuales, sin reemplazar todo el form. La diferencia con `hydrate`:

- `setValues` mergea **siempre**, incluso sobre campos tocados.
- `hydrate` mergea **respetando `touched`** (no pisa lo que el usuario editó).

Para edición async preferí `hydrate`. Usá `setValues` cuando querés actualizar valores
programáticamente sin importar el estado de edición del usuario.

## Ejemplo completo: form de edición

```tsx
import { useEffect } from 'react'
import { FormProvider, useFormApi } from '@laus/uiform'

function CargaInicial({ userId }: { userId: string }) {
  const { hydrate } = useFormApi()
  useEffect(() => {
    fetch(`/api/usuarios/${userId}`)
      .then((r) => r.json())
      .then(hydrate)
  }, [userId, hydrate])
  return null
}

function Acciones() {
  const { submit, isSubmitting, isValid, submitError } = useFormApi()
  return (
    <>
      <button disabled={!isValid || isSubmitting} onClick={() => submit()}>
        {isSubmitting ? 'Guardando…' : 'Guardar cambios'}
      </button>
      {submitError && <p role="alert">No se pudo guardar: {submitError}</p>}
    </>
  )
}

export function EditarUsuario({ userId }: { userId: string }) {
  return (
    <FormProvider
      schema={schema}
      uiSchema={uiSchema}
      onSubmit={async (json) => {
        const res = await fetch(`/api/usuarios/${userId}`, {
          method: 'PUT',
          body: JSON.stringify(json),
        })
        if (!res.ok) throw new Error('El servidor rechazó los cambios')
      }}
    >
      <CargaInicial userId={userId} />
      {/* …campos… */}
      <Acciones />
    </FormProvider>
  )
}
```

El form monta vacío, `CargaInicial` lo hidrata cuando el fetch resuelve, y si el `PUT` falla, el `throw`
queda en `submitError` para mostrarlo. Mientras tanto, si el usuario ya empezó a editar un campo, ese
campo **no** se pisa al hidratar.

## Links

- [`useFormApi`](../hooks/use-form-api.md)
- [`<FormProvider>`](../components/form-provider.md)
- [Validación](./validation.md)
- [Modelo `schema` + `uiSchema`](./schema-and-uischema.md)
