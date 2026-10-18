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
import { type } from '@lowdefy/helpers';

import toPickerDate from './toPickerDate.js';

/**
 * A `disabledDates.min` or `max` bound as the native picker's minimum or maximum date. A bound
 * names a calendar day, as on the web, so a date string is read as that day.
 *
 * @param {Object} params
 * @param {Date|string} [params.bound]
 * @returns {Date|undefined}
 */
function toBoundDate({ bound }) {
  if (type.isNone(bound)) {
    return undefined;
  }
  if (type.isDate(bound)) {
    return toPickerDate({ value: bound });
  }
  const parsed = dayjs(bound);
  if (!parsed.isValid()) {
    throw new Error(`disabledDates bound is not a date. Received ${JSON.stringify(bound)}.`);
  }
  return new Date(parsed.year(), parsed.month(), parsed.date());
}

export default toBoundDate;
