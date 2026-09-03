---
name: lowdefy-file-structure
description: Use when laying out a Lowdefy project — where pages, requests, connections, templates, enums and modules live, and how `_ref` and `_var` stitch them together.
kind: reference
lowdefyVersion: 5.5.1
---

# Project file structure

<!-- generated:reference:start -->
## Reference

What this skill covers, and the call that returns the live version from the running dev server. Read these before writing config - never write a type name or property from memory.

### Docs

`lowdefy_get_doc` by slug (or `GET /lowdefy-docs/content/{slug}`): `concepts/lowdefy-schema`, `concepts/references-and-templates`, `operators/_ref`, `operators/_var`.
<!-- generated:reference:end -->

## Recipe

Must cover: `lowdefy.yaml` as the root, one file per page under `pages/`, `requests/`, `connections/`, `templates/` with `_var` (an unsupplied var is a build error), `enums/`, `menus.yaml`, and naming conventions for ids.
