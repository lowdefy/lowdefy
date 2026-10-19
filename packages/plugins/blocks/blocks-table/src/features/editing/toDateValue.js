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

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import { type } from '@lowdefy/helpers';

dayjs.extend(utc);

const DAY_STRING = /^\d{4}-\d{2}-\d{2}$/;

// The stored value for a picked date. A `date` is a calendar day: stored as UTC midnight, the
// same Date the DateSelector block writes. The previous value's shape is kept, so a column of
// 'YYYY-MM-DD' strings stays strings and a column of ISO strings stays ISO strings.
function toDateValue({ date, kind, previous }) {
  if (type.isNone(date)) return null;
  const picked = dayjs(date);
  if (!picked.isValid()) return null;
  if (kind === 'date') {
    const day = picked.format('YYYY-MM-DD');
    if (type.isString(previous) && DAY_STRING.test(previous)) return day;
    const utcDay = dayjs.utc(day).toDate();
    if (type.isString(previous)) return utcDay.toISOString();
    return utcDay;
  }
  const instant = picked.toDate();
  if (type.isString(previous)) return instant.toISOString();
  return instant;
}

export default toDateValue;
