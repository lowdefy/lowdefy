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

// Every UTC day of a window, both ends included, as `YYYY-MM-DD`.
function listWindowDays({ from, to }) {
  const days = [];
  for (
    let time = Date.parse(`${from}T00:00:00Z`);
    time <= Date.parse(`${to}T00:00:00Z`);
    time += DAY_MS
  ) {
    days.push(new Date(time).toISOString().slice(0, 10));
  }
  return days;
}

export default listWindowDays;
