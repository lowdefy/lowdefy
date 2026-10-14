---
'@lowdefy/ajv': minor
'@lowdefy/api': patch
'@lowdefy/build': minor
'@lowdefy/errors': minor
'@lowdefy/docs-content': patch
---

feat: The build checks block properties, action params and operator params against their plugin schemas

- After refs resolve, every block's `properties`, action's `params` and operator's params is validated against the schema its plugin ships. A finding is a warning with the type, the field, and the file and line of the field: `[ConfigWarning · plugin-schema] Block "Button" property "colr" is not allowed.`
- A value an operator gives at runtime is not judged. A missing required key or a misspelt key still reports, even beside operators.
- `~ignoreBuildChecks: [plugin-schema]` silences the check on a node, and `plugin-checks` and `--skip-plugin-checks` cover it. A plugin makes its schema findings errors with `schemaLevel: 'error'` in its `./checks` export.
- `@lowdefy/ajv` exports `getConfigSchemaErrors` and `formatSchemaError`. Dynamic pages validate block properties with the same function, so a `oneOf` above an operator no longer reports at runtime.
