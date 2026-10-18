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
  The type manifest: every block, action and operator type this shell carries, with the plugin
  package that provides it and that package's major version. A page renders only when the shell
  carries every type its type set names at the same major version (src/types/checkTypeSet.js).

  Made at shell build time (app.config.ts) from src/plugins/shellPlugins.json, the plugin packages
  the shell registers (src/plugins/types.js), and the shell's plugins (shell.json `plugins`, read
  with readShellConfig.js): each one's `./types` `native.blocks` and `native.actions`, named with
  its typePrefix, as src/plugins/appTypes.js registers them. A plugin without a `./types` export
  adds none. Prints the manifest as JSON when run directly.
*/

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const shellRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const readShellConfig = require('../readShellConfig.js');

const NATIVE_CATEGORIES = ['actions', 'blocks'];

const CATEGORIES = ['actions', 'blocks', 'operators'];

// The plugin packages export no package.json, so it is found above the resolved types file.
function readMajorVersion(packageName) {
  let directory = path.dirname(require.resolve(`${packageName}/types`));
  while (!fs.existsSync(path.join(directory, 'package.json'))) {
    directory = path.dirname(directory);
  }
  const { name, version } = JSON.parse(
    fs.readFileSync(path.join(directory, 'package.json'), 'utf8')
  );
  if (name !== packageName) {
    throw new Error(`Could not find the package.json of "${packageName}".`);
  }
  return Number(version.split('.')[0]);
}

function getPackageTypeNames({ category, types }) {
  if (category === 'operators') {
    return types.operators.client;
  }
  return types[category];
}

// Two packages giving one type name would leave one of them unreachable on a page.
function addType({ category, manifest, name, packageName }) {
  const existing = manifest[category][name];
  if (existing !== undefined && existing.package !== packageName) {
    throw new Error(
      `Shell plugin "${packageName}" gives the ${category.slice(0, -1)} type "${name}", which "${
        existing.package
      }" already gives. Set a typePrefix on the plugin in mobile.shells[].plugins.`
    );
  }
  manifest[category][name] = { package: packageName, version: readMajorVersion(packageName) };
}

// A shell plugin need not export "./types": a native-only plugin, such as a wrapped SDK, gives no
// types. Resolving a missing export throws, so the plugin's own package.json says, found on the
// lookup paths of `require` (its exports need not list package.json).
function hasTypesExport(packageName) {
  const packageJsonPath = require.resolve
    .paths(packageName)
    .map((directory) => path.join(directory, packageName, 'package.json'))
    .find((filePath) => fs.existsSync(filePath));
  if (packageJsonPath === undefined) {
    throw new Error(`Shell plugin "${packageName}" is not installed.`);
  }
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  return packageJson.exports?.['./types'] !== undefined;
}

// A shell plugin's native type names, from its `./types` `native: { blocks, actions }`.
async function addShellPluginTypes({ manifest, plugin }) {
  const { default: types } = await import(pathToFileURL(require.resolve(`${plugin.name}/types`)));
  NATIVE_CATEGORIES.forEach((category) => {
    const names = types.native?.[category] ?? [];
    if (!Array.isArray(names)) {
      throw new Error(
        `Shell plugin "${
          plugin.name
        }" "./types" native.${category} should be an array of type names. Received ${JSON.stringify(
          names
        )}.`
      );
    }
    names.forEach((name) => {
      addType({
        category,
        manifest,
        name: `${plugin.typePrefix ?? ''}${name}`,
        packageName: plugin.name,
      });
    });
  });
}

async function createTypeManifest() {
  const plugins = JSON.parse(
    fs.readFileSync(path.join(shellRoot, 'src/plugins/shellPlugins.json'), 'utf8')
  );
  const manifest = { actions: {}, blocks: {}, operators: {} };
  for (const plugin of plugins) {
    if (!CATEGORIES.includes(plugin.category)) {
      throw new Error(
        `Shell plugin "${plugin.package}" has an unknown category. Received ${JSON.stringify(
          plugin.category
        )}.`
      );
    }
    const { default: types } = await import(`${plugin.package}/types`);
    const packageTypeNames = getPackageTypeNames({ category: plugin.category, types });
    const names = plugin.types ?? packageTypeNames;
    names.forEach((name) => {
      if (!packageTypeNames.includes(name)) {
        throw new Error(
          `Shell plugin "${plugin.package}" has no ${plugin.category} type "${name}".`
        );
      }
      addType({ category: plugin.category, manifest, name, packageName: plugin.package });
    });
  }
  const { shell } = readShellConfig();
  for (const plugin of shell.plugins ?? []) {
    if (hasTypesExport(plugin.name)) {
      await addShellPluginTypes({ manifest, plugin });
    }
  }
  return manifest;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.stdout.write(JSON.stringify(await createTypeManifest()));
}

export default createTypeManifest;
