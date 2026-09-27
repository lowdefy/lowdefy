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

// Returns digest(value): a short digest of a value's content, equal for a value
// and any copy of it, however the serializer revived the copy. An error and its
// "~e" form digest alike, as do a date and its "~d" form, and a "~arr" wrapper
// and its array. Each object and array is digested once, from its children's
// digests, so digesting a whole tree costs time linear in its size.
function createContentHasher() {
  const digests = new WeakMap();

  function digest(value) {
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
      if (type.isArray(value['~arr'])) {
        return digest(value['~arr']);
      }
    }
    if (type.isObject(value) || type.isArray(value)) {
      let known = digests.get(value);
      if (type.isUndefined(known)) {
        // eslint-disable-next-line no-use-before-define
        known = type.isArray(value) ? digestArray(value) : digestObject(value);
        digests.set(value, known);
      }
      return known;
    }
    if (type.isString(value)) {
      return hashText(`"${value}`);
    }
    return `${JSON.stringify(value)}`;
  }

  function digestArray(value) {
    const parts = [];
    for (const item of value) {
      parts.push(isSent(item) ? digest(item) : 'null');
    }
    return hashText(`[${parts.join(',')}]`);
  }

  function digestObject(value) {
    const parts = [];
    for (const key of Object.keys(value)) {
      if (!MARKERS.has(key) && isSent(value[key])) {
        parts.push(`${JSON.stringify(key)}:${digest(value[key])}`);
      }
    }
    return hashText(`{${parts.join(',')}}`);
  }

  return digest;
}

export default createContentHasher;
