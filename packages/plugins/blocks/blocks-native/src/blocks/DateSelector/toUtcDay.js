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

/**
 * The DateSelector value for the day a native date picker returns: that local calendar day at
 * midnight UTC, the value the web DateSelector sets.
 *
 * @param {Object} params
 * @param {Date} params.date The picked date, in local time.
 * @returns {Date}
 */
function toUtcDay({ date }) {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
}

export default toUtcDay;
