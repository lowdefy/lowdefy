/*
  Copyright 2020-2024 Lowdefy, Inc

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
import { ConfigError, VALID_CHECK_SLUGS } from '@lowdefy/node-utils';

import makeId from '../utils/makeId.js';

function recArray({ array, nextKey, key, keyMap, keyMapId, context }) {
  array.forEach((item, index) => {
    if (type.isObject(item)) {
      let path = `${key}.${nextKey}[${index}]`;
      // TODO: Convert all artifacts to not modify id.
      const id =
        item.blockId ??
        item.menuId ??
        item.menuItemId ??
        item.requestId ??
        item.connectionId ??
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
        parentKeyMapId: keyMapId,
        context,
      });
    }
    if (type.isArray(item)) {
      recArray({ array: item, nextKey, key, keyMap, keyMapId, context });
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

    // Add entry to keyMap BEFORE validation so errors can resolve location
    keyMap[keyMapId] = entry;

    // Migration error for old property name
    if (object['~ignoreBuildCheck'] !== undefined) {
      throw new ConfigError({
        message:
          '~ignoreBuildCheck has been renamed to ~ignoreBuildChecks. ' +
          'Use ~ignoreBuildChecks: true to suppress all checks, or ' +
          "~ignoreBuildChecks: ['state-refs', 'types'] to suppress specific checks.",
        configKey: keyMapId,
        context,
      });
    }

    // Handle new ~ignoreBuildChecks property
    if (object['~ignoreBuildChecks'] !== undefined) {
      const checks = object['~ignoreBuildChecks'];

      if (Array.isArray(checks)) {
        const validSlugs = Object.keys(VALID_CHECK_SLUGS);
        const invalid = checks.filter((slug) => !validSlugs.includes(slug));
        if (invalid.length > 0) {
          throw new ConfigError({
            message: `Invalid check slug(s): "${invalid.join('", "')}". Valid slugs: ${validSlugs.join(', ')}`,
            configKey: keyMapId,
            context,
          });
        }
      } else if (checks !== true) {
        throw new ConfigError({
          message: `~ignoreBuildChecks must be true or an array of check slugs. Received: ${JSON.stringify(checks)}`,
          configKey: keyMapId,
          context,
        });
      }

      entry['~ignoreBuildChecks'] = checks;
    }
    Object.defineProperty(object, '~k', {
      value: keyMapId,
      enumerable: false,
      writable: true,
      configurable: true,
    });
    delete object['~r'];
    delete object['~l'];
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
      recArray({ array: object[nextKey], nextKey, key: storedKey, keyMap, keyMapId, context });
    }
  });
}

function addKeys({ components, context }) {
  const keyMapId = makeId.next();
  recAddKeys({ object: components, key: 'root', keyMap: context.keyMap, parentKeyMapId: keyMapId, context });
}

export default addKeys;
