# @lowdefy/block-utils

Runtime utilities for block components.

## Overview

Provides browser-side utilities for:

- Safe HTML rendering
- Error boundaries
- Block schema defaults
- Tailwind CSS class merging (`cn`)

## Installation

```javascript
import { ErrorBoundary, HtmlComponent, cn } from '@lowdefy/block-utils';
```

## Functions

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

## Build Utilities

### extractBlockTypes(metas)

Derives plugin type information from a metas barrel export. Used by each block package's `types.js` to produce the types object that the build pipeline reads.

```javascript
import { extractBlockTypes } from '@lowdefy/block-utils';
import * as metas from './metas.js';

export default extractBlockTypes(metas);
// Returns:
// {
//   blocks: ['Anchor', 'Box', 'Icon'],
//   icons: { Anchor: ['AiOutlineLoading3Quarters'], Box: [], Icon: [] },
//   blockMetas: {
//     Anchor: { category: 'display', cssKeys: ['element'] },
//     Box: { category: 'container', slots: ['content'] },
//     Icon: { category: 'display' },
//   }
// }
```

**Input:** `metas` — object with block names as keys and meta objects as values (typically a namespace import of `metas.js`).

**Output:** `{ blocks, icons, blockMetas }` where:

- `blocks` — array of block type names
- `icons` — map of block name → icon name arrays
- `blockMetas` — map of block name → `{ category, valueType?, initValue?, slots?, cssKeys? }` (cssKeys are reduced to an array of key names)

### buildBlockSchema(meta)

Generates a full JSON Schema for a block from its `meta.js` object. Used by `writeBlockSchemaMap` at build time.

```javascript
import { buildBlockSchema } from '@lowdefy/block-utils';

const schema = buildBlockSchema(meta);
// Generates schema with: id, type, layout, visible, required, properties,
// class (with --block + --{cssKey} entries), style, events
// Containers also get: blocks, areas
```

The generated schema includes:

- **`class`** — validates `--block` and `--{cssKey}` entries from `meta.cssKeys`
- **`style`** — validates `--block` and `--{cssKey}` entries for inline styles
- **`events`** — validates event names from `meta.events`
- **`properties`** — uses `meta.properties` directly
- **Container blocks** (`meta.category === 'container'`) also get `blocks` and `areas` properties

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
- `dompurify` (3.2.4)
- `@lowdefy/helpers` (4.7.0)
- `clsx` (2.1.1)
- `tailwind-merge` (2.6.0)

## Usage Examples

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

| File                       | Purpose                                 |
| -------------------------- | --------------------------------------- |
| `src/extractBlockTypes.js` | Derive types from metas barrel          |
| `src/buildBlockSchema.js`  | Generate JSON Schema from meta          |
| `src/cn.js`                | Tailwind class merging (clsx + twMerge) |
| `src/renderHtml.js`        | HTML sanitization                       |
| `src/ErrorBoundary.js`     | Error boundary component                |
| `src/HtmlComponent.js`     | Safe HTML component                     |
| `src/blockSchema.js`       | Default block schema                    |
| `src/withBlockDefaults.js` | Block default props wrapper             |
