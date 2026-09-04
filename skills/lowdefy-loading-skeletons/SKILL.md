---
name: lowdefy-loading-skeletons
description: Use when a page fetches data on load — showing skeletons while requests run, `loading` and `skeleton` on blocks, and avoiding layout jumps.
kind: reference
lowdefyVersion: 5.5.1
---

# Loading skeletons

<!-- generated:reference:start -->
## Reference

What this skill covers, and the call that returns the live version from the running dev server. Read these before writing config - never write a type name or property from memory.

### Docs

`lowdefy_get_doc` by slug (or `GET /lowdefy-docs/content/{slug}`): `display-blocks/skeleton`, `display-blocks/skeletoninput`, `display-blocks/skeletonparagraph`, `display-blocks/skeletonbutton`.

### Blocks

`lowdefy_get_schema` with kind `blocks`, then `lowdefy_get_examples` for usage yaml: `Skeleton` (`@lowdefy/blocks-loaders`), `SkeletonInput` (`@lowdefy/blocks-loaders`), `SkeletonParagraph` (`@lowdefy/blocks-loaders`), `SkeletonButton` (`@lowdefy/blocks-loaders`), `Spinner` (`@lowdefy/blocks-loaders`).
<!-- generated:reference:end -->

## Recipe

Must cover: `onInitAsync` renders skeletons until it settles, the per-block `skeleton` property (a skeleton block spec), `loading` on containers, matching skeleton size to the block it stands in for, and one skeleton per visual block rather than a page spinner.
