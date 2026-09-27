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

// Markers the serializer hides on a copy.
const MARKERS = new Set(['~k', '~l', '~r']);

// A 53-bit string hash (cyrb53). A collision can only make config look like
// data, never data look like config: a copy always digests like its original.
function hashText(text) {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);
    h1 = Math.imul(h1 ^ code, 2654435761);
    h2 = Math.imul(h2 ^ code, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

function isSent(value) {
  return !type.isUndefined(value) && !type.isFunction(value);
}

// The array a "~arr" wrapper revives to, for as many wrappers as there are.
function unwrapArrays(value) {
  let current = value;
  while (
    type.isObject(current) &&
    type.isUndefined(current['~e']) &&
    type.isUndefined(current['~d']) &&
    type.isArray(current['~arr'])
  ) {
    current = current['~arr'];
  }
  return current;
}

// The digest of a value that has no children to digest, or null for an object
// or array. An error and its "~e" form digest alike, as do a date and its "~d"
// form, whichever the serializer has revived.
function leafDigest(value) {
  if (type.isError(value)) {
    return 'E';
  }
  if (type.isDate(value)) {
    return 'D';
  }
  if (type.isObject(value)) {
    if (!type.isUndefined(value['~e'])) {
      return 'E';
    }
    if (!type.isUndefined(value['~d'])) {
      return 'D';
    }
    return null;
  }
  if (type.isArray(value)) {
    return null;
  }
  if (type.isString(value)) {
    return hashText(`"${value}`);
  }
  return `${JSON.stringify(value)}`;
}

function sentEntries(node) {
  if (type.isArray(node)) {
    return node.map((item, index) => [index, isSent(item) ? item : null]);
  }
  return Object.keys(node)
    .filter((key) => !MARKERS.has(key) && isSent(node[key]))
    .map((key) => [key, node[key]]);
}

// Returns digest(value): a short digest of a value's content, equal for a value
// and any copy of it, however the serializer revived the copy. Each object and
// array is digested once, from its children's digests, with an explicit stack,
// so digesting a tree costs time linear in its size at any depth.
function createContentHasher() {
  const digests = new WeakMap();
  const CYCLE = 'C';

  function childDigest(child, visiting) {
    const leaf = leafDigest(child);
    if (leaf !== null) {
      return leaf;
    }
    const container = unwrapArrays(child);
    if (visiting.has(container)) {
      return CYCLE;
    }
    return digests.get(container);
  }

  function compose(node, visiting) {
    const parts = sentEntries(node).map(([key, child]) => {
      const part = childDigest(child, visiting);
      return type.isArray(node) ? part : `${JSON.stringify(key)}:${part}`;
    });
    return type.isArray(node) ? hashText(`[${parts.join(',')}]`) : hashText(`{${parts.join(',')}}`);
  }

  function digest(value) {
    const leaf = leafDigest(value);
    if (leaf !== null) {
      return leaf;
    }
    const root = unwrapArrays(value);
    const visiting = new Set();
    const pending = [root];
    while (pending.length > 0) {
      const node = pending[pending.length - 1];
      if (digests.has(node)) {
        pending.pop();
      } else if (!visiting.has(node)) {
        // First visit: digest the children first.
        visiting.add(node);
        sentEntries(node).forEach(([, child]) => {
          if (leafDigest(child) === null) {
            const container = unwrapArrays(child);
            if (!digests.has(container) && !visiting.has(container)) {
              pending.push(container);
            }
          }
        });
      } else {
        digests.set(node, compose(node, visiting));
        visiting.delete(node);
        pending.pop();
      }
    }
    return digests.get(root);
  }

  return digest;
}

export default createContentHasher;
