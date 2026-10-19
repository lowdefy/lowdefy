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

import { get, serializer, type, unset } from '@lowdefy/helpers';

// Removes the keys a place selection wrote from the block value, keeping any
// sibling keys written into the same value object by other blocks. Returns null
// when nothing else is left, so an empty address reads as no value.
function removePlaceKeys({ placeKeys, value }) {
  if (!type.isObject(value)) {
    return { removed: !type.isNone(value), value: null };
  }
  const remaining = serializer.copy(value);
  let removed = false;
  placeKeys.forEach((key) => {
    if (type.isUndefined(get(remaining, key))) return;
    unset(remaining, key);
    removed = true;
    // A dotted resultMapping target nests the field, so drop any parent object
    // the removal left empty.
    const segments = key.split('.');
    for (let depth = segments.length - 1; depth > 0; depth -= 1) {
      const parentKey = segments.slice(0, depth).join('.');
      const parent = get(remaining, parentKey);
      if (!type.isObject(parent) || Object.keys(parent).length > 0) break;
      unset(remaining, parentKey);
    }
  });
  if (Object.keys(remaining).length === 0) {
    return { removed, value: null };
  }
  return { removed, value: remaining };
}

export default removePlaceKeys;
