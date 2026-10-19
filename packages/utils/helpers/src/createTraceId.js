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

const SUFFIX_LENGTH = 6;

function pad(number, length = 2) {
  return String(number).padStart(length, '0');
}

function randomSuffix() {
  let suffix = '';
  while (suffix.length < SUFFIX_LENGTH) {
    suffix += Math.floor(Math.random() * 36).toString(36);
  }
  return suffix;
}

// `<yyyymmdd>T<hhmmss>Z-<6 base36>` in UTC. Names a recorded tab session or a
// test run; ids sort by time, and the date part picks the trace's date
// directory, so a session that crosses midnight stays in one file.
function createTraceId({ now } = {}) {
  const date = new Date(now ?? Date.now());
  const day = `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}`;
  const time = `${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}`;
  return `${day}T${time}Z-${randomSuffix()}`;
}

export default createTraceId;
