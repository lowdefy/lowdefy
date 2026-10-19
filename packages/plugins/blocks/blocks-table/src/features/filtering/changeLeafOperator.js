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

import defaultRelativeDate from './defaultRelativeDate.js';
import getValueShape from './getValueShape.js';

// A new operator keeps the value when it has the same shape, turns a scalar into a one-item list
// (and back), and otherwise starts empty.
function changeLeafOperator({ leaf, op }) {
  const from = getValueShape(leaf.op);
  const to = getValueShape(op);
  const next = { key: leaf.key, op };
  if (to === 'none') return next;
  if (to === 'relative') {
    next.value = from === 'relative' ? leaf.value : defaultRelativeDate;
    return next;
  }
  if (from === to) {
    if (!type.isUndefined(leaf.value)) next.value = leaf.value;
    return next;
  }
  if (from === 'scalar' && to === 'list' && !type.isNone(leaf.value) && leaf.value !== '') {
    next.value = [leaf.value];
  }
  if (from === 'list' && to === 'scalar' && type.isArray(leaf.value) && leaf.value.length > 0) {
    next.value = leaf.value[0];
  }
  return next;
}

export default changeLeafOperator;
