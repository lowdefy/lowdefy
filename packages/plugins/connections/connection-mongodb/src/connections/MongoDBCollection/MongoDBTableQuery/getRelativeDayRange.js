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
import shiftDay from './shiftDay.js';

// The day a relative date names, as the instants it starts and ends in the time zone:
// { last: 3, unit: 'month' } is the day 3 months before today, { next: 2, unit: 'week' } the day
// 2 weeks after today. `before` and `after` compare against it as they compare a fixed date on a
// date column, by whole days.
function getRelativeDayRange({ value, now, timeZone }) {
  const today = getZonedParts({ date: now, timeZone });
  const count = value.last !== undefined ? -value.last : value.next;
  const day = shiftDay({ date: today, count, unit: value.unit });
  return {
    start: getZonedMidnight({ ...day, timeZone }),
    end: getZonedMidnight({ ...day, day: day.day + 1, timeZone }),
  };
}

export default getRelativeDayRange;
