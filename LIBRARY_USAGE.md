# UIForm Library - Usage Guide

## Installation

```bash
npm install @yourorg/uiform
```

### Peer Dependencies

Make sure you have the required peer dependencies installed:

```bash
npm install react react-dom antd
```

## Basic Usage

### 1. Import the Component and Styles

```typescript
import { UIForm } from '@yourorg/uiform'
import '@yourorg/uiform/style.css'
import type { UIFormProps, AsyncOptionsLoader } from '@yourorg/uiform'
```

### 2. Create a JSON Schema

```typescript
import type { JsfObjectSchema } from '@yourorg/uiform'

const schema: JsfObjectSchema = {
  type: "object",
  title: "User Registration",
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
    },
    country: {
      title: "Country",
      type: "number",
      "x-jsf-presentation": {
        inputType: "select",
        options: [
          { label: "USA", value: 1 },
          { label: "Canada", value: 2 }
        ]
      }
    }
  },
  required: ["firstName", "email"]
}
```

### 3. Use the UIForm Component

```typescript
import { useState } from 'react'

function MyForm() {
  const [formData, setFormData] = useState<any>(null)

  const handleSubmit = async (values: any, errors?: any) => {
    if (!errors || Object.keys(errors).length === 0) {
      console.log('Form submitted:', values)
      setFormData(values)
    }
  }

  const handleChange = (values: any, errors?: any) => {
    console.log('Form changed:', values)
  }

  return (
    <UIForm
      schema={schema}
      initialValues={{}}
      onSubmit={handleSubmit}
      onChange={handleChange}
      config={{
        layout: 'vertical',
        size: 'middle',
        showRequiredMark: true,
        validateTrigger: 'onChange'
      }}
    />
  )
}
```

## Responsive Layouts

UIForm supports responsive grid layouts using the `x-jsf-layout` property:

```typescript
const responsiveSchema: JsfObjectSchema = {
  type: "object",
  "x-jsf-layout": {
    type: "columns",
    columns: 4,
    gap: "16px",
    responsive: {
      sm: 1,  // 1 column on mobile
      md: 2,  // 2 columns on tablet
      lg: 4   // 4 columns on desktop
    }
  },
  properties: {
    firstName: {
      title: "First Name",
      type: "string",
      "x-jsf-layout": {
        colSpan: {
          sm: 1,  // Span 1 column on mobile
          md: 2,  // Span 2 columns on tablet
          lg: 3   // Span 3 columns on desktop
        }
      },
      "x-jsf-presentation": {
        inputType: "text"
      }
    }
  }
}
```

### Breakpoints

- `sm`: 0px (mobile)
- `md`: 768px (tablet)
- `lg`: 1024px (desktop)
- `xl`: 1280px (large desktop)

## Async Options Loading

For Select and Autocomplete fields that load options dynamically:

```typescript
const asyncLoaders: Record<string, AsyncOptionsLoader> = {
  countriesLoader: async (context) => {
    const { formValues, search } = context

    // Fetch options based on form state or search query
    const response = await fetch(`/api/countries?search=${search}`)
    const data = await response.json()

    return {
      options: data.map(item => ({
        label: item.name,
        value: item.id
      }))
    }
  }
}

const schemaWithAsync: JsfObjectSchema = {
  type: "object",
  properties: {
    country: {
      title: "Country",
      type: "number",
      "x-jsf-presentation": {
        inputType: "select",
        asyncOptions: {
          id: "countriesLoader",
          dependencies: [] // Optional: list of field names to watch
        }
      }
    }
  }
}

// Use in component
<UIForm
  schema={schemaWithAsync}
  asyncLoaders={asyncLoaders}
  onSubmit={handleSubmit}
/>
```

## Field Types

UIForm supports all major field types:

- **text**: Text input (`inputType: "text"`)
- **email**: Email input (`inputType: "email"`)
- **number**: Number input (`inputType: "number"`)
- **textarea**: Textarea (`inputType: "textarea"`)
- **select**: Dropdown select (`inputType: "select"`)
- **autocomplete**: Autocomplete with search (`inputType: "autocomplete"`)
- **radio**: Radio buttons (`inputType: "radio"`)
- **checkbox**: Checkbox (`inputType: "checkbox"`)
- **date**: Date picker (`inputType: "date"`)
- **file**: File upload (`inputType: "file"`)

## Configuration Options

```typescript
interface UIFormConfig {
  showRequiredMark?: boolean      // Show asterisk for required fields
  validateTrigger?: 'onChange' | 'onBlur' | 'onSubmit'
  size?: 'small' | 'middle' | 'large'
  layout?: 'horizontal' | 'vertical' | 'inline'
  disabled?: boolean               // Disable entire form
}
```

## TypeScript Support

The library is fully typed. Import types as needed:

```typescript
import type {
  UIFormProps,
  UIFormConfig,
  BaseFieldProps,
  TextFieldProps,
  SelectFieldProps,
  AsyncOptionsLoader,
  JsfObjectSchema,
  Field
} from '@yourorg/uiform'
```

## Advanced: Custom Field Rendering

You can also import and use individual field components:

```typescript
import {
  TextField,
  SelectField,
  AutocompleteField,
  DateField
} from '@yourorg/uiform'
```

## Advanced: Form Context

Access form values from nested components:

```typescript
import { FormProvider, useFormContext } from '@yourorg/uiform'

function NestedComponent() {
  const { formValues, updateFormValue } = useFormContext()

  return (
    <div>
      Current values: {JSON.stringify(formValues)}
    </div>
  )
}

// Wrap your component with FormProvider
<FormProvider initialValues={{}}>
  <NestedComponent />
</FormProvider>
```

## Validation

Validation is automatic based on your JSON Schema:

```typescript
const schema: JsfObjectSchema = {
  type: "object",
  properties: {
    email: {
      title: "Email",
      type: "string",
      format: "email",  // Automatic email validation
      "x-jsf-errorMessage": {
        required: "Email is required",
        format: "Please enter a valid email"
      },
      "x-jsf-presentation": {
        inputType: "email"
      }
    },
    age: {
      title: "Age",
      type: "number",
      minimum: 18,
      maximum: 100,
      "x-jsf-presentation": {
        inputType: "number"
      }
    }
  },
  required: ["email", "age"]
}
```

## Example: Complete Form

```typescript
import { UIForm } from '@yourorg/uiform'
import '@yourorg/uiform/style.css'
import type { JsfObjectSchema, AsyncOptionsLoader } from '@yourorg/uiform'

const schema: JsfObjectSchema = {
  type: "object",
  title: "User Profile",
  "x-jsf-layout": {
    type: "columns",
    columns: 2,
    gap: "16px",
    responsive: {
      sm: 1,
      md: 2,
      lg: 2
    }
  },
  properties: {
    firstName: {
      title: "First Name",
      type: "string",
      "x-jsf-presentation": { inputType: "text" }
    },
    lastName: {
      title: "Last Name",
      type: "string",
      "x-jsf-presentation": { inputType: "text" }
    },
    email: {
      title: "Email",
      type: "string",
      format: "email",
      "x-jsf-presentation": { inputType: "email" }
    },
    birthDate: {
      title: "Birth Date",
      type: "string",
      "x-jsf-presentation": { inputType: "date" }
    },
    country: {
      title: "Country",
      type: "number",
      "x-jsf-presentation": {
        inputType: "select",
        asyncOptions: { id: "countriesLoader" }
      }
    },
    bio: {
      title: "Bio",
      type: "string",
      "x-jsf-layout": { colSpan: { sm: 1, md: 2, lg: 2 } },
      "x-jsf-presentation": { inputType: "textarea" }
    }
  },
  required: ["firstName", "lastName", "email"]
}

const asyncLoaders: Record<string, AsyncOptionsLoader> = {
  countriesLoader: async () => {
    const response = await fetch('/api/countries')
    const data = await response.json()
    return { options: data }
  }
}

function ProfileForm() {
  const handleSubmit = async (values: any) => {
    console.log('Submitted:', values)
    // Send to API
  }

  return (
    <UIForm
      schema={schema}
      asyncLoaders={asyncLoaders}
      onSubmit={handleSubmit}
      config={{
        layout: 'vertical',
        size: 'large',
        showRequiredMark: true,
        validateTrigger: 'onChange'
      }}
    />
  )
}
```

## Building and Publishing

To build the library:

```bash
npm run build:lib
```

To publish to npm:

```bash
npm publish
```

## Notes

- The library uses Ant Design components internally, so users must have `antd` installed
- CSS must be imported separately: `import '@yourorg/uiform/style.css'`
- The library supports both ESM (`import`) and UMD (`require`) module formats
- Full TypeScript support with declaration files included
