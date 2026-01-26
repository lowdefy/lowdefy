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

import makeId from '../utils/makeId.js';

function recArray({ array, nextKey, key, keyMap, keyMapId }) {
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
      });
    }
    if (type.isArray(item)) {
      recArray({ array: item, nextKey, key, keyMap, keyMapId });
    }
  });
}

function recAddKeys({ object, key, keyMap, parentKeyMapId }) {
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
    if (object['~ignoreBuildCheck'] !== undefined)
      entry['~ignoreBuildCheck'] = object['~ignoreBuildCheck'];
    keyMap[keyMapId] = entry;
    Object.defineProperty(object, '~k', {
      value: keyMapId,
      enumerable: false,
      writable: true,
      configurable: true,
    });
    delete object['~r'];
    delete object['~l'];
    delete object['~ignoreBuildCheck'];
  }

  // Always recurse into children (they may be new objects without keys)
  Object.keys(object).forEach((nextKey) => {
    if (type.isObject(object[nextKey])) {
      recAddKeys({
        object: object[nextKey],
        key: `${storedKey}.${nextKey}`,
        keyMap: keyMap,
        parentKeyMapId: keyMapId,
      });
    }
    if (type.isArray(object[nextKey])) {
      recArray({ array: object[nextKey], nextKey, key: storedKey, keyMap, keyMapId });
    }
  });
}

function addKeys({ components, context }) {
  const keyMapId = makeId.next();
  recAddKeys({ object: components, key: 'root', keyMap: context.keyMap, parentKeyMapId: keyMapId });
}

export default addKeys;
