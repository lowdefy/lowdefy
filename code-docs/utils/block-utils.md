# @lowdefy/block-utils

Runtime utilities for block components.

## Overview

Provides browser-side utilities for:

- CSS class generation with media queries
- Safe HTML rendering
- Error boundaries
- Block schema defaults

## Installation

```javascript
import { makeCssClass, ErrorBoundary, HtmlComponent } from '@lowdefy/block-utils';
```

## Functions

### makeCssClass (deprecated)

> **Note:** `makeCssClass()` has been removed as part of the antd v6 upgrade. Blocks now receive `className` and `style` props directly. See `@lowdefy/client` for the new pattern where `classNames.block`/`styles.block` are passed to BlockLayout.

### mediaToCssObject(styles, styleObjectOnly)

Transform shorthand media queries to CSS objects. Breakpoint values align with Tailwind CSS v4:

| Shortcut | Breakpoint | CSS                                     |
| -------- | ---------- | --------------------------------------- |
| `xs`     | 640px      | `@media screen and (max-width: 640px)`  |
| `sm`     | 768px      | `@media screen and (max-width: 768px)`  |
| `md`     | 1024px     | `@media screen and (max-width: 1024px)` |
| `lg`     | 1280px     | `@media screen and (max-width: 1280px)` |
| `xl`     | 1536px     | `@media screen and (max-width: 1536px)` |

The `xxl` breakpoint has been renamed to `2xl`.

```javascript
const input = {
  color: 'red',
  '@media sm': { color: 'blue' },
};

const output = mediaToCssObject(input);
// {
//   color: 'red',
//   '@media screen and (max-width: 768px)': { color: 'blue' }
// }
```

### renderHtml(html)

Render HTML string safely:

```javascript
import { renderHtml } from '@lowdefy/block-utils';

const sanitized = renderHtml('<script>alert("xss")</script><p>Safe content</p>');
// Returns: '<p>Safe content</p>'
```

## Components

### ErrorBoundary

React error boundary for catching render errors:

```javascript
import { ErrorBoundary } from '@lowdefy/block-utils';

<ErrorBoundary
  fullPage={true}
  name="ComponentName"
  message="Something went wrong"
  description="Please try again"
  fallback={(error) => <CustomError error={error} />}
>
  <RiskyComponent />
</ErrorBoundary>;
```

**Props:**

| Prop          | Type      | Description                                 |
| ------------- | --------- | ------------------------------------------- |
| `children`    | ReactNode | Components to wrap                          |
| `fallback`    | function  | Custom error handler `(error) => ReactNode` |
| `fullPage`    | boolean   | Show full-page error display                |
| `message`     | string    | Error message                               |
| `name`        | string    | Component name for debugging                |
| `description` | string    | Error description                           |

### HtmlComponent

Safe HTML rendering component:

```javascript
import { HtmlComponent } from '@lowdefy/block-utils';

<HtmlComponent html="<p>Safe <strong>HTML</strong></p>" />;
```

Uses DOMPurify for sanitization, removing:

- `<script>` tags
- Event handlers (`onclick`, etc.)
- `javascript:` URLs
- Other XSS vectors

## Constants

### blockSchema

Default JSON Schema for blocks:

```javascript
import { blockSchema } from '@lowdefy/block-utils';

// {
//   type: 'object',
//   properties: {
//     id: { type: 'string' },
//     type: { type: 'string' },
//     properties: { type: 'object' },
//     style: { type: 'object' },
//     layout: { type: 'object' },
//     events: { type: 'object' },
//     visible: { type: 'boolean' },
//     required: { type: 'boolean' },
//     validate: { type: 'array' }
//   },
//   required: ['id', 'type']
// }
```

## Dependencies

- React 18.2.0
- React-DOM 18.2.0
- `@emotion/css` (11.11.2)
- `dompurify` (3.2.4)
- `@lowdefy/helpers` (4.4.0)

## Usage Examples

### Styled Block

```javascript
import { makeCssClass } from '@lowdefy/block-utils';

const Button = ({ properties, methods }) => {
  const className = makeCssClass({
    padding: '8px 16px',
    backgroundColor: properties.color || 'blue',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    '@media sm': {
      padding: '6px 12px',
      fontSize: '14px',
    },
  });

  return (
    <button className={className} onClick={() => methods.triggerEvent({ name: 'onClick' })}>
      {properties.label}
    </button>
  );
};
```

### Block with HTML Content

```javascript
import { HtmlComponent, ErrorBoundary } from '@lowdefy/block-utils';

const RichText = ({ properties }) => {
  return (
    <ErrorBoundary name="RichText" message="Failed to render content">
      <div className="rich-text">
        <HtmlComponent html={properties.content} />
      </div>
    </ErrorBoundary>
  );
};
```

## Key Files

| File                      | Purpose                    |
| ------------------------- | -------------------------- |
| `src/makeCssClass.js`     | CSS class generation       |
| `src/mediaToCssObject.js` | Media query transformation |
| `src/renderHtml.js`       | HTML sanitization          |
| `src/ErrorBoundary.js`    | Error boundary component   |
| `src/HtmlComponent.js`    | Safe HTML component        |
| `src/blockSchema.js`      | Default block schema       |
