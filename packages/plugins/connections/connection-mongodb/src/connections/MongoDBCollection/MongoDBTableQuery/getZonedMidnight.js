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

import getZonedParts from './getZonedParts.js';

// Milliseconds the wall clock of the time zone is ahead of UTC at an instant.
function getOffset({ time, timeZone }) {
  const parts = getZonedParts({ date: new Date(time), timeZone });
  const wallClock = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  );
  return wallClock - (time - (time % 1000));
}

// The instant a calendar day starts in an IANA time zone. `day` may run past the month
// (day 32 is the 1st of the next month), as with Date.UTC. The offset is read again at the
// first guess, so a day that starts in another offset (a daylight saving change) is right.
function getZonedMidnight({ year, month, day, timeZone }) {
  const utcMidnight = Date.UTC(year, month - 1, day);
  const firstGuess = utcMidnight - getOffset({ time: utcMidnight, timeZone });
  return new Date(utcMidnight - getOffset({ time: firstGuess, timeZone }));
}

export default getZonedMidnight;
