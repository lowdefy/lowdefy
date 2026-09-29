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

// The day an instant falls on in the time zone (`timezone`, default UTC), as the instants it
// starts and ends. A date-only value ("2026-03-01") is already that day's start
// (coerceScalar), so it is its own day.
function getDayRange({ value, timeZone }) {
  const { year, month, day } = getZonedParts({ date: value, timeZone });
  return {
    start: getZonedMidnight({ year, month, day, timeZone }),
    end: getZonedMidnight({ year, month, day: day + 1, timeZone }),
  };
}

export default getDayRange;
