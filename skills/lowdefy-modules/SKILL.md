---
name: lowdefy-modules
description: Use when installing or authoring a Lowdefy module — reusable pages, requests and connections packaged as a module, its `_module` operator and var contract.
---

# Modules

<!-- generated:reference:start -->
## Reference

Generated from `@lowdefy/docs-content` and the plugin schemas at release time — do not edit by hand. The running dev server has the live versions: `lowdefy_get_doc` for a doc page, `lowdefy_get_schema` for a type, `lowdefy_get_examples` for block yaml.

### Docs

#### Modules

`/lowdefy-docs/content/concepts/modules`

Blocks are the smallest reusable unit in Lowdefy; apps are the largest. Modules sit between them — they package the shape of a feature teams want to share, like a user-admin panel or an events timeline. A module bundles pages, connections, API endpoints, components, and menus into a single distributable unit. Instead of copying config between projects, you install a module and configure it with variables.

#### Writing Modules

`/lowdefy-docs/content/concepts/module-authoring`

This guide covers how to create, test, and publish Lowdefy modules.

#### _module

`/lowdefy-docs/content/operators/_module`

The `_module` operator family provides access to module-scoped values during the build. `_module.var` and the string forms of the ID operators only make sense inside module config files — the build throws a clear error if you use them at the app level.
<!-- generated:reference:end -->

## Recipe

Must cover: `modules:` in `lowdefy.yaml`, module vars, `_module` to read them, module pages vs. app pages, overriding a module page, and authoring a module package.
