# UIForm

A React form library built on JSON Schema with Ant Design components and responsive layouts.

> **Status — v2 feature-complete (pre-release).** The `schema` + `uiSchema` API is implemented and
> verified end-to-end in the browser, and the public exports are wired in `src/lib/index.ts`
> (`FormProvider`, `Field`, `FormSection`, `SubmitButton`, `UIForm`, hooks, types). Pending post-v1:
> root-level responsive grid (no `ui:layout` API yet). Run the playground with `npm run dev`.
> See [docs/ROADMAP_V2.md](./docs/ROADMAP_V2.md) and [docs/REVIEW_V2.md](./docs/REVIEW_V2.md).

## Features

- 🎯 **JSON Schema-based**: Define forms using standard JSON Schema
- 📱 **Responsive Layouts**: Built-in responsive grid system with mobile-first approach
- 🎨 **Ant Design**: Uses Ant Design components for a polished UI
- 🔄 **Async Options**: Support for dynamic option loading in Select/Autocomplete fields
- 📝 **TypeScript**: Full TypeScript support with type definitions
- ⚡ **Validation**: Automatic validation based on JSON Schema
- 🎛️ **Customizable**: Configurable layouts, sizes, and validation triggers

## Installation

### From GitHub

```bash
npm install DaikonCOde/uiform
```

Or with a specific version/tag:

```bash
npm install DaikonCOde/uiform#v0.1.0
```

Or clone and link locally:

```bash
git clone https://github.com/DaikonCOde/uiform.git
cd uiform
npm install
npm run build:lib
npm link
```

Then in your project:

```bash
npm link @laus/uiform
```

### Peer Dependencies

This library is compatible with **React 17 and 18**:

**For React 18 projects (recommended):**
```bash
npm install react@18 react-dom@18 antd@5
```

**For React 17 projects:**
```bash
npm install react@17 react-dom@17 antd@4
```

> **Note**: Ant Design 5 requires React 18+. If you're using React 17, you must use Ant Design 4.

### Dependencies

This library also requires:

```bash
npm install @laus/json-schema-form dayjs
```

## Two-document model (schema + uiSchema)

UIForm follows the [RJSF](https://rjsf-team.github.io/react-jsonschema-form) model: a **`schema`** that
describes the *data* (types, validation) and a separate **`uiSchema`** that describes the *presentation*
(which widget, placeholder, sections). You never write `x-jsf-*` by hand.

```tsx
import { FormProvider, Field, useFormApi } from '@laus/uiform'
import '@laus/uiform/style.css'
import { Button } from 'antd'

// WHAT the data is (validation lives here)
const schema = {
  type: 'object',
  required: ['firstName', 'email'],
  properties: {
    firstName: { type: 'string', title: 'First name' },
    email:     { type: 'string', title: 'Email', format: 'email' },
  },
}

// HOW it looks
const uiSchema = {
  firstName: { 'ui:widget': 'text',  'ui:placeholder': 'Jane', 'ui:autofocus': true },
  email:     { 'ui:widget': 'email', 'ui:placeholder': 'jane@mail.com' },
}

function MyForm() {
  return (
    <FormProvider
      schema={schema}
      uiSchema={uiSchema}
      onSubmit={(values) => console.log('valid payload:', values)}
      config={{ validateTrigger: 'onChange' }}
    >
      <Field name="firstName" />
      <Field name="email" />
      <SubmitBar />
    </FormProvider>
  )
}

function SubmitBar() {
  const { submit, isSubmitting } = useFormApi()
  return <Button type="primary" loading={isSubmitting} onClick={() => submit()}>Submit</Button>
}
```

`onSubmit` receives the JSON payload and is only called when validation passes.

## Supported Field Types

- Text input (`text`, `email`, `hidden`)
- Number input (`number`, `money`)
- Textarea (`textarea`)
- Select dropdown (`select`)
- Autocomplete with search (`autocomplete`)
- Radio buttons (`radio`)
- Checkbox (`checkbox`)
- Date picker (`date`)
- File upload (`file`)
- Fieldset (grouped fields)
- Group Array (repeatable field groups)

## Documentation

Full guide: **[docs/usage/index.md](./docs/usage/index.md)** — organized into small, focused pages:

- **Concepts** — `schema` + `uiSchema` model, `uiSchema` reference, sections, async options, validation, performance
- **Components** — `<FormProvider>`, `<Field>`
- **Hooks** — `useField`, `useWatch`, `useFormApi`, `useAsyncOptions`, `useFormStore`
- **Widgets** — one page per field type (text, number, select, autocomplete, checkbox, date, file, fieldset, group-array, …)

Internal design docs: [ARCHITECTURE_V2.md](./docs/ARCHITECTURE_V2.md) · [ROADMAP_V2.md](./docs/ROADMAP_V2.md) · [REVIEW_V2.md](./docs/REVIEW_V2.md)

## Development

### Building the Library

```bash
npm run build:lib
```

### Running the Demo

```bash
npm run dev
```

### Linting

```bash
npm run lint
```

## Architecture

This library is built on top of:

- **[@laus/json-schema-form](https://github.com/DaikonCOde/json-schema-form)**: Headless JSON Schema form library
- **[Ant Design](https://ant.design/)**: React UI component library
- **React**: UI framework
- **TypeScript**: Type safety

See [CLAUDE.md](./CLAUDE.md) for detailed architecture documentation.

## License

MIT

## Contributing

Contributions are welcome! Please read the contributing guidelines before submitting PRs.

## Publishing

This library is published on GitHub. To install it in your project:

```bash
npm install DaikonCOde/uiform
```

To publish a new version:

1. Update the version in `package.json`
2. Create a git tag: `git tag v0.1.0`
3. Push the tag: `git push origin v0.1.0`
4. Users can then install: `npm install DaikonCOde/uiform#v0.1.0`
