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

import type from './type.js';

import getOperatorLabel from './getOperatorLabel.js';

// Column types whose values are lists (tags, people): their operators read as "has".
const ARRAY_TYPES = new Set(['tags', 'people']);
const NO_VALUE_OPS = new Set(['empty', 'notEmpty', 'isTrue', 'isFalse']);
const UNIT_WORDS = {
  day: ['day', 'days'],
  week: ['week', 'weeks'],
  month: ['month', 'months'],
  year: ['year', 'years'],
};

function joinList(words, conjunction) {
  if (words.length <= 1) return words.join('');
  return `${words.slice(0, -1).join(', ')} ${conjunction} ${words[words.length - 1]}`;
}

function isRelative(value) {
  return type.isObject(value) && (type.isNumber(value.last) || type.isNumber(value.next));
}

function describeAmount({ count, unit }) {
  const [one, many] = UNIT_WORDS[unit] ?? [unit, unit];
  return `${count} ${count === 1 ? one : many}`;
}

// "the last 7 days", "the next month"
function describeWithin(value) {
  const direction = type.isNumber(value.last) ? 'last' : 'next';
  const count = value[direction];
  const [one] = UNIT_WORDS[value.unit] ?? [value.unit];
  return `the ${direction} ${count === 1 ? one : describeAmount({ count, unit: value.unit })}`;
}

// "3 months ago", "2 weeks from now"
function describeRelativeBound(value) {
  if (type.isNumber(value.last))
    return `${describeAmount({ count: value.last, unit: value.unit })} ago`;
  return `${describeAmount({ count: value.next, unit: value.unit })} from now`;
}

function describeUser(value) {
  return value.$user === 'id' ? 'me' : `my ${value.$user}`;
}

function describeScalar({ value, field }) {
  if (type.isObject(value) && type.isString(value.$user)) return describeUser(value);
  if (type.isNone(value) || value === '') return 'nothing';
  const option = type.isArray(field?.options)
    ? field.options.find((entry) => type.isObject(entry) && entry.value === value)
    : undefined;
  if (option !== undefined && !type.isNone(option.label)) return String(option.label);
  if (type.isDate(value)) return value.toISOString();
  if (type.isObject(value)) return JSON.stringify(value);
  return String(value);
}

function describeValues({ value, field, conjunction }) {
  if (type.isObject(value) && type.isString(value.$user)) return describeUser(value);
  const list = type.isArray(value) ? value : [value];
  return joinList(
    list.map((item) => describeScalar({ value: item, field })),
    conjunction
  );
}

function describeBetween({ value, field }) {
  const [from, to] = type.isArray(value) ? value : [null, null];
  const hasFrom = !type.isNone(from) && from !== '';
  const hasTo = !type.isNone(to) && to !== '';
  if (hasFrom && hasTo) {
    return `between ${describeScalar({ value: from, field })} and ${describeScalar({
      value: to,
      field,
    })}`;
  }
  if (hasFrom) return `from ${describeScalar({ value: from, field })}`;
  if (hasTo) return `up to ${describeScalar({ value: to, field })}`;
  return 'between any dates';
}

function describeLeaf({ leaf, fields }) {
  const field = type.isString(leaf.key) && type.isObject(fields) ? fields[leaf.key] : undefined;
  const known = type.isObject(field) && Object.prototype.hasOwnProperty.call(fields, leaf.key);
  // A key that names no field (one an app removed) is still described, never dropped.
  const subject = known
    ? String(type.isNone(field.title) || field.title === '' ? leaf.key : field.title)
    : `an unknown field, ${String(leaf.key)},`;
  const family = known && ARRAY_TYPES.has(field.type) ? 'array' : null;
  const { op, value } = leaf;
  const words = getOperatorLabel({ op, family });
  if (NO_VALUE_OPS.has(op)) return `${subject} ${words}`;
  if (op === 'between') return `${subject} ${describeBetween({ value, field })}`;
  if (op === 'within' && isRelative(value)) return `${subject} within ${describeWithin(value)}`;
  if ((op === 'before' || op === 'after') && isRelative(value)) {
    return `${subject} ${words} ${describeRelativeBound(value)}`;
  }
  if (op === 'in' || op === 'nin') {
    return `${subject} ${words} ${describeValues({ value, field, conjunction: 'or' })}`;
  }
  return `${subject} ${words} ${describeScalar({ value, field })}`;
}

function describeNode({ condition, fields, depth }) {
  if (!type.isObject(condition)) return null;
  const groupOp = ['and', 'or'].find((op) => type.isArray(condition[op]));
  if (groupOp === undefined) {
    if (!type.isString(condition.op)) return null;
    return describeLeaf({ leaf: condition, fields });
  }
  const parts = condition[groupOp]
    .map((child) => describeNode({ condition: child, fields, depth: depth + 1 }))
    .filter((part) => part !== null);
  if (parts.length === 0) return null;
  if (parts.length === 1) return parts[0];
  const sentence = parts.join(` ${groupOp} `);
  return depth === 0 ? sentence : `(${sentence})`;
}

// A Table filter condition ({ and } / { or } groups of { key, op, value } leaves) as one plain
// sentence: "Warmth is any of Hot or Warm and Title contains CX". `fields` is keyed by the
// condition keys, each { title, type, options: [{ value, label }] }, the shape of
// MongoDBTableQuery fields (the Table passes its columns in that shape), so the page and the
// request describe a view in the same words. Option values read as their labels, relative dates
// in words ("before 3 months ago"), { $user: id } as "me", and groups below the first level in
// brackets. Returns null for a condition that constrains nothing.
function describeCondition({ condition, fields = {} }) {
  return describeNode({ condition, fields, depth: 0 });
}

export default describeCondition;
