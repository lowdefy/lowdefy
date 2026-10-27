# @lowdefy/shell: shell plugins

The shell package's own `README.md` describes the shell: config, profiles, versions, boot, sign-in
and Lowdefy Dev. This page covers how a shell carries **shell plugins**, the npm packages an app adds
to a shell under `mobile.shells[].plugins` for native code no capability profile carries.

## The package contract

A shell plugin is an npm package that exports:

| Export     | Format    | Read by                                  | Holds                                                                                                                                    |
| ---------- | --------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `./shell`  | CommonJS  | `app.config.ts`, `lowdefy mobile config` | A `profiles.js` row: `capabilities`, `modules`, `plugins` (or a function of `options`), `permissions`, `privacyReasons`, `dataCollected` |
| `./native` | ES module | the shell's Metro bundle (`appTypes.js`) | Named exports `blocks` and `actions`, each `{ [typeName]: implementation }`                                                              |
| `./types`  | ES module | `createTypeManifest.mjs`, the build      | Type names, with native ones under `native: { blocks, actions, blockMetas, icons }`                                                      |

Its native modules and `expo` are optional `peerDependencies`, so the web server's install leaves
them out.

## In the shell

- `shell.json` `plugins: [{ name, version, typePrefix?, options? }]` (`checkShellConfig.js` checks
  the shape).
- `resolveShellPlugins({ shell, require })` loads each `./shell` and calls a `plugins` function with
  the plugin's options. `require` is the shell project's, so `lowdefy mobile` resolves from the copy.
- `checkShellPlugins({ shell, variant, plugins })` refuses a plugin module that a profile carries,
  and a permission another profile carries that the shell's leaves out, naming the profile to pick.
- `applyShellPlugins({ profile, plugins })` folds the entries into the resolved profile with
  `mergeProfiles`. `app.config.ts` builds the privacy manifest, config plugins and capabilities from
  the result. Plugin modules are never in `getExclusions`' set.
- `src/plugins/appTypes.js` ships as `{ actions: {}, blocks: {} }`. `lowdefy mobile config` rewrites
  it in the copied shell; the comment in the file shows the shape. `types.js` spreads it after the
  built-ins.
- `scripts/createTypeManifest.mjs` reads `shell.json` `plugins` and adds each plugin's native types,
  named `<typePrefix><name>`, with its package and major version. Two packages giving one type name
  fail the manifest, so a clash with a built-in type needs a `typePrefix`.
- `runtimeVersion.js` hashes each plugin as `name@version` plus the canonical JSON of its options.

## Tests

`fixtures/printer-plugin` is the test plugin (`@example/lowdefy-printer`).
`fixtures/withPrinterPlugin.mjs` links it into a temporary `node_modules` named by `NODE_PATH`, so
`expo config` and the manifest script resolve it as a shell project would.
`storeCompliance.test.mjs` checks a `field` shell with it, and `src/plugins/types.test.js` checks the
manifest against what `types.js` registers.
