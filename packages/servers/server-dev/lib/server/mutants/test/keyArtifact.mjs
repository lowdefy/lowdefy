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
//
// Entries are in the short shape, `{ s, p }`: the node's own path segment
// (everything its path adds to the nearest keyed ancestor's) and that
// ancestor's id; the root's parent id is never written. `shape: 'full'` writes
// the full shape instead, `{ key, '~k_parent' }`, which readers still accept.
function keyArtifact({
  value,
  prefix = 'k1_',
  unkeyed = [],
  keyMap = {},
  refs = {},
  shape = 'short',
}) {
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
  // Keys the node and returns the keyed ancestor its children chain to.
  function mark(node, path, parent) {
    if (unkeyed.includes(node)) {
      return parent;
    }
    const key = nextKey();
    if (shape === 'full') {
      keyMap[key] = { key: path, '~k_parent': parent.key, ...(refs[path] ?? {}) };
    } else {
      keyMap[key] = { s: path.slice(parent.path.length), p: parent.key, ...(refs[path] ?? {}) };
    }
    Object.defineProperty(node, '~k', { value: key, enumerable: false, configurable: true });
    return { key, path };
  }
  function walk(node, path, parent) {
    if (type.isArray(node)) {
      const keyed = mark(node, path, parent);
      node.forEach((item, index) => {
        if (type.isObject(item)) walk(item, itemPath(path, index, item), keyed);
        else if (type.isArray(item)) walk(item, `${path}[${index}]`, keyed);
      });
      return;
    }
    if (!type.isObject(node)) return;
    const keyed = mark(node, path, parent);
    Object.keys(node).forEach((key) => walk(node[key], `${path}.${key}`, keyed));
  }
  walk(value, 'root', { key: `${prefix}parent`, path: '' });
  return { root: serializer.deserialize(serializer.serialize(value)), keyMap };
}

export default keyArtifact;
