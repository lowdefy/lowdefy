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
import utc from 'dayjs/plugin/utc.js';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore.js';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter.js';
import { type } from '@lowdefy/helpers';

dayjs.extend(utc);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

// A picker calls disabledDate with the dayjs instance its panel works in, which is a UTC mode
// instance when the block reads its value as a UTC wall clock and a local mode instance when it
// does not. Both name the calendar date the user sees, so it is the wall clock that is compared and
// the bounds are read the same way. Comparing the instants instead makes the same calendar date
// disabled or allowed depending on which mode it arrives in.
const toWallClock = (date) => {
  // Wrap with our dayjs to ensure the utc plugin is available — antd v6's internal dayjs instance
  // may not have it loaded.
  const wrapped = dayjs(date);
  return dayjs.utc(wrapped.format('YYYY-MM-DDTHH:mm:ss.SSS'));
};

function toConfiguredDate({ date, key }) {
  if (type.isNone(date)) {
    throw new Error(`disabledDates.${key} is missing.`);
  }
  if (!dayjs(date).isValid()) {
    throw new Error(`disabledDates.${key} is not a date. Received ${JSON.stringify(date)}.`);
  }
  return toWallClock(date);
}

function toConfiguredArray({ key, value }) {
  if (type.isNone(value)) return [];
  if (!type.isArray(value)) {
    throw new Error(`disabledDates.${key} is not an array. Received ${JSON.stringify(value)}.`);
  }
  return value;
}

// A range is documented as { from, to }. An array of a from and a to date is the shape the block
// read before, so it is still accepted. Anything else is a config error: dropping it left a range
// that read as valid config but disabled nothing.
function toRangeBounds({ index, range }) {
  if (type.isArray(range)) {
    if (range.length !== 2) {
      throw new Error(
        `disabledDates.ranges[${index}] is not an array of a from and a to date. Received ${JSON.stringify(
          range
        )}.`
      );
    }
    return { from: range[0], to: range[1] };
  }
  if (type.isObject(range)) {
    return { from: range.from, to: range.to };
  }
  throw new Error(
    `disabledDates.ranges[${index}] is not an object with a from and a to date. Received ${JSON.stringify(
      range
    )}.`
  );
}

const disabledDate = (disabledDatesConfig) => {
  if (!type.isNone(disabledDatesConfig) && !type.isObject(disabledDatesConfig)) {
    throw new Error(
      `disabledDates is not an object. Received ${JSON.stringify(disabledDatesConfig)}.`
    );
  }
  const disabledDates = disabledDatesConfig ?? {};
  const min = type.isNone(disabledDates.min)
    ? undefined
    : toConfiguredDate({ date: disabledDates.min, key: 'min' }).startOf('day');
  const max = type.isNone(disabledDates.max)
    ? undefined
    : toConfiguredDate({ date: disabledDates.max, key: 'max' }).endOf('day');
  const dates = toConfiguredArray({ key: 'dates', value: disabledDates.dates }).map((date, index) =>
    toConfiguredDate({ date, key: `dates[${index}]` }).startOf('day')
  );
  const ranges = toConfiguredArray({ key: 'ranges', value: disabledDates.ranges }).map(
    (range, index) => {
      const { from, to } = toRangeBounds({ index, range });
      return [
        toConfiguredDate({ date: from, key: `ranges[${index}].from` }).startOf('day'),
        toConfiguredDate({ date: to, key: `ranges[${index}].to` }).endOf('day'),
      ];
    }
  );

  return (currentDate) => {
    const current = toWallClock(currentDate);
    if (min && current.isBefore(min)) return true;
    if (max && current.isAfter(max)) return true;
    let match = dates.find((date) => date.isSame(current.startOf('day')));
    if (match) return true;
    ranges.forEach((range) => {
      if (
        current.startOf('day').isSameOrAfter(range[0]) &&
        current.endOf('day').isSameOrBefore(range[1])
      ) {
        match = true;
      }
    });
    return !!match;
  };
};

export default disabledDate;
