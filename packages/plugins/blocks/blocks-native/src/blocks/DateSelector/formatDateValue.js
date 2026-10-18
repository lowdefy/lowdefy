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
import { getLocaleDateFormat, type } from '@lowdefy/helpers';

dayjs.extend(utc);

/**
 * The text a DateSelector shows for its value, in its `format`, else the locale's date format,
 * else YYYY-MM-DD, as the web DateSelector formats it. The value is a day at midnight UTC.
 *
 * @param {Object} params
 * @param {string} [params.format]
 * @param {string} [params.locale]
 * @param {Date|null} params.value
 * @returns {string|null}
 */
function formatDateValue({ format, locale, value }) {
  if (!type.isDate(value)) {
    return null;
  }
  return dayjs.utc(value).format(format ?? getLocaleDateFormat(locale) ?? 'YYYY-MM-DD');
}

export default formatDateValue;
