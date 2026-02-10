# @lowdefy/blocks-basic

HTML primitive blocks for Lowdefy. Provides basic building blocks without framework dependencies.

## Overview

This package contains simple HTML-based blocks that:
- Have minimal dependencies
- Provide raw HTML elements
- Enable custom styling
- Support dangerous HTML rendering

## Blocks

| Block | HTML Element | Purpose |
|-------|--------------|---------|
| `Box` | `<div>` | Generic container |
| `Span` | `<span>` | Inline container |
| `Html` | `<div>` | Renders HTML string (sanitized) |
| `DangerousHtml` | `<div>` | Renders raw HTML (unsanitized) |
| `Img` | `<img>` | Image element |
| `Icon` | SVG | Icon from icon library |
| `Anchor` | `<a>` | HTML anchor/link |
| `List` | `<ul>/<ol>` | HTML list |

## Box Block

The most commonly used container:

```yaml
- id: container
  type: Box
  style:
    padding: 20px
    backgroundColor: '#f0f0f0'
  areas:
    content:
      blocks:
        - id: child
          type: Title
```

## Html Block

Renders sanitized HTML:

```yaml
- id: content
  type: Html
  properties:
    html: '<p>This is <strong>safe</strong> HTML</p>'
```

Sanitization removes:
- `<script>` tags
- Event handlers (onclick, etc.)
- Dangerous attributes

## DangerousHtml Block

Renders raw HTML without sanitization:

```yaml
- id: widget
  type: DangerousHtml
  properties:
    html:
      _request: getEmbedCode
```

**Warning:** Only use with trusted content. Vulnerable to XSS if content is user-provided.

## Icon Block

Renders icons from icon libraries:

```yaml
- id: icon
  type: Icon
  properties:
    name: AiOutlineUser   # Ant Design icon
    size: 24
    color: '#1890ff'
```

Supported icon libraries:
- Ant Design Icons (`AiOutline*`, `AiFilled*`)
- Font Awesome (via configuration)

## Img Block

Simple image element:

```yaml
- id: logo
  type: Img
  properties:
    src: /images/logo.png
    alt: Company Logo
    width: 200
```

## List Block

HTML list rendering:

```yaml
- id: features
  type: List
  properties:
    ordered: false    # ul vs ol
    items:
      - First item
      - Second item
      - Third item
```

## Design Decisions

### Why Basic Blocks?

- Framework-agnostic fallbacks
- Lightweight alternatives
- Raw HTML when needed
- Custom styling without Ant Design

### Why Separate from Antd?

- Smaller bundle for simple apps
- No Ant Design dependency
- Pure HTML for custom designs

### When to Use

Use basic blocks when:
- Need raw HTML control
- Want minimal styling
- Embedding external content
- Custom CSS framework

## E2E Testing Helpers

### List Block

The List block has an e2e helper for testing list rendering:

```javascript
// src/blocks/List/e2e.js
import { createBlockHelper } from '@lowdefy/e2e-utils';
import { expect } from '@playwright/test';

const locator = (page, blockId) => page.locator(`#bl-${blockId}`);

export default createBlockHelper({
  locator,
  expect: {
    itemCount: async (page, blockId, count) => {
      const items = locator(page, blockId).locator('[id^="bl-"][id$=".$"]');
      await expect(items).toHaveCount(count);
    },
  },
});
```

Usage in tests:
```javascript
await ldf.block('items_list').expect.itemCount(5);
```

### Package Export

```json
{
  "exports": {
    "./e2e/List": "./dist/blocks/List/e2e.js"
  }
}
```

## See Also

- [e2e-utils.md](../../utils/e2e-utils.md) - E2E testing utilities
- [antd.md](./antd.md) - Full-featured UI blocks
