# _ref

```
(path: string): any
(arguments: {
  path?: string,
  key?: string,
  resolver?: string,
  transformer?: string,
  vars?: object,
}): any
(arguments: {
  module: string,
  component: string,
  vars?: object,
  key?: string,
}): any
(arguments: {
  module: string,
  menu: string,
}): object[]
```

The `_ref` operator can be used to reference a configuration file, in order to split the Lowdefy configuration into multiple files. More information on references and the Lowdefy configuration schema can be found [here](/lowdefy-schema).

> The `_ref` operator is a build time operator: it is evaluated when the app configuration is being built. This means it is not evaluated dynamically as the app is running, and can be used anywhere in the configuration as long as the resulting configuration files are valid YAML.

The `_ref` operator requires a file path to the file to be referenced, relative to the root directory of the project.

If this file is a YAML or JSON file, and has file extension `.yaml`, `.yml`, or `.json`, the file is parsed as YAML/JSON, and the parsed result is included in the configuration.

If this file is a Nunjucks template file, with file extension `.njk`, the file is parsed as a Nunjucks template, using any variables provided in the `vars` argument. If the file extension is `.yaml.njk`, `.yml.njk` or `.json.njk`, the template output is also parsed as YAML/JSON.

If the file is not parsed (for example has an extension like `.txt`, `.md`, or `.html`), the file contents are included in the configuration as a string.

If the referenced file is a YAML or JSON file, the `key` argument can be used to reference a specific key inside that file, instead of the whole file.

###### Variables

Variables defined in the `vars` argument can be accessed in the referenced file using the [`_var`](/_var), and as template variables in Nunjucks files.

###### Resolver

A resolver is a JavaScript function that overwrites the default way configuration files are read from the filesystem. It does not need to read from the filesystem, it could generate a value to return programmatically, or it could fetch the configuration using HTTP (from Github for example). The `resolver` argument should be the file path (relative to the root of the project) to a JavaScript file that exports a resolver function.

The resolver function receives the `path`, `vars`, and a `context` object as arguments. If a resolver function is specified, the `path` argument to the `_ref` operator is optional, and does not need to correspond to a path to a file. If `path` ends with `.yaml`, `.yml`, `.json`, `.njk`, `.yaml.njk`, `.yml.njk`, or `.json.njk`, the returned result will be parsed as YAML/JSON/Nunjucks template.

A default `_ref` resolver can be specified in the `lowdefy.yaml` `cli` section (as `refResolver`), or as a command-line option when running the CLI (as `--ref-resolver`). This resolver will then be used for all references in the app, unless another resolver is specified.

###### Transformer

A transformer is a JavaScript function that receives the result of the `_ref` operator, and its `vars` as arguments. The value returned by this function will be included in the configuration as the final result of the `_ref` operator. The `transformer` argument should be the file path (relative to the root of the project) to a JavaScript file that exports a transformer function.

###### CommonJS and ES Modules

Both [CommonJS](https://nodejs.org/api/modules.html) and [ES Modules](https://nodejs.org/api/esm.html) are supported for in resolver and transformer functions. By default the functions are imported as CommonJs modules, and the function should be exported as a default export (`module.exports = transformer`). Files can also use the `.cjs` file extension to indicate they are CommonJs modules.

To use ES Modules, either use files with `.mjs` file extension, or add a `package.json` in the project directory file with `"type": "module"` set. When using ES Modules, the functions should also be a default export (`export default transformer;`)

#### Arguments

###### string
The file path to the referenced file, from the root of the project directory.

###### object
  - `path: string`:  The file path to the referenced file, from the root of the project directory. If no `resolver` is specified, `path` is required.
  - `key: string`: Only include the content at the specified key, instead of the entire file content. Dot notation is supported. This can only be used with YAML or JSON files.
  - `resolver: string`: The file path to a JavaScript file, from the root of the project directory, that exports a resolver function.
  - `transformer: string`: The file path to a JavaScript file, from the root of the project directory, that exports a transformer function.
  - `vars: object`: An object to be used as variables for the `_var` operator in the referenced file, and as template variables in Nunjucks template files.
  - `module: string`: The module entry ID (as defined in `lowdefy.yaml` `modules` array). When `module` is specified, `path` is not used — the reference resolves from the module's exported components or menus. See [Modules](/modules).
  - `component: string`: The component name exported by the module (defined in `module.lowdefy.yaml` `components` array). Used with `module`.
  - `menu: string`: The menu ID exported by the module (defined in `module.lowdefy.yaml` `menus` array). Used with `module`. Returns the menu's `links` array.
  - `key: string`: Dot-notation path to extract from the resolved content. Works for both file refs and module component refs.

> When referencing a module component, `vars` are accessed via `_var` inside the component (same as standard `_ref`). Module-level configuration is accessed via [`_module.var`](/_module). Both are available simultaneously.

> Within module content, the `module` field can reference a declared dependency name (from the module's `dependencies` in `module.lowdefy.yaml`). The build resolves abstract names to concrete entry IDs via the dependency wiring. From app-level config, `module` is always a concrete entry ID.

#### Examples
