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
import findSimilarString from '../utils/findSimilarString.js';
import makeId from '../utils/makeId.js';
import setNonEnumerableProperty from '../utils/setNonEnumerableProperty.js';

function recArray({ array, arrayKey, keyMap, parentKeyMapId, context }) {
  let arrayKeyMapId;

  if (array['~k']) {
    arrayKeyMapId = array['~k'];
  } else {
    arrayKeyMapId = makeId.next();
    const entry = {
      key: arrayKey,
      '~k_parent': parentKeyMapId,
    };
    if (array['~r'] !== undefined) entry['~r'] = array['~r'];
    if (array['~l'] !== undefined) entry['~l'] = array['~l'];
    if (array['~c'] !== undefined) entry['~c'] = array['~c'];
    keyMap[arrayKeyMapId] = entry;
    Object.defineProperty(array, '~k', {
      value: arrayKeyMapId,
      enumerable: false,
      writable: true,
      configurable: true,
    });
    delete array['~r'];
    delete array['~l'];
    delete array['~c'];
  }

  array.forEach((item, index) => {
    if (type.isObject(item)) {
      let path = `${arrayKey}[${index}]`;
      // TODO: Convert all artifacts to not modify id.
      // Keys are added to the raw config, where a page request still carries
      // its own `id` next to `connectionId` — the request id must win, or the
      // key path names the connection instead of the request.
      const id =
        item.blockId ??
        item.menuId ??
        item.menuItemId ??
        item.requestId ??
        item.id ??
        item.connectionId;
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
      });
    }
    if (type.isArray(item)) {
      recArray({
        array: item,
        arrayKey: `${arrayKey}[${index}]`,
        keyMap,
        parentKeyMapId: arrayKeyMapId,
        context,
      });
    }
  });
}

function recAddKeys({ object, key, keyMap, parentKeyMapId, context }) {
  let keyMapId;
  let storedKey = key;

  // Skip objects that already have a ~k (already processed)
  if (object['~k']) {
    keyMapId = object['~k'];
    // Use the stored key from keyMap for correct child paths
    storedKey = keyMap[keyMapId]?.key ?? key;
  } else {
    keyMapId = makeId.next();
    const entry = {
      key,
      '~k_parent': parentKeyMapId,
    };
    if (object['~r'] !== undefined) entry['~r'] = object['~r'];
    if (object['~l'] !== undefined) entry['~l'] = object['~l'];
    if (object['~c'] !== undefined) entry['~c'] = object['~c'];
    if (object['~x'] !== undefined) entry['~x'] = object['~x'];

    // Add entry to keyMap BEFORE validation so errors can resolve location
    keyMap[keyMapId] = entry;

    // ~ignoreBuildChecks is validated here and nowhere else: the key is deleted
    // from the config below, before testSchema reads the JSON schema.
    if (object['~ignoreBuildChecks'] !== undefined) {
      const checks = object['~ignoreBuildChecks'];
      const validSlugs = Object.keys(VALID_CHECK_SLUGS);

      if (Array.isArray(checks)) {
        const invalid = checks.filter((slug) => !validSlugs.includes(slug));
        invalid.forEach((slug) => {
          let message = `Invalid check slug "${slug}" in ~ignoreBuildChecks.`;
          const suggestion = findSimilarString({ input: slug, candidates: validSlugs });
          if (suggestion) {
            message += ` Did you mean "${suggestion}"?`;
          }
          message += ` Valid slugs: ${validSlugs.join(', ')}.`;
          collectExceptions(
            context,
            new ConfigError(message, { received: slug, configKey: keyMapId })
          );
        });
      } else {
        collectExceptions(
          context,
          new ConfigError(
            `~ignoreBuildChecks must be an array of check slugs. Valid slugs: ${validSlugs.join(
              ', '
            )}.`,
            {
              received: checks,
              configKey: keyMapId,
            }
          )
        );
      }

      entry['~ignoreBuildChecks'] = checks;
    }
    setNonEnumerableProperty(object, '~k', keyMapId);
    delete object['~r'];
    delete object['~l'];
    delete object['~c'];
    delete object['~x'];
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
      });
    }
    if (type.isArray(object[nextKey])) {
      recArray({
        array: object[nextKey],
        arrayKey: `${storedKey}.${nextKey}`,
        keyMap,
        parentKeyMapId: keyMapId,
        context,
      });
    }
  });
}

function addKeys({ components, context }) {
  const keyMapId = makeId.next();
  recAddKeys({
    object: components,
    key: 'root',
    keyMap: context.keyMap,
    parentKeyMapId: keyMapId,
    context,
  });
}

export default addKeys;
