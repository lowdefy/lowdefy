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
import getOperators from '@lowdefy/blocks-antd/table/getOperators.js';

import defaultRelativeDate from './defaultRelativeDate.js';

// A new filter condition for a column: `in` for columns with options (pick values), otherwise the
// type's first operator. It has no value yet, so it filters nothing until one is chosen.
function createDefaultLeaf({ column }) {
  const operators = getOperators(column.type);
  let op = operators[0];
  if (!type.isNone(column.options) && operators.includes('in')) op = 'in';
  const leaf = { key: column.key, op };
  if (op === 'within') leaf.value = defaultRelativeDate;
  return leaf;
}

export default createDefaultLeaf;
