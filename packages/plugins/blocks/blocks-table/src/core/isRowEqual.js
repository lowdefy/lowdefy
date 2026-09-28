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

// Structural equality for row objects coming out of the Lowdefy engine, which hands the block
// fresh copies whenever `data` is re-evaluated. Plain data only: objects, arrays, dates, primitives.
function isRowEqual(a, b) {
  if (a === b) return true;
  if (type.isDate(a) && type.isDate(b)) return a.getTime() === b.getTime();
  if (type.isArray(a)) {
    if (!type.isArray(b) || a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!isRowEqual(a[i], b[i])) return false;
    }
    return true;
  }
  if (type.isObject(a)) {
    if (!type.isObject(b)) return false;
    const aKeys = Object.keys(a);
    if (aKeys.length !== Object.keys(b).length) return false;
    for (let i = 0; i < aKeys.length; i++) {
      const key = aKeys[i];
      if (!isRowEqual(a[key], b[key])) return false;
    }
    return true;
  }
  return false;
}

export default isRowEqual;
