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

import escapeRegex from './escapeRegex.js';
import getDayRange from './getDayRange.js';
import getWithinRange from './getWithinRange.js';

// Text comparisons are case-insensitive, as in the browser, so string values of text and
// array fields match through an anchored, escaped regex.
function matchValue({ field, value }) {
  if ((field.family === 'text' || field.family === 'array') && type.isString(value)) {
    return new RegExp(`^${escapeRegex(value)}$`, 'i');
  }
  return value;
}

function emptyConditions({ path }) {
  return [{ [path]: null }, { [path]: '' }, { [path]: { $size: 0 } }];
}

function compileRange({ field, value, timeZone }) {
  const [from, to] = value;
  const range = {};
  // A date column compares whole days, so the upper bound includes all of its day.
  const byDay = field.type === 'date';
  if (!type.isNone(from)) {
    range.$gte = byDay ? getDayRange({ value: from, timeZone }).start : from;
  }
  if (!type.isNone(to)) {
    if (byDay) {
      range.$lt = getDayRange({ value: to, timeZone }).end;
    } else {
      range.$lte = to;
    }
  }
  return { [field.path]: range };
}

function compileEq({ field, value, timeZone }) {
  if (field.family === 'date') {
    const { start, end } = getDayRange({ value, timeZone });
    return { [field.path]: { $gte: start, $lt: end } };
  }
  return { [field.path]: matchValue({ field, value }) };
}

function compileNe({ field, value, timeZone }) {
  if (field.family === 'date') {
    const { start, end } = getDayRange({ value, timeZone });
    return { [field.path]: { $not: { $gte: start, $lt: end } } };
  }
  const matcher = matchValue({ field, value });
  if (type.isRegExp(matcher)) {
    return { [field.path]: { $not: matcher } };
  }
  return { [field.path]: { $ne: matcher } };
}

function compileBefore({ field, value, timeZone }) {
  const bound = field.type === 'date' ? getDayRange({ value, timeZone }).start : value;
  return { [field.path]: { $lt: bound } };
}

function compileAfter({ field, value, timeZone }) {
  if (field.type === 'date') {
    return { [field.path]: { $gte: getDayRange({ value, timeZone }).end } };
  }
  return { [field.path]: { $gt: value } };
}

// Compiles one validated filter leaf to a $match expression. The path comes from the
// allowlist and the value is a coerced scalar, so the client supplies no MongoDB syntax.
function compileLeaf({ condition, field, now, timeZone }) {
  const { path } = field;
  const { op, value } = condition;
  switch (op) {
    case 'eq':
      return compileEq({ field, value, timeZone });
    case 'ne':
      return compileNe({ field, value, timeZone });
    case 'in':
      return { [path]: { $in: value.map((item) => matchValue({ field, value: item })) } };
    case 'nin':
      return { [path]: { $nin: value.map((item) => matchValue({ field, value: item })) } };
    case 'empty':
      return { $or: emptyConditions({ path }) };
    case 'notEmpty':
      return { $nor: emptyConditions({ path }) };
    case 'contains':
      if (field.family === 'array') {
        return { [path]: matchValue({ field, value }) };
      }
      return { [path]: new RegExp(escapeRegex(value), 'i') };
    case 'notContains':
      if (field.family === 'array') {
        return compileNe({ field, value, timeZone });
      }
      return { [path]: { $not: new RegExp(escapeRegex(value), 'i') } };
    case 'startsWith':
      return { [path]: new RegExp(`^${escapeRegex(value)}`, 'i') };
    case 'endsWith':
      return { [path]: new RegExp(`${escapeRegex(value)}$`, 'i') };
    case 'gt':
    case 'gte':
    case 'lt':
    case 'lte':
      return { [path]: { [`$${op}`]: value } };
    case 'between':
      return compileRange({ field, value, timeZone });
    case 'before':
      return compileBefore({ field, value, timeZone });
    case 'after':
      return compileAfter({ field, value, timeZone });
    case 'within': {
      const { start, end } = getWithinRange({ value, now, timeZone });
      return { [path]: { $gte: start, $lt: end } };
    }
    case 'isTrue':
      return { [path]: true };
    case 'isFalse':
      return { [path]: { $ne: true } };
    default:
      throw new Error(`MongoDBTableQuery operator "${op}" is not supported.`);
  }
}

export default compileLeaf;
