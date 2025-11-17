# UIForm

A React form library built on JSON Schema with Ant Design components and responsive layouts.

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

Make sure to install the required peer dependencies:

```bash
npm install react react-dom antd
```

### Dependencies

This library also requires:

```bash
npm install @laus/json-schema-form dayjs
```

## Quick Start

```typescript
import { UIForm } from '@laus/uiform'
import '@laus/uiform/dist/style.css'
import type { JsfObjectSchema } from '@laus/uiform'

const schema: JsfObjectSchema = {
  type: "object",
  properties: {
    firstName: {
      title: "First Name",
      type: "string",
      "x-jsf-presentation": {
        inputType: "text"
      }
    },
    email: {
      title: "Email",
      type: "string",
      format: "email",
      "x-jsf-presentation": {
        inputType: "email"
      }
    }
  },
  required: ["firstName", "email"]
}

function MyForm() {
  const handleSubmit = async (values: any, errors?: any) => {
    if (!errors || Object.keys(errors).length === 0) {
      console.log('Form submitted:', values)
    }
  }

  return (
    <UIForm
      schema={schema}
      onSubmit={handleSubmit}
      config={{
        layout: 'vertical',
        size: 'middle'
      }}
    />
  )
}
```

## Responsive Layouts

Create responsive forms that adapt to different screen sizes:

```typescript
const schema: JsfObjectSchema = {
  type: "object",
  "x-jsf-layout": {
    type: "columns",
    columns: 4,
    responsive: {
      sm: 1,  // 1 column on mobile
      md: 2,  // 2 columns on tablet
      lg: 4   // 4 columns on desktop
    }
  },
  properties: {
    title: {
      title: "Title",
      type: "string",
      "x-jsf-layout": {
        colSpan: {
          sm: 1,
          md: 2,
          lg: 4  // Spans full width on desktop
        }
      }
    }
  }
}
```

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

See [LIBRARY_USAGE.md](./LIBRARY_USAGE.md) for comprehensive documentation including:

- Detailed API reference
- Responsive layout guide
- Async options loading
- Validation examples
- TypeScript usage
- Advanced features

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
