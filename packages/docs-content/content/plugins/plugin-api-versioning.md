# Plugin API Versioning

The interface a plugin is written against — the props a block receives, the methods on its `methods` prop, the shape of its `meta.js`, the `_js` function prototypes, and the request, action and operator signatures — is the Lowdefy **plugin API**. From v8 it is versioned, the build checks the parts it can see, and a removed member explains itself at runtime instead of failing with a bare `TypeError`.

## The plugin API version

`@lowdefy/block-utils` exports `PLUGIN_API_VERSION`, an integer (currently `1`). It increments only when a member of the plugin API is removed or its contract changes; new props, new meta keys and new methods never bump it. Errors about a removed member end with `(plugin API v1)` so you know which contract the framework is holding your plugin to.

```js
import { PLUGIN_API_VERSION } from '@lowdefy/block-utils';
```

### Declaring it in your plugin package

Every block, operator, action and connection package declares the version it was built against in its `package.json`:

```json
{
  "name": "@acme/blocks",
  "lowdefy": {
    "pluginApiVersion": 1
  }
}
```

The build reads it for every plugin package the app uses and compares it with the version the installed Lowdefy implements. A mismatch is a build error:

```
Plugin package "@acme/blocks" was built for plugin API v2, but this Lowdefy version implements v1. Upgrade the plugin, or pin a Lowdefy version that implements v2. See https://docs.lowdefy.com/plugin-api-versioning.
```

A package that declares nothing is a build **warning**, not an error, so plugins written before the field keep working. Add the field — it will become an error in a future major.

## The block meta the build validates

Every block ships a `meta.js` — plain data, no React or CSS imports — re-exported from the package's `./metas` module as `{ [typeName]: meta }`. The build imports every installed block package's metas once and validates each block's meta before anything reads it. Every violation is a build error naming the block type, the package, the field, the expected shape and the value it received; all violations of one meta are reported together.

| Key             | Required | Shape                                                                                                                                                              |
| --------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `category`      | yes      | one of `display`, `input`, `input-container`, `container`, `list`                                                                                                  |
| `valueType`     | no       | `null`, or one of `any`, `array`, `boolean`, `date`, `number`, `object`, `primitive`, `string`                                                                     |
| `initValue`     | no       | the value an input block starts with; requires a non-null `valueType`                                                                                              |
| `icons`         | no       | array of icon names the block renders                                                                                                                              |
| `properties`    | no       | JSON Schema for the block's `properties` — the build validates literal config against it                                                                           |
| `cssKeys`       | no       | `{ cssKey: description }` — one entry per element a config author may target with `class` and `style`                                                              |
| `slots`         | no       | `{ slotName: description }`, an array of names, or `false` for dynamic slot names                                                                                  |
| `methods`       | no       | `{ methodName: description }` — the methods the block registers for `CallMethod`                                                                                   |
| `events`        | no       | `{ eventName: description }` or `{ eventName: { description, payload } }` where `payload` is a JSON Schema for the event object the block passes to `triggerEvent` |
| `dynamicEvents` | no       | `true` when the block triggers event names not listed in `events`                                                                                                  |
| `hazards`       | no       | `[{ id, message, kind, retiredBy, see }]` — behaviours the schema cannot express, returned to AI agents by the dev server's docs endpoint                          |

Any other top-level key is a build warning listing the known keys; unknown keys are allowed and ignored.

### Hazards

A hazard is a behaviour an agent cannot infer from the schema. Each entry is validated at build, for blocks, operators and requests alike:

| Field       | Required               | Shape                                                                                                                    |
| ----------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `id`        | yes                    | a unique, stable, kebab-case id                                                                                          |
| `message`   | yes                    | what surprises the reader, and what to do instead                                                                        |
| `kind`      | yes                    | `bug` — a framework defect the reader has to work around; `semantics` — deliberate behaviour they cannot infer           |
| `retiredBy` | yes when `kind: 'bug'` | the id of the task that removes the defect, so the bug-hazard count can be counted down rather than accumulating forever |
| `see`       | yes                    | the docs slug that explains it in full                                                                                   |

A `bug` hazard is a debt with an owner. A `semantics` hazard is permanent and needs no `retiredBy`.

```js
hazards: [
  {
    id: 'dompurify-options-first-render',
    kind: 'bug',
    retiredBy: 'V-68',
    message:
      'DOMPurifyOptions is read once when the block mounts, so a value that changes after the first render has no effect.',
    see: 'display-blocks/dangeroushtml',
  },
];
```

```js
// blocks/MyAutocomplete/meta.js
export default {
  category: 'input',
  valueType: 'string',
  icons: ['AiOutlineSearch'],
  cssKeys: {
    element: 'The autocomplete wrapper.',
    option: 'Each option row.',
  },
  events: {
    onChange: 'Triggered when the value changes.',
    onSelect: {
      description: 'Triggered when an option is chosen.',
      payload: {
        type: 'object',
        additionalProperties: false,
        properties: { value: { type: 'string', description: 'The selected value.' } },
      },
    },
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      options: { type: 'array', items: { type: 'object' } },
    },
  },
};
```

A plugin whose `./metas` module does not define a block type the app uses fails the build:

```
Block type "MyAutocomplete" from package "@acme/blocks": has no meta. Export it from "@acme/blocks/metas" as { MyAutocomplete: meta } with at least { category }.
```

If your plugin predates `meta.js`, the `v5-0-0/21-migrate-custom-block-plugins` codemod prompt in `@lowdefy/codemods` walks through creating the meta files and the `metas.js` barrel.

## Block methods that do not exist

In development, the `methods` prop is a proxy. Reading any key off it that the block does not have — a typo, or a method the plugin API removed — throws a `BlockError` naming the block and listing the methods that _are_ available, resolved to the block's config location like any other block error:

```
BlockError: Block "my-autocomplete" (type MyAutocomplete) called the block method "tirggerEvent", which it does not have. Available methods: getLocale, registerEvent, registerMethod, translate, triggerEvent. A block's own methods come from methods.registerMethod. (plugin API v1)
```

Production takes the bare `TypeError` instead: the proxy costs an indirection on every property access, and the developer who needs the message is always in dev.

### Removed block methods

A method the plugin API has removed names the removal and its replacement instead:

```
BlockError: Block "my-autocomplete" (type MyAutocomplete) called the removed block method "makeCssClass". Blocks receive resolved class names on the `classNames` prop and style objects on the `styles` prop, keyed by the block's `meta.cssKeys`. Replace `methods.makeCssClass(x)` with `classNames.<cssKey>` or an inline `style` object. See the codemod at @lowdefy/codemods v8-0-0/02-removed-block-methods.md. (plugin API v1)
```

| Method                              | Removed | Replacement                                                                                                                             |
| ----------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `methods.makeCssClass(styleObject)` | v5      | `classNames.<cssKey>` for an element a config author may target (declare the key in `meta.cssKeys`), otherwise an inline `style` object |

What to do: open the codemod prompt the error names (`node_modules/@lowdefy/codemods/v8-0-0/02-removed-block-methods.md`, or the same path in the Lowdefy repository), hand it to your coding agent or follow it by hand. It greps your local plugins for every call, gives the rewrite for each pattern, and ends with a verification step. A block that registers its own method under a removed name with `methods.registerMethod` keeps working — the error is only thrown for a method the block did not register.

## The deprecation policy

Removing a member of the plugin API, or changing what it means, follows four stages:

1. **Deprecate.** The member is marked deprecated in the framework's plugin API document, with its replacement, and keeps working for one major version.
2. **Explain.** Using it becomes a build error where the build can see it (a meta key, a `_js` prototype parameter) or a runtime error naming the replacement where only the runtime can (a block method).
3. **Codemod.** A standalone, re-runnable prompt ships under `@lowdefy/codemods`, registered in its `registry.json`, and the error text points at it.
4. **Remove.** In the next major version the member is removed and `PLUGIN_API_VERSION` increments.

Additions never bump the version and never go through this cycle.

The full contract — every prop, method, prototype and signature, each with the framework source file it is verified against — is `code-docs/architecture/plugin-api.md` in the [Lowdefy repository](https://github.com/lowdefy/lowdefy/blob/main/code-docs/architecture/plugin-api.md).
