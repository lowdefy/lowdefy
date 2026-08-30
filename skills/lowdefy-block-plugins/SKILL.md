---
name: lowdefy-block-plugins
description: Use when the built-in blocks are not enough and a custom React block plugin is needed — the package layout, meta.js schema, how the dev server picks up local plugins, and when a plugin is the wrong answer.
---

# Custom block plugins

<!-- generated:reference:start -->
## Reference

Generated from `@lowdefy/docs-content` and the plugin schemas at release time — do not edit by hand. The running dev server has the live versions: `lowdefy_get_doc` for a doc page, `lowdefy_get_schema` for a type, `lowdefy_get_examples` for block yaml.

### Docs

#### Plugins

`/lowdefy-docs/content/plugins/plugins-introduction`

Lowdefy plugins provides an interface to extend the platform functionality with custom javascript code. Plugins are installed into the Lowdefy app during the Lowdefy build process, and as a result are included as part of the Vite client build output. This enables plugin developers to use any npm packages when building Lowdefy plugins.

#### Developing Plugins

`/lowdefy-docs/content/plugins/plugins-dev`

To develop plugins and publish plugins to npm or to use unpublished, project-specific plugins, we recommend using a pnpm monorepo with the plugin packages and a Lowdefy app, as demonstrated in [this example](https://github.com/lowdefy/lowdefy-example-plugins). The [Lowdefy default plugin packages](https://github.com/lowdefy/lowdefy/tree/main/packages/plugins) can also be used as examples.
<!-- generated:reference:end -->

## Recipe

Must cover: the block function signature (`blockId`, `properties`, `methods`, `events`), `meta.js` with `properties` schema and `events`, `types.js` exports, registering a local plugin in `lowdefy.yaml`, and when `Html`/`_js` already suffice.
