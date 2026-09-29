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

// Limits on the work one filter can ask of MongoDB: every condition and group is a node of
// the $match, every value a comparison per document (a case-insensitive regex for text).
const MAX_DEPTH = 8;
const MAX_NODES = 200;
const MAX_VALUES = 1000;
const MAX_VALUE_LENGTH = 200;
const leafKeys = ['key', 'op', 'value'];

function getValueList(value) {
  if (type.isArray(value)) return value.filter((item) => !type.isNone(item));
  if (type.isNone(value)) return [];
  return [value];
}

function countValues({ field, value, counter }) {
  getValueList(value).forEach((item) => {
    if (type.isString(item) && item.length > MAX_VALUE_LENGTH) {
      throw new Error(
        `MongoDBTableQuery filter on "${field.key}": a value can have at most ${MAX_VALUE_LENGTH} characters. Received a string of ${item.length}.`
      );
    }
    counter.values += 1;
  });
  if (counter.values > MAX_VALUES) {
    throw new Error(`MongoDBTableQuery filter has more than ${MAX_VALUES} values.`);
  }
}

function parseLeaf({ condition, fieldsByKey, user, timeZone, counter }) {
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
  const value = parseLeafValue({
    field,
    op: condition.op,
    value: condition.value,
    user,
    timeZone,
  });
  countValues({ field, value, counter });
  return { key: field.key, op: condition.op, value };
}

// Validates a view filter against the allowlist and returns it with every value coerced
// to its field's type. Anything that is not a { and }, { or } group or a
// { key, op, value } leaf is refused, so no MongoDB syntax passes through.
function parseCondition({
  condition,
  fieldsByKey,
  user,
  timeZone,
  depth = 0,
  counter = { nodes: 0, values: 0 },
}) {
  if (!type.isObject(condition)) {
    throw new Error(
      `MongoDBTableQuery filter condition is not an object. Received ${JSON.stringify(condition)}.`
    );
  }
  if (depth > MAX_DEPTH) {
    throw new Error(`MongoDBTableQuery filter is nested deeper than ${MAX_DEPTH} levels.`);
  }
  counter.nodes += 1;
  if (counter.nodes > MAX_NODES) {
    throw new Error(`MongoDBTableQuery filter has more than ${MAX_NODES} conditions and groups.`);
  }
  const isGroup =
    Object.prototype.hasOwnProperty.call(condition, 'and') ||
    Object.prototype.hasOwnProperty.call(condition, 'or');
  if (!isGroup) {
    return parseLeaf({ condition, fieldsByKey, user, timeZone, counter });
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
      parseCondition({
        condition: child,
        fieldsByKey,
        user,
        timeZone,
        depth: depth + 1,
        counter,
      })
    ),
  };
}

export default parseCondition;
