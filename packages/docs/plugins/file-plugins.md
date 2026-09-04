File plugins are single files in the app's own config directory that define a block, an action or an operator, without an npm package, a `types.js` barrel or a `plugins:` entry in `lowdefy.yaml`. They are found by convention: the build walks the `plugins` directory of the config directory on every build.

> File plugins are under active development. Blocks, actions and operators work end to end; connections and requests still need a plugin package.

### The directory convention

| Directory                  | Kind                           | File name       |
| -------------------------- | ------------------------------ | --------------- |
| `plugins/blocks`           | Block                          | `Card.jsx`      |
| `plugins/actions`          | Action                         | `CopyRow.js`    |
| `plugins/operators/build`  | Build operator                 | `_env.js`       |
| `plugins/operators/client` | Client operator                | `_slug.js`      |
| `plugins/operators/server` | Server operator                | `_lookup.js`    |
| `plugins/operators/shared` | Client **and** server operator | `_titleCase.js` |

Blocks may be `.jsx` or `.js`; every other kind is `.js`. Only files directly in these directories are plugins - a file whose name has more than one segment, like `Card.test.jsx`, is a source file that lives beside a plugin, not a plugin.

An operator in `plugins/operators/shared` is registered as both a client and a server operator, which is how the shipped operator packages list a shared operator in both barrels.

Connections and requests are not file plugins yet; they still need a plugin package.

### The type name is the file name

The file name without its extension is the type name the app's YAML uses. `plugins/blocks/Card.jsx` defines the block type `Card`, and `plugins/operators/shared/_titleCase.js` defines the operator `_titleCase`.

Two naming rules are checked at build:

- A block file name must be PascalCase, because a lowercase block type cannot be told apart from an area key in YAML.
- An operator file name must start with an underscore.

A type name that is already defined - by a plugin package, by a default Lowdefy package, or by another file plugin - is a build error, not a silent override. The error names both sources:

```
Block type "Card" is defined by plugins/blocks/Card.jsx and by @lowdefy/blocks-antd.
```

To use a type name a package already owns, rename the file, or give the package plugin a `typePrefix` in its `lowdefy.yaml` entry.

### Meta and schema in a sibling JSON file

A plugin's meta, schema and hazards go in a JSON file named after the plugin, beside it:

```
plugins/blocks/Card.jsx
plugins/blocks/Card.json
```

```json
{
  "meta": { "category": "container" },
  "schema": {
    "type": "object",
    "properties": { "title": { "type": "string" } }
  }
}
```

Blocks use `meta` and `schema`; actions and operators use `schema`, and operators use `hazards`. The file is optional - a plugin with no sibling JSON file is registered without a schema and is not schema-validated. The build reads this file rather than the plugin's own source so that it never has to execute client React code to learn a block's schema, and it is the same `meta` and `schema` shape a package block ships beside its component.

### A block file plugin must declare a meta

A block's `meta` is not optional: the build reads `category` from it to know how the block is
rendered, exactly as it does for a package block. A block file plugin with no sibling JSON, or a
sibling JSON with no `meta`, is a build error:

```
Block type "Card" from "plugins/blocks/Card.jsx": has no meta. Declare it in "plugins/blocks/Card.json" as { "meta": { ... } } with at least { category }.
```

When the sibling JSON has a `meta` but no `schema`, the block schema is generated from
`meta.properties`, the same way a package block's schema is.

### The plugin exports the type as its default export

A file plugin's module exports one thing - the block component, the action function or the
operator function - as its `default` export:

`plugins/blocks/Card.jsx`:

```jsx
function Card({ blockId, properties }) {
  return <div id={blockId}>{properties.title}</div>;
}

export default Card;
```

A plugin may import from other files beside it with a relative path, and from any package the
app's own `package.json` depends on.

### Dev and production

In development the generated import points at the file where you wrote it, so Vite serves it and
hot-replaces it: editing a block or an action refreshes the browser without a restart. A server
operator or a build operator is held in the server's module cache instead, so the dev server
restarts when you edit one.

For a production build every plugin file, and every file it imports relatively, is copied into the
server directory, and the generated imports point at the copy - the deployed server runs without
the config directory. Bare package imports resolve from the server's `node_modules`, so the
dependencies declared in the app's `package.json` are installed into the server whenever the app
has a `plugins` directory. A dependency the server already ships (`react`, `antd`, `dayjs`) keeps
the server's version.

`package.json`, beside `lowdefy.yaml`:

```json
{
  "dependencies": {
    "stripe": "18.0.0"
  }
}
```

### Examples, so the agent can see the plugin it just wrote

A file plugin's usage examples go in a YAML file named after the plugin, beside it:

```
plugins/blocks/Card.jsx
plugins/blocks/Card.examples.yaml
```

The file holds a list of `{ title, blocks }` entries - the same shape a plugin package's
`examples.yaml` uses:

```yaml
- title: Default
  blocks:
    - id: card
      type: Card
      properties:
        title: Hello
```

`lowdefy_get_examples` serves this file. When it is missing, the tool answers with the path to
create rather than "no examples", so an agent writing config for the plugin knows the convention.

### Documentation in the sibling JSON

A `readme` field in the sibling JSON is the file plugin's documentation. `lowdefy_get_plugin_doc`
serves it, looked up by the type name or by the path `lowdefy_list_types` reports:

```json
{
  "meta": { "category": "display" },
  "readme": "# Card\n\nA card with a title and a body slot."
}
```

### File plugins in the docs and MCP tools

A file plugin is a first-class type in the dev server's docs endpoints and MCP tools.
`lowdefy_list_types` lists it beside the package types, with no package name and two extra fields
naming where it lives:

```json
{
  "type": "Card",
  "kind": "blocks",
  "package": null,
  "source": "file plugin",
  "file": "plugins/blocks/Card.jsx",
  "used": true
}
```

`lowdefy_get_schema` returns the sibling JSON's `schema` and `meta`, and the same `source` and
`file` fields. A file action or operator with no sibling JSON is still answered, with
`"schema": null` - it exists, it just declares no contract.

### Plugin files are linted at build

Every plugin file is parsed at build and its names are resolved, the same way a `_js` body is:

- A syntax error is a build error naming the file and the line, rather than a browser overlay
  once the page renders.
- A name that is neither imported, declared, nor a global of the environment the plugin runs in
  is a build error. A block, an action or a client operator has the browser globals and `React`;
  a server or build operator has the server globals; an operator under
  `plugins/operators/shared` has only what both environments have, so reaching for `document` or
  `process` there is an error.
- A top-level declaration that is never used is a warning.

Both are reported under the `js-lint` check slug, so `~ignoreBuildChecks: [js-lint]` suppresses
them where a plugin genuinely needs a global the build does not know about.

### Plugin API version

A file plugin may declare the plugin API version it was written against in its sibling JSON:

```json
{
  "pluginApiVersion": 1
}
```

Declaring nothing means the version the Lowdefy in the app implements, which is the normal case:
the file lives in the app it is built with. A file plugin that declares a different version is the
same build error a plugin package declaring one is - see
[Plugin API Versioning](/plugin-api-versioning).
