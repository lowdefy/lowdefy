/*
  Copyright 2020-2026 Lowdefy, Inc

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

/*
  A shell's plugins (shell.json `plugins`): npm packages that add native code beyond the shell's
  capability profile (profiles.js). Each is a Lowdefy shell plugin, which exports:

  - `./shell` (CommonJS): an entry shaped like one row of the profiles table, which app.config.ts
    folds into the shell's resolved profile (applyShellPlugins.js):
    - capabilities: the device features it gives the app.
    - modules: { [package]: nativeModuleName }, the native modules it links. Never one
      @lowdefy/shell carries itself (checkShellPlugins.js).
    - plugins: the Expo config plugin entries it applies, or a function of the plugin's `options`
      (shell.json `plugins[].options`) that returns them.
    - permissions: the iOS Info.plist keys and Android permissions its modules ask for.
    - privacyReasons: the required-reason APIs its modules use, as { category, reasons }.
    - dataCollected: the data it lets the app collect, as { type, purpose }.
  - `./native` (optional): its native types, as named exports `blocks` and `actions`, each
    { [typeName]: implementation }. `lowdefy mobile config` writes src/plugins/appTypes.js in the
    copied shell to import them, with the plugin's `typePrefix` applied (prefixTypes.js), and
    src/plugins/types.js registers them after the built-in types.
  - `./types` (optional): its type names as other plugins give them, with its native ones under
    `native: { blocks, actions, blockMetas, icons }`. scripts/createTypeManifest.mjs adds
    `native.blocks` and `native.actions` to the type manifest.

  Its native modules and `expo` are optional peerDependencies, so the web server's install leaves
  them out and `lowdefy mobile config` adds them to the shell project.
*/

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

const LIST_KEYS = ['capabilities', 'permissions', 'privacyReasons', 'dataCollected'];

function loadEntry({ name, require }) {
  try {
    return require(`${name}/shell`);
  } catch (error) {
    throw new Error(
      `Shell plugin "${name}" could not be loaded from "${name}/shell". A shell plugin exports "./shell", the native modules, config plugins, permissions, privacy reasons and data it brings. ${error.message}`,
      { cause: error }
    );
  }
}

function checkEntry({ entry, name }) {
  const where = `Shell plugin "${name}" "./shell"`;
  if (!isObject(entry)) {
    throw new Error(`${where} should export an object. Received ${JSON.stringify(entry)}.`);
  }
  LIST_KEYS.forEach((key) => {
    if (entry[key] !== undefined && !Array.isArray(entry[key])) {
      throw new Error(
        `${where} "${key}" should be an array. Received ${JSON.stringify(entry[key])}.`
      );
    }
  });
  if (entry.modules !== undefined && !isObject(entry.modules)) {
    throw new Error(
      `${where} "modules" should be { [package]: nativeModuleName }. Received ${JSON.stringify(
        entry.modules
      )}.`
    );
  }
  if (!Array.isArray(entry.plugins)) {
    throw new Error(
      `${where} "plugins" should be an array of config plugin entries, or a function of the plugin's options that returns one. Received ${JSON.stringify(
        entry.plugins
      )}.`
    );
  }
}

/**
 * Loads the `./shell` entry of each plugin a shell lists, with a `plugins` function called with the
 * plugin's options.
 *
 * @param {Object} params
 * @param {Object} params.shell The shell config (shell.json).
 * @param {Function} params.require Resolves the plugin packages: the shell project's own, so
 *   `lowdefy mobile` resolves them from the copied project.
 * @returns {{ name: string, version: string, typePrefix?: string, options?: Object, entry: Object }[]}
 */
function resolveShellPlugins({ shell, require }) {
  return (shell.plugins ?? []).map(({ name, version, typePrefix, options }) => {
    const loaded = loadEntry({ name, require });
    const plugins =
      typeof loaded?.plugins === 'function' ? loaded.plugins(options ?? {}) : loaded?.plugins ?? [];
    const entry = isObject(loaded) ? { ...loaded, plugins } : loaded;
    checkEntry({ entry, name });
    return { name, version, typePrefix, options, entry };
  });
}

module.exports = resolveShellPlugins;
