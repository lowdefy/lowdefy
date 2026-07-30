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

const disabledDate = (disabledDates = {}) => {
  const min = type.isNone(disabledDates.min)
    ? undefined
    : toWallClock(disabledDates.min).startOf('day');
  const max = type.isNone(disabledDates.max)
    ? undefined
    : toWallClock(disabledDates.max).endOf('day');
  const dates = (disabledDates.dates || []).map((date) => toWallClock(date).startOf('day'));
  const ranges = (disabledDates.ranges || [])
    .map((range) => {
      if (type.isArray(range) && range.length === 2) {
        return [toWallClock(range[0]).startOf('day'), toWallClock(range[1]).endOf('day')];
      }
      return null;
    })
    .filter((range) => range !== null);

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
