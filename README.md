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

```bash
npm install @yourorg/uiform
```

### Peer Dependencies

```bash
npm install react react-dom antd
```

## Quick Start

```typescript
import { UIForm } from '@yourorg/uiform'
import '@yourorg/uiform/style.css'
import type { JsfObjectSchema } from '@yourorg/uiform'

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

- **[@remoteoss/json-schema-form](https://github.com/remoteoss/json-schema-form)**: Headless JSON Schema form library
- **[Ant Design](https://ant.design/)**: React UI component library
- **React**: UI framework
- **TypeScript**: Type safety

See [CLAUDE.md](./CLAUDE.md) for detailed architecture documentation.

## License

MIT

## Contributing

Contributions are welcome! Please read the contributing guidelines before submitting PRs.

## Publishing

Before publishing:

1. Update the `name` field in `package.json` to your organization/package name
2. Update the `repository` URL in `package.json`
3. Set the `author` field in `package.json`
4. Update all references to `@yourorg/uiform` in documentation

To publish:

```bash
npm publish
```

For scoped packages:

```bash
npm publish --access public
```
