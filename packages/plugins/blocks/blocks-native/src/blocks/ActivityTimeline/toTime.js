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

import { type } from '@lowdefy/helpers';

/**
 * Milliseconds since the epoch for a Date, an ISO string or a number; for a paging cursor
 * `<ISO date>~<id>`, the time of its date. Null when there is no valid time.
 *
 * @param {Date|string|number} value
 * @returns {number|null}
 */
function toTime(value) {
  if (type.isNone(value)) {
    return null;
  }
  let date = value;
  if (type.isString(value)) {
    const cut = value.indexOf('~');
    date = new Date(cut < 0 ? value : value.slice(0, cut));
  } else if (!type.isDate(value)) {
    date = new Date(value);
  }
  const time = date.getTime();
  return Number.isNaN(time) ? null : time;
}

export default toTime;
