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

const PLACEHOLDER_KEYS = ['_ref', '_case'];

function joinPath({ base, key }) {
  if (type.isNumber(key)) {
    return `${base}[${key}]`;
  }
  return base === '' ? key : `${base}.${key}`;
}

function findIn({ value, at }) {
  if (type.isArray(value)) {
    for (const [index, entry] of value.entries()) {
      const found = findIn({ value: entry, at: joinPath({ base: at, key: index }) });
      if (!type.isUndefined(found)) return found;
    }
    return undefined;
  }
  if (!type.isObject(value)) {
    return undefined;
  }
  const key = PLACEHOLDER_KEYS.find((placeholder) => Object.hasOwn(value, placeholder));
  if (!type.isUndefined(key)) {
    return { at, key, value };
  }
  for (const [childKey, child] of Object.entries(value)) {
    const found = findIn({ value: child, at: joinPath({ base: at, key: childKey }) });
    if (!type.isUndefined(found)) return found;
  }
  return undefined;
}

function describe({ at, key, value }) {
  const written = JSON.stringify(value);
  if (key === '_case') {
    return `Journey "${at}" is a _case placeholder, ${written}, with no case row to fill it in: _case reads a key of a row of the journey's "cases" table.`;
  }
  return `Journey "${at}" is a _ref, ${written}, that was not read: _ref is resolved only when lowdefy test reads a journey file.`;
}

// A journey's values are sent and compared as written, so a `_case` or `_ref` left in one would
// be sent as a literal object: a `_case` in a journey with no "cases" (or inside a row's value),
// or either one in a journey posted to the dev server, which takes literal values. `journey` is
// the journey's run fields (steps, stubs, user, data, pageId, ...), after its refs were read and
// its row filled in. Returns { error } naming the first one by its path, or {}.
function findJourneyPlaceholder({ journey }) {
  const found = findIn({ value: journey, at: '' });
  return type.isUndefined(found) ? {} : { error: describe(found) };
}

export default findJourneyPlaceholder;
