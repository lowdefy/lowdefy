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

import { FILE_PLUGIN_PACKAGE_ID } from './discoverFilePlugins.js';
import filePluginDirectories from './filePluginDirectories.js';

const filePluginKinds = [...new Set(filePluginDirectories.flatMap(({ kinds }) => kinds))];

function withoutFilePluginDefinitions(store) {
  const kept = {};
  for (const [typeName, definition] of Object.entries(store)) {
    if (definition?.packageId !== FILE_PLUGIN_PACKAGE_ID) {
      kept[typeName] = definition;
    }
  }
  return kept;
}

/**
 * Returns a copy of a typesMap with every file-plugin definition removed.
 *
 * The dev manager writes discovered file plugins into customTypesMap.json so the
 * docs endpoints and the JIT page builder can read them. Merging that copy into
 * the build's typesMap would let a file plugin shadow a package type of the same
 * name silently, which is exactly what the collision check exists to prevent, so
 * the copy is dropped and discovery is the build's only source of file plugins.
 */
function withoutFilePluginTypes(typesMap) {
  if (!type.isObject(typesMap)) {
    return typesMap;
  }
  const result = { ...typesMap };
  for (const kind of filePluginKinds) {
    const segments = kind.split('.');
    const storeName = segments.pop();
    let node = result;
    for (const segment of segments) {
      if (!type.isObject(node[segment])) {
        node = null;
        break;
      }
      node[segment] = { ...node[segment] };
      node = node[segment];
    }
    if (node === null || !type.isObject(node[storeName])) {
      continue;
    }
    node[storeName] = withoutFilePluginDefinitions(node[storeName]);
  }
  // A connectionMetas entry carries no packageId, so a file connection's meta is
  // dropped by name: any meta whose type no longer survives above was a file
  // plugin's (or shadowed a package's) and must not outlive it.
  if (type.isObject(result.connectionMetas)) {
    const kept = {};
    for (const [typeName, meta] of Object.entries(result.connectionMetas)) {
      if (!type.isUndefined(result.connections?.[typeName])) {
        kept[typeName] = meta;
      }
    }
    result.connectionMetas = kept;
  }
  return result;
}

export default withoutFilePluginTypes;
