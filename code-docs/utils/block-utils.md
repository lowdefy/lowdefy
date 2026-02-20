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

### makeCssClass(styles, styleObjectOnly)

Generate CSS classes using Emotion:

```javascript
// Simple styles
const className = makeCssClass({
  color: 'red',
  fontSize: '16px',
});

// With media queries (shorthand)
const responsiveClass = makeCssClass({
  fontSize: '14px',
  '@media sm': {
    fontSize: '16px',
  },
  '@media lg': {
    fontSize: '18px',
  },
});

// Style object only (no class generation)
const styleObject = makeCssClass({ color: 'blue' }, true);
```

**Media Query Shortcuts:**

| Shortcut | Breakpoint | CSS                                     |
| -------- | ---------- | --------------------------------------- |
| `xs`     | 576px      | `@media screen and (max-width: 576px)`  |
| `sm`     | 768px      | `@media screen and (max-width: 768px)`  |
| `md`     | 992px      | `@media screen and (max-width: 992px)`  |
| `lg`     | 1200px     | `@media screen and (max-width: 1200px)` |
| `xl`     | 1600px     | `@media screen and (max-width: 1600px)` |

### mediaToCssObject(styles, styleObjectOnly)

Transform shorthand media queries to CSS objects:

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

### blockDefaultProps

Standard prop defaults:

```javascript
import { blockDefaultProps } from '@lowdefy/block-utils';

const MyBlock = ({ properties, methods, ...rest }) => {
  // ...
};

MyBlock.defaultProps = blockDefaultProps;
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
import { makeCssClass, blockDefaultProps } from '@lowdefy/block-utils';

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

Button.defaultProps = blockDefaultProps;
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

| File                       | Purpose                    |
| -------------------------- | -------------------------- |
| `src/makeCssClass.js`      | CSS class generation       |
| `src/mediaToCssObject.js`  | Media query transformation |
| `src/renderHtml.js`        | HTML sanitization          |
| `src/ErrorBoundary.js`     | Error boundary component   |
| `src/HtmlComponent.js`     | Safe HTML component        |
| `src/blockSchema.js`       | Default block schema       |
| `src/blockDefaultProps.js` | Default props              |
