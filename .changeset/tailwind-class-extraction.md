---
'@lowdefy/build': major
'@lowdefy/server-dev': major
---

Extract Tailwind utility classes from block properties for CSS generation.

### New Features

- **Content scanning**: Tailwind utility classes used in block property strings (HTML content, markdown, runtime operators) are extracted at build time and written to per-page HTML files (`tailwind-content/{pageId}.html`) so Tailwind v4's Oxide scanner generates CSS for all used utilities.
- **JIT rebuild integration**: Content files are regenerated on each JIT rebuild in dev mode, ensuring hot-reloaded pages pick up new Tailwind classes immediately.
- **Complements `collectTailwindClasses`**: Works alongside the existing `block.class` property scanning to provide complete Tailwind CSS coverage.
