/*
  Copyright 2020-2022 Lowdefy, Inc

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

function recAddKeys(object, key, keyMap) {
  const id = makeId(keyMap);
  keyMap[id] = {
    key,
    _r_: object._r_,
  };
  object._k_ = id;
  delete object._r_;
  Object.keys(object).forEach((nextKey) => {
    if (type.isObject(object[nextKey])) {
      recAddKeys(object[nextKey], `${key}.${nextKey}`, keyMap);
    }
    if (type.isArray(object[nextKey])) {
      object[nextKey].forEach((item, index) => {
        if (type.isObject(item)) {
          recAddKeys(item, `${key}.${nextKey}.${index}`, keyMap);
        }
      });
    }
  });
}

function addKeys({ components, context }) {
  recAddKeys(components, 'root', context.keyMap);
}

export default addKeys;
