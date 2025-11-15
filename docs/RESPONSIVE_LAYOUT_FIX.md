# Responsive Layout Fix

## Problem

The `x-jsf-layout` property with responsive `colSpan` values was not being applied correctly. When a field had `colSpan: { sm: 1, md: 2, lg: 4 }`, it would render in only 1 column regardless of screen size, instead of spanning 4 columns on large screens.

## Root Cause

The issue was in `src/utils/responsive-layout.ts`:

1. **Incorrect CSS Generation**: The `generateFieldResponsiveCSS` function was trying to parse CSS returned by the json-schema-form library's `generateResponsiveFieldCSS()` function and add class selectors using regex replacement. However, the regex wasn't working correctly and produced malformed CSS.

2. **Missing Mobile-First Base Styles**: The library's function only generates media queries but doesn't generate base (mobile) styles without media queries, which is essential for mobile-first design.

3. **Improper CSS Format**: The generated CSS wasn't properly wrapping properties in class selectors with correct syntax.

## Solution

Rewrote the CSS generation functions to:

1. **Generate CSS directly** instead of relying on regex transformations of library output
2. **Use mobile-first approach**: Base styles for `sm` breakpoint without media queries, then progressive enhancement with media queries for `md`, `lg`, `xl`
3. **Proper CSS structure**: Correctly formatted CSS with class selectors and media queries

### Before (Broken)

```typescript
// Attempted to transform library output with regex
const responsiveCSS = generateResponsiveFieldCSS(fieldLayout);
return responsiveCSS.replace(/(@media[^{]+\{[^}]*\})/g, (match) => {
  return match.replace(/\{/, `{ .${className} `);
});
```

This produced malformed CSS like:
```css
@media (min-width: 768px) { .field-name  grid-column: span 2; }
```

### After (Fixed)

```typescript
// Generate CSS directly with proper structure
Object.entries(breakpoints).forEach(([breakpoint, minWidth]) => {
  const span = colSpan[breakpoint];
  if (span !== undefined) {
    if (breakpoint === "sm") {
      // Base style (mobile-first)
      css += `.${className} { grid-column: span ${span}; }\n`;
    } else {
      // Media queries for larger screens
      css += `@media (min-width: ${minWidth}) {
  .${className} { grid-column: span ${span}; }
}\n`;
    }
  }
});
```

This produces correct CSS:
```css
.ui-form-123-field-firstName {
  grid-column: span 1;
}
@media (min-width: 768px) {
  .ui-form-123-field-firstName {
    grid-column: span 2;
  }
}
@media (min-width: 1024px) {
  .ui-form-123-field-firstName {
    grid-column: span 4;
  }
}
```

## Changes Made

### Modified Functions

1. **`generateContainerResponsiveCSS`** (`src/utils/responsive-layout.ts:11-65`)
   - Simplified CSS generation
   - Added mobile-first base styles
   - Proper CSS formatting

2. **`generateFieldResponsiveCSS`** (`src/utils/responsive-layout.ts:70-113`)
   - Completely rewritten to generate CSS directly
   - Mobile-first approach with base styles
   - Proper grid-column span syntax

### Breakpoints

- `sm`: 0px (mobile, base styles without media query)
- `md`: 768px (tablet)
- `lg`: 1024px (desktop)
- `xl`: 1280px (large desktop)

## How to Verify

1. Start the dev server: `npm run dev`
2. Open the demo at `http://localhost:5174`
3. Inspect the page and look for `<style>` tags with IDs like `ui-form-{formId}-responsive`
4. Resize the browser window and observe fields spanning different numbers of columns based on screen size

### Example Schema

```typescript
{
  "firstName": {
    "title": "First Name",
    "type": "string",
    "x-jsf-layout": {
      "colSpan": {
        "sm": 1,  // 1 column on mobile
        "md": 2,  // 2 columns on tablet
        "lg": 3   // 3 columns on desktop
      }
    }
  }
}
```

With a container configured for 4 columns on desktop:
```typescript
"x-jsf-layout": {
  "type": "columns",
  "columns": 4,
  "responsive": {
    "sm": 1,  // 1 column on mobile
    "md": 2,  // 2 columns on tablet
    "lg": 4   // 4 columns on desktop
  }
}
```

## Testing

The fix has been verified to:
- ✅ Generate valid CSS
- ✅ Apply correct column spans at each breakpoint
- ✅ Use mobile-first approach (base styles + progressive media queries)
- ✅ Work with both container and field responsive layouts
- ✅ Clean up properly on component unmount
