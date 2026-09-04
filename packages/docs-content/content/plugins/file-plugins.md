# File Plugins

File plugins are single files in the app's own config directory that define a block, an action or an operator, without an npm package, a `types.js` barrel or a `plugins:` entry in `lowdefy.yaml`. They are found by convention: the build walks the `plugins` directory of the config directory on every build.

> File plugins are under active development. This release discovers them and registers their type names; emitting the imports that load them is the next step, so a file plugin is not yet usable in a page.

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
