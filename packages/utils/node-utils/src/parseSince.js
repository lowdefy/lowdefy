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

const DURATION_PATTERN = /^(\d+)(m|h|d)$/;
const UNIT_MS = { m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 };

// `--since` takes a duration back from now (`30m`, `2h`, `7d`) or a date.
// Returns the epoch milliseconds the window starts at.
function parseSince({ since, now }) {
  const duration = DURATION_PATTERN.exec(since);
  if (duration !== null) {
    return now - Number(duration[1]) * UNIT_MS[duration[2]];
  }
  const time = Date.parse(since);
  if (Number.isNaN(time)) {
    throw new Error(
      `--since takes a duration such as 30m, 2h or 7d, or an ISO date. Received "${since}".`
    );
  }
  return time;
}

export default parseSince;
