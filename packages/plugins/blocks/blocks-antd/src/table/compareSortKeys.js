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

// One collator for every text sort: creating one per compare is the slow part
// of localeCompare. `numeric` sorts "Item 2" before "Item 10".
const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

// Compares two sort keys from createSortKeyGetter. Null (empty) keys sort last
// in both directions, so pass `desc` rather than negating the result. Strings
// compare with the shared collator (case- and accent-insensitive,
// numeric-aware); a number (an enum value with an option) comes before a
// string (one without).
function compareSortKeys(keyA, keyB, desc = false) {
  if (keyA === null || keyB === null) {
    if (keyA === keyB) return 0;
    return keyA === null ? 1 : -1;
  }
  const direction = desc ? -1 : 1;
  const aIsString = type.isString(keyA);
  const bIsString = type.isString(keyB);
  if (aIsString && bIsString) {
    return direction * collator.compare(keyA, keyB);
  }
  if (aIsString !== bIsString) {
    return direction * (aIsString ? 1 : -1);
  }
  if (keyA === keyB) return 0;
  return direction * (keyA < keyB ? -1 : 1);
}

export default compareSortKeys;
