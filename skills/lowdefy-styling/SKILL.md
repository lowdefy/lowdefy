---
name: lowdefy-styling
description: Use when changing how blocks look — `style`, `class`, theme tokens, custom CSS, `Html` vs. `DangerousHtml`, and responsive `_media` queries.
kind: reference
lowdefyVersion: 5.5.1
---

# Styling

<!-- generated:reference:start -->
## Reference

What this skill covers, and the call that returns the live version from the running dev server. Read these before writing config - never write a type name or property from memory.

### Docs

`lowdefy_get_doc` by slug (or `GET /lowdefy-docs/content/{slug}`): `concepts/custom-styling`, `concepts/custom-html`, `display-blocks/html`, `operators/_theme`.

### Blocks

`lowdefy_get_schema` with kind `blocks`, then `lowdefy_get_examples` for usage yaml: `Html` (`@lowdefy/blocks-basic`), `DangerousHtml` (`@lowdefy/blocks-basic`).

### Operators

`lowdefy_get_schema` with kind `operators`: `_media` (`@lowdefy/operators-js`).
<!-- generated:reference:end -->

## Recipe

Must cover: `style` for one-offs, `class` with app CSS in `lowdefy.yaml`, `theme` tokens and `_theme`, `Html` strips `<style>` (use `DangerousHtml`), `_media` for breakpoints, and `cssKeys` for block sub-elements.
