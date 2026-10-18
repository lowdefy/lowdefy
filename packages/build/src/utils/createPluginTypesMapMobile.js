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

import { ConfigError } from '@lowdefy/errors';
import { type } from '@lowdefy/helpers';

import defaultTypesMapMobile from '../defaultTypesMapMobile.js';

// The mobile type map merges plugin types over the built-in ones, so a plugin
// type with a built-in name would quietly replace the built-in type on every
// mobile page.
function checkBuiltInClash({ category, name, packageName, typePrefix }) {
  if (defaultTypesMapMobile[category][name] === undefined) {
    return;
  }
  const kind = category.slice(0, -1);
  const prefixText = typePrefix === '' ? 'with no typePrefix' : `with typePrefix "${typePrefix}"`;
  throw new ConfigError(
    `Shell plugin "${packageName}" gives the native ${kind} type "${name}" ${prefixText}, which is a built-in native ${kind} type. Set a typePrefix on the plugin in mobile.shells[].plugins that keeps its type names apart from the built-in ones.`
  );
}

function addTypeDefinitions({ category, packageName, store, typeNames, typePrefix, version }) {
  if (!type.isArray(typeNames)) {
    return;
  }
  typeNames.forEach((typeName) => {
    checkBuiltInClash({ category, name: `${typePrefix}${typeName}`, packageName, typePrefix });
    store[`${typePrefix}${typeName}`] = {
      package: packageName,
      originalTypeName: typeName,
      version,
    };
  });
}

function addPrefixedEntries({ entries, store, typePrefix }) {
  if (!type.isObject(entries)) {
    return;
  }
  Object.entries(entries).forEach(([typeName, value]) => {
    store[`${typePrefix}${typeName}`] = value;
  });
}

// A shell plugin's native types, from the `native` key of its ./types
// ({ blocks, actions, blockMetas, icons }), into the mobile type map. The
// plugin's other keys are web types, which createPluginTypesMap reads into the
// web map, so its web blocks never reach a shell. A native block or action
// named like a built-in native type is refused, as lowdefy mobile config's
// type manifest refuses it.
function createPluginTypesMapMobile({
  packageName,
  packageTypes,
  typePrefix = '',
  typesMap,
  version,
}) {
  if (!type.isObject(packageTypes.native)) {
    return;
  }
  const { actions, blockMetas, blocks, icons } = packageTypes.native;
  addTypeDefinitions({
    category: 'blocks',
    packageName,
    store: typesMap.blocks,
    typeNames: blocks,
    typePrefix,
    version,
  });
  addTypeDefinitions({
    category: 'actions',
    packageName,
    store: typesMap.actions,
    typeNames: actions,
    typePrefix,
    version,
  });
  addPrefixedEntries({ entries: blockMetas, store: typesMap.blockMetas, typePrefix });
  addPrefixedEntries({ entries: icons, store: typesMap.icons, typePrefix });
}

export default createPluginTypesMapMobile;
