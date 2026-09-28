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

import getGroupOperator from './getGroupOperator.js';
import textFilterOperators from './textFilterOperators.js';

function parseOptions(leaf) {
  if (leaf.op === 'in' && type.isArray(leaf.value)) return { selected: leaf.value };
  return null;
}

function parseText(leaf) {
  if (!textFilterOperators.includes(leaf.op)) return null;
  return { op: leaf.op, value: leaf.value };
}

function parseNumber(leaf) {
  if (leaf.op === 'between' && type.isArray(leaf.value)) {
    return { min: leaf.value[0] ?? null, max: leaf.value[1] ?? null };
  }
  if (leaf.op === 'gte') return { min: leaf.value, max: null };
  if (leaf.op === 'lte') return { min: null, max: leaf.value };
  return null;
}

function parseDate(leaf) {
  if (leaf.op === 'between' && type.isArray(leaf.value)) {
    return { mode: 'range', from: leaf.value[0] ?? null, to: leaf.value[1] ?? null };
  }
  if (leaf.op === 'within' && type.isObject(leaf.value)) {
    return { mode: 'relative', relative: leaf.value };
  }
  return null;
}

function parseChoice({ leaf, choices }) {
  return choices.includes(leaf.op) ? { choice: leaf.op } : null;
}

const EMPTY_STATES = {
  options: { selected: [] },
  text: { op: 'contains', value: undefined },
  number: { min: null, max: null },
  date: { mode: 'range', from: null, to: null },
  boolean: { choice: 'any' },
  presence: { choice: 'any' },
};

// The simple column filter's state from the column's conditions in `view.filter`, or null when
// they need the advanced builder (several conditions, a group, an operator the simple editor
// does not offer).
function parseColumnFilter({ kind, conditions }) {
  if (conditions.length === 0) return EMPTY_STATES[kind];
  if (conditions.length > 1) return null;
  const leaf = conditions[0];
  if (getGroupOperator(leaf) !== null) return null;
  switch (kind) {
    case 'options':
      return parseOptions(leaf);
    case 'text':
      return parseText(leaf);
    case 'number':
      return parseNumber(leaf);
    case 'date':
      return parseDate(leaf);
    case 'boolean':
      return parseChoice({ leaf, choices: ['isTrue', 'isFalse'] });
    default:
      return parseChoice({ leaf, choices: ['empty', 'notEmpty'] });
  }
}

export default parseColumnFilter;
