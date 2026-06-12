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
import { ConfigError, VALID_CHECK_SLUGS } from '@lowdefy/errors';

import collectExceptions from '../utils/collectExceptions.js';
import makeId from '../utils/makeId.js';
import setNonEnumerableProperty from '../utils/setNonEnumerableProperty.js';

// S2a: compiled modules carry a lexical key id (`<fileId>:<n>`, non-enumerable
// ~lk) — deterministic per source position, stable across builds. It becomes
// the ~k id; the same source position instantiated more than once (a file
// reffed twice, a var injected at several sites) gets a deterministic
// tree-walk-order suffix. Nodes without ~lk (walker-resolved content,
// synthesized config) keep the sequential counter.
function nextKeyMapId(node, usedLexIds) {
  const lexId = node['~lk'];
  if (lexId === undefined) {
    return makeId.next();
  }
  const seen = usedLexIds.get(lexId) ?? 0;
  usedLexIds.set(lexId, seen + 1);
  return seen === 0 ? lexId : `${lexId}.${seen}`;
}

function recArray({ array, arrayKey, keyMap, parentKeyMapId, context, usedLexIds }) {
  let arrayKeyMapId;

  if (array['~k']) {
    arrayKeyMapId = array['~k'];
  } else {
    arrayKeyMapId = nextKeyMapId(array, usedLexIds);
    const entry = {
      key: arrayKey,
      '~k_parent': parentKeyMapId,
    };
    if (array['~r'] !== undefined) entry['~r'] = array['~r'];
    if (array['~l'] !== undefined) entry['~l'] = array['~l'];
    keyMap[arrayKeyMapId] = entry;
    Object.defineProperty(array, '~k', {
      value: arrayKeyMapId,
      enumerable: false,
      writable: true,
      configurable: true,
    });
    delete array['~r'];
    delete array['~l'];
    delete array['~lk'];
  }

  array.forEach((item, index) => {
    if (type.isObject(item)) {
      let path = `${arrayKey}[${index}]`;
      // TODO: Convert all artifacts to not modify id.
      const id =
        item.blockId ??
        item.menuId ??
        item.menuItemId ??
        item.requestId ??
        item.connectionId ??
        item.id;
      if (id) {
        path = `${path.slice(0, -1)}:${id}]`;
      }
      if (item.type) {
        path = `${path.slice(0, -1)}:${item.type}]`;
      }
      recAddKeys({
        object: item,
        key: path,
        keyMap: keyMap,
        parentKeyMapId: arrayKeyMapId,
        context,
        usedLexIds,
      });
    }
    if (type.isArray(item)) {
      recArray({
        array: item,
        arrayKey: `${arrayKey}[${index}]`,
        keyMap,
        parentKeyMapId: arrayKeyMapId,
        context,
        usedLexIds,
      });
    }
  });
}

function recAddKeys({ object, key, keyMap, parentKeyMapId, context, usedLexIds }) {
  let keyMapId;
  let storedKey = key;

  // Skip objects that already have a ~k (already processed)
  if (object['~k']) {
    keyMapId = object['~k'];
    // Use the stored key from keyMap for correct child paths
    storedKey = keyMap[keyMapId]?.key ?? key;
  } else {
    keyMapId = nextKeyMapId(object, usedLexIds);
    const entry = {
      key,
      '~k_parent': parentKeyMapId,
    };
    if (object['~r'] !== undefined) entry['~r'] = object['~r'];
    if (object['~l'] !== undefined) entry['~l'] = object['~l'];

    // Add entry to keyMap BEFORE validation so errors can resolve location
    keyMap[keyMapId] = entry;

    // Handle ~ignoreBuildChecks property
    if (object['~ignoreBuildChecks'] !== undefined) {
      const checks = object['~ignoreBuildChecks'];

      if (Array.isArray(checks)) {
        const validSlugs = Object.keys(VALID_CHECK_SLUGS);
        const invalid = checks.filter((slug) => !validSlugs.includes(slug));
        if (invalid.length > 0) {
          collectExceptions(
            context,
            new ConfigError(
              `Invalid check slug(s): "${invalid.join('", "')}". Valid slugs: ${validSlugs.join(
                ', '
              )}`,
              { configKey: keyMapId }
            )
          );
        }
      } else if (checks !== true) {
        collectExceptions(
          context,
          new ConfigError('~ignoreBuildChecks must be true or an array of check slugs.', {
            received: checks,
            configKey: keyMapId,
          })
        );
      }

      entry['~ignoreBuildChecks'] = checks;
    }
    setNonEnumerableProperty(object, '~k', keyMapId);
    delete object['~r'];
    delete object['~l'];
    delete object['~lk'];
    delete object['~ignoreBuildChecks'];
  }

  // Always recurse into children (they may be new objects without keys)
  Object.keys(object).forEach((nextKey) => {
    if (type.isObject(object[nextKey])) {
      recAddKeys({
        object: object[nextKey],
        key: `${storedKey}.${nextKey}`,
        keyMap: keyMap,
        parentKeyMapId: keyMapId,
        context,
        usedLexIds,
      });
    }
    if (type.isArray(object[nextKey])) {
      recArray({
        array: object[nextKey],
        arrayKey: `${storedKey}.${nextKey}`,
        keyMap,
        parentKeyMapId: keyMapId,
        context,
        usedLexIds,
      });
    }
  });
}

function addKeys({ components, context }) {
  const keyMapId = makeId.next();
  // Lexical-id instance counts live on the context: addKeys runs more than
  // once per build (synthesized nodes), and suffix assignment must not
  // restart between passes.
  context.usedLexIds = context.usedLexIds ?? new Map();
  recAddKeys({
    object: components,
    key: 'root',
    keyMap: context.keyMap,
    parentKeyMapId: keyMapId,
    context,
    usedLexIds: context.usedLexIds,
  });
}

export default addKeys;
