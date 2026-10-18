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

function addTypeDefinitions({ packageName, store, typeNames, typePrefix, version }) {
  if (!type.isArray(typeNames)) {
    return;
  }
  typeNames.forEach((typeName) => {
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
// web map, so its web blocks never reach a shell.
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
    packageName,
    store: typesMap.blocks,
    typeNames: blocks,
    typePrefix,
    version,
  });
  addTypeDefinitions({
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
