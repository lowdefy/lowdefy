/*
  Copyright 2020-2023 Lowdefy, Inc

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

function recAddKeys(object, key, keyMap, parentId) {
  const id = makeId();
  keyMap[id] = {
    key,
    _r_: object._r_,
    _k_parent: parentId,
  };
  Object.defineProperty(object, '_k_', {
    value: id,
    enumerable: false,
    writable: true,
    configurable: true,
  });
  delete object._r_;
  Object.keys(object).forEach((nextKey) => {
    if (type.isObject(object[nextKey])) {
      recAddKeys(object[nextKey], `${key}.${nextKey}`, keyMap, id);
    }
    if (type.isArray(object[nextKey])) {
      object[nextKey].forEach((item, index) => {
        if (type.isObject(item)) {
          recAddKeys(
            item,
            `${key}.${nextKey}[${index}:${
              item.blockId ??
              item.menuId ??
              item.menuItemId ??
              item.requestId ??
              item.connectionId ??
              item.connectionId ??
              item.id
              // TODO: Convert all artifacts to not modify id.
            }:${item.type}]`,
            keyMap,
            id
          );
        }
      });
    }
  });
}

function addKeys({ components, context }) {
  const id = makeId();
  recAddKeys(components, 'root', context.keyMap, id);
}

export default addKeys;
