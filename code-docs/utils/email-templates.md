# @lowdefy/email-templates

React Email notification templates plus injection-safe property interpolation and email rendering.

## Overview

The server-only package behind [notification rendering](../architecture/notifications.md). It provides the three built-in email templates, the render entry that turns a template + properties + data into `{ html, text }`, and the interpolation pipeline that guarantees user data can never inject markup or links into a branded email. It is loaded through the generated `plugins/notifications.js` seam (never the client bundle, never apps without notifications), and the `@lowdefy/api` package consumes its exports off the request context rather than importing it directly.

## Installation

```javascript
import {
  renderEmail,
  interpolateProperties,
  buildPreviewProps,
  defaultTheme,
} from '@lowdefy/email-templates';
import {
  NotificationEmail,
  DigestEmail,
  AlertEmail,
} from '@lowdefy/email-templates/notifications';
```

## Key Modules

### renderEmail

**Location:** `src/renderEmail.js`

Renders a template element to `{ html, text }` using `@react-email/render` (`render(el)` and `render(el, { plainText: true })`). Input: `{ Template, properties, data, theme, links }`. Produces only the email bodies — subject/title/preview are derived from the interpolated properties by the caller.

### interpolateProperties — the injection-safety mechanism

**Location:** `src/interpolate/`

Interpolates template property strings against the data item. Every interpolated value is escaped on two axes — HTML (Nunjucks autoescape) and markdown (a renderer escape pass over values) — then markdown is parsed with raw HTML disabled. Only author-written markdown formats; interpolated user data renders verbatim. A value of `[x](https://evil)` becomes literal text, never a link. Each template's `markdownProperties` static names which properties are markdown.

### The templates

**Location:** `src/notifications/`

`NotificationEmail`, `DigestEmail`, `AlertEmail` — React Email components, each with a `.schema` (validated at render time), `markdownProperties`, and `dataKeys` (the array data keys it renders: `actions` for NotificationEmail, `items` for DigestEmail). `src/types.js` declares the `notifications` type category: `{ notifications: ['NotificationEmail', 'DigestEmail', 'AlertEmail'] }`. Custom templates are plugin packages that add to this category.

### resolveLink

**Location:** `src/resolveLink.js`

Turns a `{ pageId, urlQuery }` link object into a URL string (direct page URL, or a landing-page URL when configured). The API package's `resolveNotificationLinks` uses the same convention across `data.links` and template `dataKeys` arrays.

### Layout and theme

**Location:** `src/components/`, `src/defaultTheme.js`

A fixed layout (logo header, greeting, content, signature, footer) parameterized by the theme. `defaultTheme.js` is the baseline; apps override via `app.email`, and a notification can override per-instance.

### buildPreviewProps

**Location:** `src/buildPreviewProps.js`

Build/preview-time helper: assembles `{ properties, data, theme, links }` from a notification config's `testData` for the `lowdefy emails` CLI preview server. Uses a simpler link resolver (no landing-page/record-id logic — preview has no record).

## Design Decisions

- **Templates are React Email components, not a YAML DSL.** Rich email layout is what React Email does well; custom templates reuse the whole plugin machinery by adding to the `notifications` type category.
- **Single-escape interpolation.** Escaping values (not the surrounding markdown) closes the injection hole while leaving author markdown intact — the one thing config-driven emails must get right.
- **Server-only, lazily wired.** Exposed through `plugins/notifications.js` so it never reaches the client and never burdens apps without notifications.

## Related

- [Notification Rendering](../architecture/notifications.md) — how the API step drives this package
- [Notifications (user docs)](https://docs.lowdefy.com/notifications) — the `notifications:` section and template properties
