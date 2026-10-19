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

// Deep equality for state values. Identity comes first: the engine's republish writes usually put
// back the reference state already holds. Plain objects, arrays and dates compare by content;
// anything else (functions, class instances) only by identity, so an unfamiliar value is reported
// as changed rather than silently treated as equal.
function valuesEqual(a, b) {
  if (a === b) {
    return true;
  }
  if (type.isDate(a) && type.isDate(b)) {
    return a.getTime() === b.getTime();
  }
  if (type.isArray(a) && type.isArray(b)) {
    return a.length === b.length && a.every((item, i) => valuesEqual(item, b[i]));
  }
  if (type.isObject(a) && type.isObject(b)) {
    const keys = Object.keys(a);
    if (keys.length !== Object.keys(b).length) {
      return false;
    }
    return keys.every((key) => Object.hasOwn(b, key) && valuesEqual(a[key], b[key]));
  }
  return false;
}

export default valuesEqual;
