---
name: lowdefy-file-structure
description: Use when laying out a Lowdefy project — where pages, requests, connections, templates, enums and modules live, and how `_ref` and `_var` stitch them together.
---

# Project file structure

<!-- generated:reference:start -->
## Reference

Generated from `@lowdefy/docs-content` and the plugin schemas at release time — do not edit by hand. The running dev server has the live versions: `lowdefy_get_doc` for a doc page, `lowdefy_get_schema` for a type, `lowdefy_get_examples` for block yaml.

### Docs

#### Lowdefy App Schema

`/lowdefy-docs/content/concepts/lowdefy-schema`

A Lowdefy app is written as YAML or JSON files, which are combined together using the [`_ref`](/_ref) operator when the app is built into a configuration object that describes the app. This object has different sections that describe different parts of the Lowdefy app.

#### References and Templates

`/lowdefy-docs/content/concepts/references-and-templates`

References and templates have the following use cases: - Splitting out the config for readability and code navigation. - Splitting out a piece of config in order to use the exact same config in multiple places. - Using a reference with variables to make use of a shared piece of config with dynamic variables. - Using a `.njk` file to create config files using the Nunjucks templating language. - Using resolver and transformer functions to create Lowdefy config using Javascript functions.

#### _ref

`/lowdefy-docs/content/operators/_ref`

The `_ref` operator can be used to reference a configuration file, in order to split the Lowdefy configuration into multiple files. More information on references and the Lowdefy configuration schema can be found [here](/lowdefy-schema).

#### _var

`/lowdefy-docs/content/operators/_var`

The `_var` operator gets a value from the `vars` object, specified by a [`_ref`](/ref) operator when referencing a file.
<!-- generated:reference:end -->

## Recipe

Must cover: `lowdefy.yaml` as the root, one file per page under `pages/`, `requests/`, `connections/`, `templates/` with `_var` (an unsupplied var is a build error), `enums/`, `menus.yaml`, and naming conventions for ids.
