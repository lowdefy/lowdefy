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

import { serializer, type } from '@lowdefy/helpers';

// Test fixtures for config mutants: gives every object and array of a plain
// artifact a ~k the way the build's addKeys does (a prefix and a base-36
// counter, the config path in keyMap with ids and types in array segments),
// then round-trips it through the serializer as the dev server reads a build
// artifact, so ~k comes back non-enumerable. Objects listed in `unkeyed` (by
// identity) stay without a ~k, like objects the build makes itself.
function keyArtifact({ value, prefix = 'k1_', unkeyed = [], keyMap = {}, refs = {} }) {
  let counter = 0;
  function nextKey() {
    counter += 1;
    return `${prefix}${counter.toString(36)}`;
  }
  function itemPath(arrayPath, index, item) {
    let segment = `${index}`;
    const id = item.blockId ?? item.requestId ?? item.id;
    if (id) segment = `${segment}:${id}`;
    if (item.type) segment = `${segment}:${item.type}`;
    return `${arrayPath}[${segment}]`;
  }
  function mark(node, path) {
    if (unkeyed.includes(node)) {
      return;
    }
    const key = nextKey();
    keyMap[key] = { key: path, ...(refs[path] ?? {}) };
    Object.defineProperty(node, '~k', { value: key, enumerable: false, configurable: true });
  }
  function walk(node, path) {
    if (type.isArray(node)) {
      mark(node, path);
      node.forEach((item, index) => {
        if (type.isObject(item)) walk(item, itemPath(path, index, item));
        else if (type.isArray(item)) walk(item, `${path}[${index}]`);
      });
      return;
    }
    if (!type.isObject(node)) return;
    mark(node, path);
    Object.keys(node).forEach((key) => walk(node[key], `${path}.${key}`));
  }
  walk(value, 'root');
  return { root: serializer.deserialize(serializer.serialize(value)), keyMap };
}

export default keyArtifact;
