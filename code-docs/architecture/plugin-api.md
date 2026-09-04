# Plugin API

What a plugin may rely on. `plugin-system.md` documents how plugins are declared, resolved and loaded; this document names the public surface a plugin is written against, versions it, and states how a member of it is deprecated and removed.

Every section names the source file it was verified against. When one of those files changes the contract, this document changes with it, and the deprecation policy at the end applies.

## Version

`PLUGIN_API_VERSION` is exported by `@lowdefy/block-utils` (`packages/utils/block-utils/src/pluginApi.js`). It is an integer, currently `1`. It increments only when a documented member of the plugin API is removed or its contract changes; additions do not bump it. A runtime error about a removed member ends with `(plugin API v<n>)` so the reader knows which contract the framework is holding the plugin to.

Every block, operator, action and connection package declares the version it was built against as `{ "lowdefy": { "pluginApiVersion": <n> } }` in its `package.json`. `packages/build/src/build/writePluginImports/validatePluginApiVersions.js` runs over every package contributing a type the app uses, reads the field through `readPluginPackageJson.js` (resolving the package's `./types` subpath and walking up, because `package.json` is usually not in a plugin's `exports` map) and compares it with `PLUGIN_API_VERSION`. A mismatch is a `ConfigError` naming the migration doc; a package that declares nothing is a `ConfigWarning`, so third-party plugins written before the field keep working for one release.

`REMOVED_BLOCK_METHODS` (same file) maps each block method that has been removed from the `methods` prop to a sentence naming its replacement. It is not a registry the runtime depends on: `packages/client/src/block/createBlockMethods.js` throws for **any** missing key that looks like a method name, and consults this map only for the better message (see "Block methods that do not exist" below).

## Block component contract

Verified against `packages/utils/block-utils/src/blockDefaultProps.js`, `packages/utils/block-utils/src/withBlockDefaults.js` and the render sites in `packages/client/src/block/CategorySwitch.js`, `Container.js`, `InputContainer.js`, `List.js`.

A block is a React component. It is exported from the package's `./blocks` module under its type name and wrapped in `withBlockDefaults`, which spreads `blockDefaultProps` under the props the client passes so that a block renders in isolation (tests, Storybook) with the same prop shape it gets in an app:

```javascript
import { withBlockDefaults } from '@lowdefy/block-utils';

function MyBlock({ blockId, classNames, methods, properties, styles }) { ... }

export default withBlockDefaults(MyBlock);
```

### The block root contract

Every block renders `blockRootProps` from `@lowdefy/block-utils` on the element it owns outermost — its root:

```javascript
import { blockRootProps, withBlockDefaults } from '@lowdefy/block-utils';

function MyBlock({ blockId, classNames, content, styles }) {
  return <div {...blockRootProps({ blockId, classNames, styles })}>{content.content()}</div>;
}
```

It returns four props:

| Prop          | Value                                                 | Why                                                                                                    |
| ------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `id`          | `blockId`                                             | the block is addressable as `#<blockId>` — journeys, e2e locators and an agent reading the DOM find it |
| `data-testid` | `blockId`                                             | the same handle for testing libraries that do not use css selectors                                    |
| `className`   | `cn(className, classNames.block, classNames.element)` | the app author's `class:` lands on the block, not on a layout wrapper that may not exist               |
| `style`       | `{ ...style, ...styles.block, ...styles.element }`    | the same for `style:`                                                                                  |

The optional `className` and `style` arguments are the block's **own** defaults; they are merged first so the app author's config always wins. A block that composes several classes for its root passes them through `className: cn(...)` rather than appending `classNames.element` itself — the helper adds the slots.

Today the client's `BlockLayout` wrapper also renders `id="bl-<blockId>"` and applies `class.block`/`style.block`. The contract makes the block itself lossless, so the wrapper can stop doing either without any block losing its styling.

Two blocks are exempt, and both are recorded with a reason in the invariant scan (`packages/plugins/blocks/blocks-antd/e2e/tests/blockRootContract.mjs`): a block that renders no DOM of its own, and a block whose whole root is another Lowdefy component that already applies the contract (the antd `Label`, `blocks-basic` `Box`, the client's `Icon`). The scan fails on any block main file that neither calls the helper nor is recorded.

### Props every block receives

| Prop         | Type                           | Source                                                                                                       |
| ------------ | ------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `basePath`   | string                         | `lowdefy.basePath`                                                                                           |
| `blockId`    | string                         | the block's `id` after array indices are applied                                                             |
| `classNames` | `{ block, [cssKey]: string }`  | `resolveClassNames(block.eval.class)` — one resolved class-name string per `meta.cssKeys` entry plus `block` |
| `components` | object                         | shared React components (`ShortcutBadge`, …)                                                                 |
| `events`     | object                         | `block.eval.events ?? {}` — the evaluated event config, keyed by event name                                  |
| `loading`    | boolean                        | true while the page's `onInit` requests are in flight                                                        |
| `menus`      | array                          | `lowdefy.menus`                                                                                              |
| `methods`    | object                         | see "Methods" below                                                                                          |
| `pageId`     | string                         | the current page                                                                                             |
| `properties` | object                         | `block.eval.properties` — the evaluated `properties:` config                                                 |
| `required`   | boolean                        | `block.eval.required`                                                                                        |
| `styles`     | `{ block, [cssKey]: object }`  | `block.eval.style ?? {}` — one style object per css key                                                      |
| `validation` | `{ status, errors, warnings }` | the block's validation result                                                                                |

Category-specific props:

| Category          | Extra props                                                                    |
| ----------------- | ------------------------------------------------------------------------------ |
| `input`           | `value` — the block's value in state; `methods.setValue`                       |
| `container`       | `content` — `{ [slotName]: () => ReactNode }`, one render function per slot    |
| `input-container` | `content`, `value`                                                             |
| `list`            | `list` — an array with one `{ [slotName]: () => ReactNode }` per item; `value` |

`display` blocks receive only the common props.

### Methods

The `methods` prop is the engine block's `methods` bag (`packages/engine/src/Block.js`, filled by `registerMethod`) with the framework methods assigned over it at render:

| Method                             | Signature      | Notes                                                          |
| ---------------------------------- | -------------- | -------------------------------------------------------------- |
| `getLocale()`                      | `() => string` | the active locale, falling back to the default                 |
| `registerEvent({ name, actions })` |                | declare an event the block triggers                            |
| `registerMethod(name, fn)`         |                | expose a method for `CallMethod`; declare it in `meta.methods` |
| `setValue(value)`                  |                | `input` and `input-container` only                             |
| `translate(key, values)`           |                | i18n lookup                                                    |
| `triggerEvent({ name, event })`    | `Promise`      | run the actions configured for `events.<name>`                 |

### Block methods that do not exist

In development the `methods` prop is a `Proxy` (`createBlockMethods.js`). Reading any key off it that the bag does not carry — a typo as much as a removal — throws a located `BlockError` listing the methods that are available:

```
BlockError: Block "my-autocomplete" (type MyAutocomplete) called the block method "tirggerEvent", which it does not have. Available methods: getLocale, registerEvent, registerMethod, translate, triggerEvent. A block's own methods come from methods.registerMethod. (plugin API v1)
```

The trap runs on every property access of `methods` in every block render, so it is gated on `process.env.NODE_ENV !== 'production'` (both server vite configs define that value, so the branch is eliminated from the production bundle) and production takes the bare `TypeError`. Symbols, the keys JavaScript itself probes for (`then`, `toJSON`) and names that do not look like methods pass straight through.

### Removed block methods

| Method                      | Removed              | Replacement                                                                                                                                         |
| --------------------------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `makeCssClass(styleObject)` | v5 (Emotion dropped) | `classNames.<cssKey>` for an author-facing hook, otherwise an inline `style` object; codemod `packages/codemods/v8-0-0/02-removed-block-methods.md` |

A name in `REMOVED_BLOCK_METHODS` gets the removal and its replacement instead of the generic list:

```
BlockError: Block "my-autocomplete" (type MyAutocomplete) called the removed block method "makeCssClass". Blocks receive resolved class names on the `classNames` prop … (plugin API v1)
```

The error carries `typeName` and `configKey`, so the `ErrorBoundary` → `handleError` path (`packages/utils/block-utils/src/ErrorBoundary.js`, `packages/client/src/createHandleError.js`) resolves it to the block's config source like any other `BlockError`. A block that registers its own method under a removed name (`registerMethod('makeCssClass', fn)`) is not affected: the proxy throws only for a key the bag does not carry.

### Block meta

Verified against `packages/build/src/build/writePluginImports/validateBlockMeta.js` (the build's validator), `packages/utils/block-utils/src/extractBlockTypes.js` and `buildBlockSchema.js` (the consumers).

Each block ships a `meta.js` — plain data, no React or CSS imports — re-exported from the package's `./metas` module as `{ [typeName]: meta }`. `loadBlockSchemas` (`packages/build/src/build/loadBlockSchemas.js`) imports every installed block package's metas once per build and validates each block's meta before anything reads it. Every violation is a `ConfigError` naming the type, the package, the field, the expected shape and the received value; all violations of one meta are collected before the build stops, so one bad plugin reports every bad field.

| Key             | Required | Shape                                                                                                                                                                                                                                                                                                                                                                     |
| --------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `category`      | yes      | one of `display`, `input`, `input-container`, `container`, `list`                                                                                                                                                                                                                                                                                                         |
| `valueType`     | no       | `null`, or one of `any`, `array`, `boolean`, `date`, `number`, `object`, `primitive`, `string` (`type.enforceType`, `packages/utils/helpers/src/type.js`)                                                                                                                                                                                                                 |
| `initValue`     | no       | the value an input block starts with; requires a non-null `valueType`                                                                                                                                                                                                                                                                                                     |
| `icons`         | no       | array of icon names the block renders (bundled by the build)                                                                                                                                                                                                                                                                                                              |
| `properties`    | no       | JSON Schema for `properties:` — the build validates literal config against it                                                                                                                                                                                                                                                                                             |
| `cssKeys`       | no       | `{ [cssKey]: description }` — one entry per element a config author may target with `class:`/`style:`                                                                                                                                                                                                                                                                     |
| `slots`         | no       | `{ [slotName]: description }`, an array of names, or `false` for dynamic slot names (`validateSlots.js`)                                                                                                                                                                                                                                                                  |
| `methods`       | no       | `{ [methodName]: description }` — the methods the block registers                                                                                                                                                                                                                                                                                                         |
| `events`        | no       | `{ [eventName]: description \| { description, payload: <JSON Schema> } }` — `payload` describes the object passed to `triggerEvent({ name, event })` and lets the build check `_event` paths (`packages/utils/block-utils/src/extractEventPayloads.js`); the legacy `{ description, event: { [field]: description } }` form is still accepted and normalised to a payload |
| `dynamicEvents` | no       | boolean — the block triggers event names not listed in `events`                                                                                                                                                                                                                                                                                                           |
| `hazards`       | no       | `[{ id, message, kind, retiredBy, see }]` — behaviours the schema cannot express, returned to agents by the docs/MCP endpoint (see "Hazards")                                                                                                                                                                                                                             |

Any other top-level key is a `ConfigWarning` listing the known keys; unknown keys stay allowed and are ignored.

### Hazards

Verified against `packages/build/src/build/writePluginImports/validateHazardsShape.js`, which the block meta validator, `writeOperatorSchemaMap.js` (operator metas) and `writeConnectionSchemaMap.js` (request metas) all use, so a block, operator and request hazard are held to one shape.

| Field       | Required               | Shape                                                                                                 |
| ----------- | ---------------------- | ----------------------------------------------------------------------------------------------------- |
| `id`        | yes                    | unique, stable, kebab-case                                                                            |
| `message`   | yes                    | what surprises the reader and what to do instead                                                      |
| `kind`      | yes                    | `bug` — a framework defect to work around; `semantics` — deliberate behaviour that cannot be inferred |
| `retiredBy` | yes when `kind: 'bug'` | the id of the task that removes the defect                                                            |
| `see`       | yes                    | the docs slug that explains it in full                                                                |

`kind` and `retiredBy` are what stop the channel filling up: a bug hazard is a debt with a named owner and the bug-hazard count is expected to fall, while a semantics hazard is permanent.

A meta module the build cannot resolve (a plugin listed in `lowdefy.yaml` that `installServer` has not fetched yet) is not an error: the first build of an app runs before the plugin is installed, and the CLI and dev manager build again afterwards. A package whose metas module does resolve but does not define a used type fails the build with `Block type "X" from package "@acme/blocks" has no meta. Export it from "@acme/blocks/metas" as { X: meta } …`.

## `_js` function prototypes

Verified against `packages/build/src/build/buildJs/jsFunctionPrototypes.js` (the single source of truth), the binding sites `packages/plugins/operators/operators-js/src/operators/client/js.js` and `.../server/js.js`, and the generated modules `generateClientJsModule.js` / `writeJs.js`.

A `_js` body is compiled into a function with one destructured parameter. There are two prototypes; there is no build-time `_js`.

Client (`CLIENT_JS_PARAMS`):

```javascript
function ({ actions, args, event, input, location, lowdefyApp, lowdefyGlobal, request, state, urlQuery, user }) { ... }
```

Server (`SERVER_JS_PARAMS`):

```javascript
function ({ args, item, lowdefyApp, payload, secret, state, step, user }) { ... }
```

`args` is the `args` value of the `_js` call. Every other member is a getter, `(path) => value`, bound to the operator of the same purpose (`state` → `_state`, `request` → `_request`, `lowdefyApp` → `_app`, `lowdefyGlobal` → `_global`, `urlQuery` → `_url_query`, `step` → `_step`, `item` → `_item`, …). The build lint (`lintJsBodies.js`) treats these names plus the ES standard library as the only globals a body may reference.

## Request and connection contract

Verified against `packages/api/src/routes/request/callRequestResolver.js`, `checkConnectionRead.js`, `checkConnectionWrite.js`, and `packages/plugins/connections/connection-mongodb/src/connections/MongoDBCollection/MongoDBCollection.js`.

A connection is an object exported from the package's `./connections` module under its type name:

```javascript
export default {
  schema,           // JSON Schema for the connection's `properties:`
  meta: { tenant }, // optional; `tenant: true` implements the tenant scoping contract
  tenantPreflight,  // optional; probes for unstamped rows under policy: tenant
  requests: { MongoDBFind, MongoDBInsertOne, ... },
};
```

Each request is a resolver function with `schema` and `meta` (`{ checkRead, checkWrite }`) properties. The API calls it as:

```javascript
await requestResolver({
  blockId,
  callApi, // ({ endpointId, payload }) => response — invoke an endpoint from inside a request
  collectionSchema, // the field contract ({ name, fields }) from build/collections.json, or null
  connection, // the evaluated connection properties
  connectionId,
  endpointId,
  pageId,
  payload,
  request, // the evaluated request properties
  requestId, // stepId for endpoint steps, requestId for page requests
  tenant, // the tenant verdict ({ field, value }) or null
  trace, // optional dev-only collector (the `explain` flag); resolvers may ignore it
});
```

Resolvers throw plain `Error`s; the request handler wraps them in `RequestError` with the request's `configKey`.

## Action contract

Verified against `packages/engine/src/Actions.js` and `packages/engine/src/actions/getActionMethods.js`.

```javascript
async function MyAction({ globals, methods, params }) { ... }
```

`params` is the evaluated `params:` of the action. `methods` is the bag built by `getActionMethods` — `callAPI`, `callMethod`, `displayMessage`, `getActions`, `getBlockId`, `getEvent`, `getGlobal`, `getInput`, `getLocale`, `getPageId`, `getRequestDetails`, `getState`, `getUrlQuery`, `getUser`, `link`, `login`, `logout`, `request`, `reset`, `resetValidation`, `setGlobal`, `setState`, `validate`, the auth methods (`signUp`, `passkey*`, `phoneNumber*`, organisation methods, …) — see that file for the current list. Actions throw plain `Error`s (or `UserError` for an expected user-facing outcome); the engine wraps them in `ActionError`.

## Operator contract

Verified against `packages/operators/src/webParser.js` (client), `packages/operators/src/serverParser.js` (server) and `packages/operators/src/evaluateOperators.js` as called from `packages/build/src/build/buildRefs/walker.js` (build operators).

```javascript
function _my_operator({ params, location, methodName, operatorPrefix, ... }) { ... }
```

`params` is the operator's value after nested operators are evaluated; `location` is the config path; `methodName` is the `.method` suffix (`_my_operator.method`). Client operators also receive `actions`, `args`, `arrayIndices`, `basePath`, `event`, `eventLog`, `globals`, `home`, `i18n`, `input`, `jsMap`, `lowdefyApp`, `lowdefyGlobal`, `menus`, `operators`, `pageId`, `request`, `state`, `urlQuery`, `user`; server operators receive `payload`, `secrets`, `state`, `step`, `user`, … . Operators throw plain `Error`s; the parser wraps them in `OperatorError` with `received` and the location.

## Deprecation policy

A member of this document is any prop, method, meta key, prototype parameter, or function signature named above. Removing one, or changing what it means, follows four stages:

1. **Deprecate.** The member is marked deprecated in this document, with its replacement, and keeps working for one major version.
2. **Explain.** Its use becomes a build error (`ConfigError`) where the build can see it — a meta key, a prototype parameter — or a runtime `BlockError`/`ActionError`/`OperatorError`/`RequestError` naming the replacement where only the runtime can, as `createBlockMethods` does for `REMOVED_BLOCK_METHODS`. A removal that changes the contract also bumps `pluginApiVersion`, which the build compares against every plugin package's declaration.
3. **Codemod.** A standalone, re-runnable prompt ships under `@lowdefy/codemods` (`packages/codemods/v<major>/`), registered in `registry.json`, and the error text points at it.
4. **Remove.** In the next major the member is removed, `PLUGIN_API_VERSION` increments, and the member moves from its section to a "removed" table with the version it went and its replacement.

Additions never bump the version. A change that is neither a removal nor a contract change (a new optional prop, a new meta key) is documented here in the same release it ships.

## Key files

| File                                                                       | Purpose                                                                         |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `packages/utils/block-utils/src/blockRootProps.js`                         | the block root contract helper                                                  |
| `packages/utils/block-utils/src/pluginApi.js`                              | `PLUGIN_API_VERSION`, `REMOVED_BLOCK_METHODS`                                   |
| `packages/client/src/block/createBlockMethods.js`                          | the dev-only proxy that turns a missing method call into a located `BlockError` |
| `packages/build/src/build/writePluginImports/validatePluginApiVersions.js` | compares each plugin package's declared `pluginApiVersion`                      |
| `packages/build/src/build/writePluginImports/validateHazardsShape.js`      | the hazard shape, shared by block, operator and request metas                   |
| `packages/build/src/build/writePluginImports/validateBlockMeta.js`         | meta shape validation                                                           |
| `packages/build/src/build/loadBlockSchemas.js`                             | imports and validates every installed block meta                                |
| `packages/build/src/build/buildJs/jsFunctionPrototypes.js`                 | the `_js` prototypes                                                            |
| `packages/api/src/routes/request/callRequestResolver.js`                   | the request resolver call                                                       |
| `packages/codemods/v8-0-0/02-removed-block-methods.md`                     | codemod for `methods.makeCssClass`                                              |
