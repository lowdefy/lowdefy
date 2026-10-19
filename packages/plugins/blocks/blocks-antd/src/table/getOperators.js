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

import CELL_TYPE_FAMILIES from './cellTypeFamilies.js';

const COMMON = ['eq', 'ne', 'in', 'nin', 'empty', 'notEmpty'];

// In the order a filter menu lists them: the type's own operators first.
const OPERATORS_BY_FAMILY = {
  text: ['contains', 'notContains', 'startsWith', 'endsWith', ...COMMON],
  number: [...COMMON.slice(0, 2), 'gt', 'gte', 'lt', 'lte', 'between', ...COMMON.slice(2)],
  date: ['before', 'after', 'between', 'within', ...COMMON],
  boolean: ['isTrue', 'isFalse', ...COMMON],
  array: ['in', 'nin', 'contains', 'notContains', 'eq', 'ne', 'empty', 'notEmpty'],
  other: COMMON,
  action: [],
};

// The condition operators a column of this cell type supports.
function getOperators(cellType) {
  const family = CELL_TYPE_FAMILIES[cellType ?? 'text'];
  if (type.isUndefined(family)) {
    throw new Error(`Unknown table cell type "${cellType}".`);
  }
  return [...OPERATORS_BY_FAMILY[family]];
}

export default getOperators;
