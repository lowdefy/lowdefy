---
name: lowdefy-page-layouts
description: Use when choosing the page frame — `PageSidebarLayout`, `PageHeaderMenu`, `PageSiderMenu`, menus, headers, breadcrumbs, and sharing one layout across pages.
kind: reference
lowdefyVersion: 5.5.1
---

# Page layouts

<!-- generated:reference:start -->
## Reference

What this skill covers, and the call that returns the live version from the running dev server. Read these before writing config - never write a type name or property from memory.

### Docs

`lowdefy_get_doc` by slug (or `GET /lowdefy-docs/content/{slug}`): `container-blocks/pagesidebarlayout`, `container-blocks/pageheadermenu`, `container-blocks/pagesidermenu`, `concepts/menus`.

### Blocks

`lowdefy_get_schema` with kind `blocks`, then `lowdefy_get_examples` for usage yaml: `PageSidebarLayout` (`@lowdefy/blocks-antd`), `PageHeaderMenu` (`@lowdefy/blocks-antd`), `PageSiderMenu` (`@lowdefy/blocks-antd`).
<!-- generated:reference:end -->

## Recipe

Must cover: one layout block as the page root, `menus.yaml` and `menuId`, `header`/`sider` areas, the `content` area for the page body, breadcrumbs, and a `_ref` template so every page shares the frame.
