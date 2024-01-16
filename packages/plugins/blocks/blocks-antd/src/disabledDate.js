/*
  Copyright 2020-2024 Lowdefy, Inc

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

import moment from 'moment';
import { type } from '@lowdefy/helpers';

const disabledDate = (disabledDates = {}) => {
  const min = type.isNone(disabledDates.min)
    ? undefined
    : moment(disabledDates.min).utc().startOf('day');
  const max = type.isNone(disabledDates.max)
    ? undefined
    : moment(disabledDates.max).utc().endOf('day');
  const dates = (disabledDates.dates || []).map((date) => moment(date).utc().startOf('day'));
  const ranges = (disabledDates.ranges || [])
    .map((range) => {
      if (type.isArray(range) && range.length === 2) {
        return [moment(range[0]).utc().startOf('day'), moment(range[1]).utc().endOf('day')];
      }
      return null;
    })
    .filter((range) => range !== null);

  return (currentDate) => {
    const utcCurrentData = currentDate.clone().utc();
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
