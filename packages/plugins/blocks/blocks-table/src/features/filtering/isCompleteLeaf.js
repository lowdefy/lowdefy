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
import isEmptyValue from '@lowdefy/blocks-antd/table/isEmptyValue.js';

const NO_VALUE_OPS = new Set(['empty', 'notEmpty', 'isTrue', 'isFalse']);
const WITHIN_UNITS = new Set(['day', 'week', 'month', 'year']);

function isCompleteWithin(value) {
  if (!type.isObject(value) || !WITHIN_UNITS.has(value.unit)) return false;
  return type.isNumber(value.last) || type.isNumber(value.next);
}

// A view filter leaf someone is still building (no column, or an operator without its value yet)
// constrains nothing: the filter builder writes the condition to the view while it is edited, and
// a half-built `in: []` must not hide every row.
function isCompleteLeaf(leaf) {
  if (type.isNone(leaf.key) || !type.isString(leaf.op)) return false;
  if (NO_VALUE_OPS.has(leaf.op)) return true;
  if (leaf.op === 'within') return isCompleteWithin(leaf.value);
  if (leaf.op === 'between') {
    return (
      type.isArray(leaf.value) &&
      leaf.value.length === 2 &&
      leaf.value.some((bound) => !isEmptyValue(bound))
    );
  }
  return !isEmptyValue(leaf.value);
}

export default isCompleteLeaf;
