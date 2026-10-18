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

// Structural equality over values that have already been through a JSON
// round-trip (a page's state read in the browser or on a phone: no undefined,
// no Dates, no functions) — so key order is the only thing that must not matter.
function isDeepEqual(a, b) {
  if (a === b) {
    return true;
  }
  if (type.isArray(a) && type.isArray(b)) {
    return a.length === b.length && a.every((item, index) => isDeepEqual(item, b[index]));
  }
  if (type.isObject(a) && type.isObject(b)) {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    return keysA.length === keysB.length && keysA.every((key) => isDeepEqual(a[key], b[key]));
  }
  return false;
}

export default isDeepEqual;
