# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

UIForm is a React + TypeScript form library built on top of `@remoteoss/json-schema-form` (headless JSON Schema form library) and Ant Design components. It provides a declarative way to build complex forms with responsive layouts, async data loading, and validation.

**Important**: This project depends on a local package `@remoteoss/json-schema-form` located at `/Users/alexocsa/Documents/dev/projects/json-schema-form`. Changes to the core json-schema-form library should be made in that repository.

## Common Commands

```bash
# Development
npm run dev          # Start Vite dev server with HMR

# Build
npm run build        # Type-check with tsc and build for production
tsc -b              # Type-check only (without building)

# Linting
npm run lint         # Run ESLint on the codebase

# Preview
npm run preview      # Preview production build locally
```

## Architecture

### Core Architecture Pattern

The form system uses a **headless + presentation layer** architecture:

1. **Headless Layer** (`@remoteoss/json-schema-form`): Handles schema parsing, validation, field generation, and layout computation
2. **Presentation Layer** (this repo): Maps headless fields to Ant Design components

### Key Components

**UIForm** (`src/components/form/UIForm.tsx`): Main form component that:
- Wraps form logic in `FormProvider` for React Context
- Uses `createHeadlessForm()` to generate fields from JSON Schema
- Manages form state (values, errors, submission)
- Handles responsive CSS injection via `useResponsiveCSS` hook
- Delegates field rendering to `useFieldRenderer` hook

**FormProvider/FormContext** (`src/context/`):
- Provides form-wide state management using `useReducer`
- Manages `formValues` and `asyncOptionsCache` (for Select/Autocomplete fields)
- Used by fields with dependencies (e.g., Select fields that depend on other field values)

**Field Components** (`src/components/fields/`):
- Each component (TextField, SelectField, AutocompleteField, etc.) wraps an Ant Design component
- Receives standardized props from `BaseFieldProps` (value, error, onChange, onBlur, etc.)
- AutocompleteField and SelectField support async options loading via `asyncLoaders` prop

**useFieldRenderer** (`src/hooks/useFieldRenderer.tsx`):
- Maps `inputType` strings to React components via `FIELD_COMPONENT_MAP`
- Allows custom component overrides
- Recursively renders nested fields (fieldset, group-array)

### Responsive Layout System

The responsive layout system generates dynamic CSS at runtime:

1. **Schema Definition**: Use `x-jsf-layout` with responsive breakpoints (sm, md, lg, xl)
2. **CSS Generation**: `useResponsiveCSS` hook generates mobile-first CSS Grid styles
3. **CSS Injection**: Dynamically injects `<style>` tags into `<head>` with unique IDs per form instance
4. **Cleanup**: Automatically removes styles on unmount

Breakpoints: sm (mobile, 0px), md (tablet, 768px), lg (desktop, 1024px), xl (large desktop, 1280px)

### JSON Schema Extensions

This library uses custom JSON Schema extensions from `@remoteoss/json-schema-form`:

- `x-jsf-presentation`: Input type, options, async options config
- `x-jsf-layout`: Column span (responsive), positioning
- `x-jsf-errorMessage`: Custom validation messages

### Data Flow

1. **Schema → Fields**: `createHeadlessForm(schema)` generates field definitions
2. **Field Values**: Stored in local state (`values`) and synced to FormContext
3. **Validation**: `handleValidation()` validates against schema on onChange/onBlur/onSubmit
4. **Form Submission**: `formValuesToJsonValues()` transforms UI values back to JSON Schema format

## Important Patterns

### Async Options Loading

For Select and Autocomplete fields with dynamic options:

```typescript
const asyncLoaders: Record<string, AsyncOptionsLoader> = {
  myLoaderId: async (context) => {
    const { formValues, search } = context
    // Fetch options based on form state or search query
    return { options: [...] }
  }
}

// In schema:
{
  "x-jsf-presentation": {
    "inputType": "select",
    "asyncOptions": {
      "id": "myLoaderId",
      "dependencies": ["otherFieldName"] // Optional
    }
  }
}
```

### Avoiding Render Loops

**Critical**: The AutocompleteField component has special handling to avoid infinite render loops:
- Uses controlled component pattern with internal state
- Debounces search input
- Carefully manages useEffect dependencies
- See `src/components/fields/AutocompleteField.tsx:47-120` for the pattern

When modifying AutocompleteField or similar components, ensure:
1. Value changes don't trigger unnecessary option reloads
2. useEffect dependencies are minimal and stable
3. Async operations are properly canceled on unmount

### Form Context Usage

Fields that need access to other field values should use `useFormContext()`:

```typescript
import { useFormContext } from '../../hooks/useFormContext'

const { formValues, updateFormValue } = useFormContext()
```

## Styling

- **CSS Modules** for component-scoped styles (e.g., `UIForm.module.css`, `Field.module.css`)
- **Global styles** in `src/index.css` and `src/App.css`
- **Ant Design theming** via Ant Design's built-in theme system
- **Dynamic responsive CSS** injected at runtime (see Responsive Layout System)

## Type Safety

- All field components extend `BaseFieldProps` from `src/types/types.d.ts`
- Union type `FieldProps` provides discriminated union for all field types
- `@remoteoss/json-schema-form` types are imported for schema definitions
