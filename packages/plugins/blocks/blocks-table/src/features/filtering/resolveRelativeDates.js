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

import dayjs from 'dayjs';
import { type } from '@lowdefy/helpers';

import isRelativeDate from './isRelativeDate.js';

function resolveBound({ op, value, now }) {
  const day =
    typeof value.last === 'number'
      ? now.subtract(value.last, value.unit)
      : now.add(value.next, value.unit);
  // The day's first or last instant: `before` and `after` then compare whole days on date and
  // datetime columns alike, as `MongoDBTableQuery` does for a relative bound.
  return (op === 'after' ? day.endOf('day') : day.startOf('day')).toISOString();
}

// The condition with every relative `before` and `after` value (`{ last | next, unit }`) turned into
// the instant it names today, so the browser row test compares it as a fixed date.
function resolveRelativeDates({ condition, now = dayjs() }) {
  if (!type.isObject(condition)) return condition;
  const groupOp = ['and', 'or'].find((op) => type.isArray(condition[op]));
  if (groupOp) {
    return {
      ...condition,
      [groupOp]: condition[groupOp].map((child) => resolveRelativeDates({ condition: child, now })),
    };
  }
  if ((condition.op === 'before' || condition.op === 'after') && isRelativeDate(condition.value)) {
    return { ...condition, value: resolveBound({ op: condition.op, value: condition.value, now }) };
  }
  return condition;
}

export default resolveRelativeDates;
