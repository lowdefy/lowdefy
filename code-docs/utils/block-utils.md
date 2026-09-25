# @lowdefy/block-utils

Runtime utilities for block components.

## Overview

Provides browser-side utilities for:

- Safe HTML rendering
- Error boundaries
- Block schema defaults
- Tailwind CSS class merging (`cn`)
- Lazy-loading heavy block implementations (`createLazyBlock`)

The package declares `"sideEffects": false`: no module runs code at import time and none imports CSS, so a bundler can drop every module a chunk does not use (a lazy block's wrapper chunk does not keep `HtmlComponent`'s DOMPurify).

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

The HTML is sanitized and assigned to `innerHTML` on mount and then only when the string (or the rendered element) changes. `renderHtml` sits behind most antd labels, titles and AgGrid cells, so re-sanitizing on every parent render was measurable, and it reset open `<details>`, media and text selection. DOMPurify has no hooks or config set, so the same string always sanitizes the same way.

**Attribute enhancements.** After sanitising, `HtmlComponent` gives four attributes meaning: `data-icon` (renders the app's Icon component into the element through a React portal), `data-tooltip` and `data-popover` / `data-popover-content` (a themed antd overlay anchored on the element), and — when the caller passes `onDataEvent` — `data-event` (click delegation with the other `data-*` attributes as the payload; `ClickableHtml` uses this). The pass runs only when the string contains one of those attribute names. It needs the Icon component, the icon map and the overlay, which the client hands over once through `registerHtmlEnhancements` in `initLowdefyContext`: a module-level registration rather than React context, because antd mounts Message, Notification and ConfirmModal content outside the page tree. Unregistered (unit tests, standalone use) the HTML renders as plain sanitised markup. The root element's only React children are portals and the overlay, which renders nothing in place, so an `innerHTML` reset never removes a React-owned node. Plugins that render HTML should use `renderHtml` or `HtmlComponent` rather than their own DOMPurify + `innerHTML`, or they miss these attributes.

Props beyond `html`: `div` (render a `div` instead of a `span`), `onDataEvent({ name, event })`, `sanitizeOptions` (DOMPurify config, used by `DangerousHtml`), and the older `onClick`.

### createLazyBlock({ load, meta, Fallback })

Wraps a block so its implementation module loads when the block first mounts, not with the page's block chunk. Use it for blocks that add a lot of code and are usually off-screen at first paint (a chat in a closed drawer, an editor in a modal).

```javascript
// src/blocks/AgentChat/AgentChat.js — the eager wrapper the blocks barrel exports
import { createLazyBlock } from '@lowdefy/block-utils';

import AgentChatFallback from './AgentChatFallback.js';
import meta from './meta.js';

export default createLazyBlock({
  load: () => import('./AgentChat.lazy.js'),
  meta,
  Fallback: AgentChatFallback, // optional
});
```

| Argument   | Description                                                                                                                                   |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `load`     | Returns `import()` of the implementation. The module's default export is the block component. The file must be named `*.lazy.js` (see below). |
| `meta`     | The block's meta. It is copied to `.meta`, and `Object.keys(meta.methods ?? {})` are the methods the wrapper proxies.                         |
| `Fallback` | Optional component rendered while the module loads. It receives the block's props. Without it the block renders nothing until it has loaded.  |

The returned component has `.meta`, `.displayName` (`'LazyBlock'`) and `.preload()`, which starts the load and returns its promise (memoized; call it on hover or click from a `Fallback`).

**Methods.** The engine's `CallMethod` reads `block.methods[name]` when it runs, so the wrapper registers a proxy for every `meta.methods` key at mount, with the same effect timing an eager block uses:

- The implementation gets `Object.create(methods)` with its own `registerMethod`, memoized on the engine's `methods` object. Framework methods reassigned on each render (`setValue`, `translate`, List's `pushItem`) still resolve through the prototype, and the object's identity changes only when `methods` does. Do not spread it: a spread copies only `registerMethod`.
- After the implementation registers a method, its proxy calls it synchronously and returns its result.
- Before that, calls go into one FIFO per mounted block and return promises. `LazyBlockFlush`, a sentinel rendered after the implementation inside the same `Suspense`, runs the queue in call order from its effect, which React runs after all of the implementation's effects.
- A queued call rejects when its method was never registered (with `CallMethod`'s own missing-method text), when the load fails, or when the block unmounts first. Nothing waits forever.
- A method the implementation registers but `meta.methods` does not declare is registered directly (it cannot be called before load) and logs a warning once in development.

**Loading.** `createLazyLoader` memoizes a successful load only: on failure the promise and the `React.lazy` component are dropped, so the next mount retries. The load error is thrown to the block's `ErrorBoundary`. Once the module has loaded, new mounts render it directly rather than through `React.lazy`, which would suspend once more in React 18.

**Readiness.** Each mounted block that is still waiting counts towards `getLazyBlockLoadsInFlight()`, mirrored on `window.__lowdefyLazyLoads` (set only once a lazy block has mounted). The dev server's `isPageReady` (screenshots and journeys) waits for it to reach zero. A `preload()` with nothing mounted is not counted.

**Prefetch.** The production server prefetches a page's `*.lazy.js` chunks and their imports (`collectPageTypesAssets` → `<link rel="prefetch">`). Only that suffix is matched, so other `import()`s that exist to avoid a download, such as `posthog-js`, are never prefetched. A lazy implementation must not be imported statically anywhere, or the split silently disappears.

**When to make a block lazy.** When it adds more than about 100 kB gzip to the page, **and** it is commonly off-screen at first paint or the page paints useful content without it. Keep a block eager when the framework or other blocks call its methods synchronously for a return value, and give it a size-stable `Fallback` when it is visible at first paint. A lazy sub-component inside the implementation (a diagram renderer, a code highlighter) needs its own `Suspense`, or it would suspend the whole block back to its fallback.

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
// class (with .block + .{cssKey} entries), style, events
// Containers also get: blocks, areas
```

The generated schema includes:

- **`class`** — validates `.block` and `.{cssKey}` entries from `meta.cssKeys`
- **`style`** — validates `.block` and `.{cssKey}` entries for inline styles
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

| File                               | Purpose                                  |
| ---------------------------------- | ---------------------------------------- |
| `src/extractBlockTypes.js`         | Derive types from metas barrel           |
| `src/buildBlockSchema.js`          | Generate JSON Schema from meta           |
| `src/cn.js`                        | Tailwind class merging (clsx + twMerge)  |
| `src/renderHtml.js`                | HTML sanitization                        |
| `src/ErrorBoundary.js`             | Error boundary component                 |
| `src/HtmlComponent.js`             | Safe HTML component                      |
| `src/blockSchema.js`               | Default block schema                     |
| `src/withBlockDefaults.js`         | Block default props wrapper              |
| `src/createLazyBlock.js`           | Lazy block wrapper with method proxies   |
| `src/createLazyLoader.js`          | Memoized, retrying `import()` loader     |
| `src/createLazyMethodQueue.js`     | Per-block FIFO of calls made before load |
| `src/getLazyBlockLoadsInFlight.js` | Lazy blocks still loading (readiness)    |
