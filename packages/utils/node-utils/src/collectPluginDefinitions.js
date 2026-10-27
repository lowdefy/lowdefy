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

import { type } from '@lowdefy/helpers';

// The shell plugins a raw read of lowdefy.yaml can see. A `mobile`, `shells`
// or `plugins` value under _ref is not an array or object here; the build,
// which resolves refs, fails on any shell plugin left out this way.
function readShellEntries({ lowdefy }) {
  const shells = lowdefy.mobile?.shells;
  if (!type.isArray(shells)) {
    return [];
  }
  return shells.flatMap((shell) => {
    if (!type.isObject(shell) || !type.isArray(shell.plugins)) {
      return [];
    }
    return shell.plugins
      .filter((plugin) => type.isObject(plugin) && type.isString(plugin.name))
      .map((plugin) => ({ plugin, source: `shell "${shell.id}"` }));
  });
}

// The plugins the server installs and the build reads types from, from a raw
// (unresolved) read of lowdefy.yaml:
// - plugins: root `plugins`, then each package only `mobile.shells[].plugins`
//   lists, once per package name. The web type map uses these entries. A
//   shell-only entry is marked shellOnly: it may be native-only, with no
//   `./types` export, which root plugins must have.
// - shellPlugins: each package any shell lists, once. Their `native` types go
//   into the mobile type map, with the shell entry's typePrefix.
// The server installs one copy of each package, so every listing of a package
// must name the same version, and one mobile type map serves every shell, so
// every shell must give a package the same typePrefix.
function collectPluginDefinitions({ lowdefy }) {
  const rootPlugins = type.isArray(lowdefy?.plugins) ? lowdefy.plugins : [];
  const shellEntries = type.isObject(lowdefy) ? readShellEntries({ lowdefy }) : [];

  const listed = new Map();
  rootPlugins.forEach((plugin) => {
    if (type.isObject(plugin) && !listed.has(plugin.name)) {
      listed.set(plugin.name, { version: plugin.version, source: 'root plugins' });
    }
  });

  const plugins = [...rootPlugins];
  const shellPlugins = new Map();
  shellEntries.forEach(({ plugin, source }) => {
    const first = listed.get(plugin.name);
    if (first && first.version !== plugin.version) {
      throw new Error(
        `Plugin "${plugin.name}" is listed at version ${JSON.stringify(first.version)} in ${
          first.source
        } and ${JSON.stringify(plugin.version)} in ${source}. ` +
          'The server installs one version of each plugin, so list the same version everywhere.'
      );
    }
    if (!first) {
      listed.set(plugin.name, { version: plugin.version, source });
      plugins.push({
        name: plugin.name,
        version: plugin.version,
        typePrefix: plugin.typePrefix,
        shellOnly: true,
      });
    }
    const shellPlugin = shellPlugins.get(plugin.name);
    if (shellPlugin && shellPlugin.typePrefix !== plugin.typePrefix) {
      throw new Error(
        `Plugin "${plugin.name}" has typePrefix ${JSON.stringify(shellPlugin.typePrefix)} in ${
          shellPlugin.source
        } and ${JSON.stringify(plugin.typePrefix)} in ${source}. ` +
          'Every shell shares one set of native type names, so give the plugin the same typePrefix in every shell.'
      );
    }
    if (!shellPlugin) {
      shellPlugins.set(plugin.name, {
        name: plugin.name,
        version: plugin.version,
        typePrefix: plugin.typePrefix,
        source,
      });
    }
  });

  return {
    plugins,
    shellPlugins: [...shellPlugins.values()].map(({ name, version, typePrefix }) => ({
      name,
      version,
      typePrefix,
    })),
  };
}

export default collectPluginDefinitions;
