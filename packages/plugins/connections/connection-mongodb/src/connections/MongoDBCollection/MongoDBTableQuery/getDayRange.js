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

// Day boundaries are UTC: the server has no viewer time zone, and date-only values
// ("2026-03-01") parse as UTC midnight.
function getDayRange({ value }) {
  const start = new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
  const end = new Date(start.getTime() + DAY_MS);
  return { start, end };
}

export default getDayRange;
