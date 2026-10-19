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

import getZonedMidnight from './getZonedMidnight.js';
import getZonedParts from './getZonedParts.js';

function daysInMonth({ year, month }) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

// A calendar day moved by count units. A month or year keeps the day of the month, clamped to
// the last day of a shorter month (31 March less a month is 28 February), as the Table does.
function shiftDay({ date, count, unit }) {
  const { year, month, day } = date;
  if (unit === 'day') return { year, month, day: day + count };
  if (unit === 'week') return { year, month, day: day + 7 * count };
  const monthIndex = (unit === 'month' ? month - 1 + count : month - 1) + year * 12;
  const shiftedYear = Math.floor(monthIndex / 12) + (unit === 'year' ? count : 0);
  const shiftedMonth = (monthIndex % 12) + 1;
  return {
    year: shiftedYear,
    month: shiftedMonth,
    day: Math.min(day, daysInMonth({ year: shiftedYear, month: shiftedMonth })),
  };
}

function startOf({ date, timeZone }) {
  return getZonedMidnight({ ...date, timeZone });
}

function endOf({ date, timeZone }) {
  return getZonedMidnight({ ...date, day: date.day + 1, timeZone });
}

// Whole days in the time zone, as the Table filters in the browser: { last: 7, unit: 'day' }
// is from the start of the day 7 days ago to the end of today; { next: 1, unit: 'month' } is
// from the start of today to the end of the same day next month. `end` is exclusive.
function getWithinRange({ value, now, timeZone }) {
  const today = getZonedParts({ date: now, timeZone });
  if (value.last !== undefined) {
    return {
      start: startOf({
        date: shiftDay({ date: today, count: -value.last, unit: value.unit }),
        timeZone,
      }),
      end: endOf({ date: today, timeZone }),
    };
  }
  return {
    start: startOf({ date: today, timeZone }),
    end: endOf({ date: shiftDay({ date: today, count: value.next, unit: value.unit }), timeZone }),
  };
}

export default getWithinRange;
