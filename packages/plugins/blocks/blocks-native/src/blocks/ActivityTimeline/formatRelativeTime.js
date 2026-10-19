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

import toTime from './toTime.js';

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * How long ago `at` was, as a timeline says it: "just now" under a minute, then "5m", "3h" and
 * "2d", and from a week the date, "3 Oct", with the year when it is not this year. A time
 * slightly in the future (a clock ahead of this one) reads "just now". '' with no time.
 *
 * @param {Object} params
 * @param {Date|string|number} params.at
 * @param {number} params.now Milliseconds since the epoch.
 * @returns {string}
 */
function formatRelativeTime({ at, now }) {
  const time = toTime(at);
  if (time === null) {
    return '';
  }
  const age = now - time;
  if (age < MINUTE) {
    return 'just now';
  }
  if (age < HOUR) {
    return `${Math.floor(age / MINUTE)}m`;
  }
  if (age < DAY) {
    return `${Math.floor(age / HOUR)}h`;
  }
  if (age < WEEK) {
    return `${Math.floor(age / DAY)}d`;
  }
  const date = new Date(time);
  const day = `${date.getDate()} ${MONTHS[date.getMonth()]}`;
  if (date.getFullYear() === new Date(now).getFullYear()) {
    return day;
  }
  return `${day} ${date.getFullYear()}`;
}

export default formatRelativeTime;
