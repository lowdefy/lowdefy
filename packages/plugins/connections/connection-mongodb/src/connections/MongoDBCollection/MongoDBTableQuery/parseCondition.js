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

import getViewField from './getViewField.js';
import parseLeafValue from './parseLeafValue.js';

const MAX_DEPTH = 8;
const MAX_LEAVES = 200;
const leafKeys = ['key', 'op', 'value'];

function parseLeaf({ condition, fieldsByKey, user }) {
  const extraKey = Object.keys(condition).find((key) => !leafKeys.includes(key));
  if (!type.isUndefined(extraKey)) {
    throw new Error(
      `MongoDBTableQuery filter condition has an unknown key "${extraKey}". Received ${JSON.stringify(
        condition
      )}.`
    );
  }
  const field = getViewField({ fieldsByKey, key: condition.key, part: 'filter' });
  if (!field.filterable) {
    throw new Error(`MongoDBTableQuery field "${field.key}" is not filterable.`);
  }
  if (!type.isString(condition.op) || !field.operators.includes(condition.op)) {
    throw new Error(
      `MongoDBTableQuery filter on "${field.key}": operator ${JSON.stringify(
        condition.op
      )} is not allowed for type "${field.type}". Allowed operators: ${field.operators.join(', ')}.`
    );
  }
  return {
    key: field.key,
    op: condition.op,
    value: parseLeafValue({ field, op: condition.op, value: condition.value, user }),
  };
}

// Validates a view filter against the allowlist and returns it with every value coerced
// to its field's type. Anything that is not a { and }, { or } group or a
// { key, op, value } leaf is refused, so no MongoDB syntax passes through.
function parseCondition({ condition, fieldsByKey, user, depth = 0, counter = { leaves: 0 } }) {
  if (!type.isObject(condition)) {
    throw new Error(
      `MongoDBTableQuery filter condition is not an object. Received ${JSON.stringify(condition)}.`
    );
  }
  if (depth > MAX_DEPTH) {
    throw new Error(`MongoDBTableQuery filter is nested deeper than ${MAX_DEPTH} levels.`);
  }
  const isGroup =
    Object.prototype.hasOwnProperty.call(condition, 'and') ||
    Object.prototype.hasOwnProperty.call(condition, 'or');
  if (!isGroup) {
    counter.leaves += 1;
    if (counter.leaves > MAX_LEAVES) {
      throw new Error(`MongoDBTableQuery filter has more than ${MAX_LEAVES} conditions.`);
    }
    return parseLeaf({ condition, fieldsByKey, user });
  }
  const keys = Object.keys(condition);
  const [groupOp] = keys;
  if (keys.length !== 1 || !type.isArray(condition[groupOp])) {
    throw new Error(
      `MongoDBTableQuery filter group must have exactly one "and" or "or" array. Received ${JSON.stringify(
        condition
      )}.`
    );
  }
  return {
    [groupOp]: condition[groupOp].map((child) =>
      parseCondition({ condition: child, fieldsByKey, user, depth: depth + 1, counter })
    ),
  };
}

export default parseCondition;
