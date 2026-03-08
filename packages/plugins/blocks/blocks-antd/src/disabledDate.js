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
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore.js';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter.js';
import { type } from '@lowdefy/helpers';

dayjs.extend(utc);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

const disabledDate = (disabledDates = {}) => {
  const min = type.isNone(disabledDates.min)
    ? undefined
    : dayjs(disabledDates.min).utc().startOf('day');
  const max = type.isNone(disabledDates.max)
    ? undefined
    : dayjs(disabledDates.max).utc().endOf('day');
  const dates = (disabledDates.dates || []).map((date) => dayjs(date).utc().startOf('day'));
  const ranges = (disabledDates.ranges || [])
    .map((range) => {
      if (type.isArray(range) && range.length === 2) {
        return [dayjs(range[0]).utc().startOf('day'), dayjs(range[1]).utc().endOf('day')];
      }
      return null;
    })
    .filter((range) => range !== null);

  return (currentDate) => {
    const utcCurrentData = currentDate.utc();
    if (min && utcCurrentData.isBefore(min)) return true;
    if (max && utcCurrentData.isAfter(max)) return true;
    let match = dates.find((date) => date.isSame(utcCurrentData.startOf('day')));
    if (match) return true;
    ranges.forEach((range) => {
      if (
        utcCurrentData.startOf('day').isSameOrAfter(range[0]) &&
        utcCurrentData.endOf('day').isSameOrBefore(range[1])
      ) {
        match = true;
      }
    });
    return !!match;
  };
};

export default disabledDate;
