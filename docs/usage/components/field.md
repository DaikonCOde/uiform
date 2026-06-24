# `<Field>`

Renderiza UN campo por su `name`. Es un **controlador**: resuelve la suscripción granular del campo
(value/error/touched) y delega en el componente presentacional según el widget. Los campos se renderizan
donde quieras, en cualquier layout.

Como cada `<Field>` se suscribe solo a su slice del store, **tipear en un campo re-renderiza solo ese
campo** (ver [Performance](../concepts/performance.md)).

## Props

| Prop | Tipo | Descripción |
|------|------|-------------|
| `name` | `string` | Nombre de la property del schema a renderizar (requerido). |

## Composición libre

No hay un layout impuesto: ponés cada `<Field>` donde lo necesites.

```tsx
<div className="mi-grid">
  <Field name="nombre" />
  <Field name="email" />

  <fieldset>
    <legend>Dirección</legend>
    <Field name="calle" />
    <Field name="ciudad" />
  </fieldset>
</div>
```

## Cómo elige el widget

`<Field>` lee el `inputType` resuelto del motor (que sale de `ui:widget`, o se infiere del `type`/`format`
del schema cuando no lo especificás) y mapea a un componente presentacional. Un `inputType` sin componente
registrado renderiza un aviso (no rompe el form).

Para la tabla de `ui:widget` → componente ver el [índice de widgets](../widgets/index.md).

> Los contenedores ([`fieldset`](../widgets/fieldset.md), [`group-array`](../widgets/group-array.md))
> renderizan a sus propios hijos: alcanza con un solo `<Field name="direccion" />`.

## Ver también

- [`useField`](../hooks/use-field.md) — el hook que `<Field>` usa por dentro; útil para UI custom.
- [Índice de widgets](../widgets/index.md) — qué componente resuelve cada widget.
- [`<FormProvider>`](./form-provider.md) — el contexto que `<Field>` necesita.
