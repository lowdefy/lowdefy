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

const DAY_MS = 24 * 60 * 60 * 1000;

function shiftDate({ date, count, unit }) {
  const shifted = new Date(date.getTime());
  switch (unit) {
    case 'day':
      return new Date(date.getTime() + count * DAY_MS);
    case 'week':
      return new Date(date.getTime() + count * 7 * DAY_MS);
    case 'month':
      shifted.setUTCMonth(shifted.getUTCMonth() + count);
      return shifted;
    default:
      shifted.setUTCFullYear(shifted.getUTCFullYear() + count);
      return shifted;
  }
}

// { last: 7, unit: 'day' } is the seven days up to now; { next: 1, unit: 'month' } is from
// now to the same time next month.
function getWithinRange({ value, now }) {
  if (value.last !== undefined) {
    return { start: shiftDate({ date: now, count: -value.last, unit: value.unit }), end: now };
  }
  return { start: now, end: shiftDate({ date: now, count: value.next, unit: value.unit }) };
}

export default getWithinRange;
