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

// Integration point: this file will re-export `createComparator` from
// `@lowdefy/blocks-antd/table/createComparator.js` once the shared column core lands. Until then
// it is a minimal typed comparator with the brief's semantics: one shared Intl.Collator for
// text, numbers and dates compared numerically, nulls last.

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

function isEmpty(value) {
  return type.isNone(value) || value === '' || (type.isArray(value) && value.length === 0);
}

function toComparable(value) {
  if (type.isDate(value)) return value.getTime();
  if (type.isBoolean(value)) return value ? 1 : 0;
  if (type.isArray(value)) return value.join(', ');
  return value;
}

function createComparator() {
  return function compare(a, b) {
    const aEmpty = isEmpty(a);
    const bEmpty = isEmpty(b);
    if (aEmpty && bEmpty) return 0;
    if (aEmpty) return 1;
    if (bEmpty) return -1;
    const left = toComparable(a);
    const right = toComparable(b);
    if (type.isNumber(left) && type.isNumber(right)) return left - right;
    return collator.compare(String(left), String(right));
  };
}

export default createComparator;
