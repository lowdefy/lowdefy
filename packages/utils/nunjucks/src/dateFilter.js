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

/** DERIVED FROM
 * nunjucks-date-filter-local
 * Fork from https://github.com/piwi/nunjucks-date-filter
 *
 * Copyright (c) 2015 Pierre Cassat
 * Licensed under the Apache 2.0 license.
 */

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import relativeTime from 'dayjs/plugin/relativeTime.js';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import nunjucks from 'nunjucks';
import { type } from '@lowdefy/helpers';

dayjs.extend(utc);
dayjs.extend(relativeTime);
dayjs.extend(customParseFormat);

// default default format (ISO 8601)
let dateFilterDefaultFormat = null;

// a date filter for Nunjucks
// usage: {{ my_date | date(format) }}
// see: <https://day.js.org/docs/en/display/format>
const dateFilter = (date, format, ...args) => {
  // for no date, return undefined.
  if (type.isNone(date)) {
    return '';
  }
  // allow for dayjs function chaining, but return "Invalid date" for objects, arrays, and booleans.
  if ((type.isArray(date) || type.isObject(date) || type.isBoolean(date)) && !dayjs.isDayjs(date)) {
    return 'Invalid Date';
  }
  let result;
  const errs = [];
  let obj;
  try {
    obj = dayjs(date);
    if (obj[format] && type.isFunction(obj[format])) {
      result = obj[format](...args);
    } else {
      result = obj.format(format ?? dateFilterDefaultFormat);
    }
  } catch (err) {
    errs.push(err);
  }

  if (errs.length) {
    return errs.join('\n');
  }

  return result;
};

// set default format for date
dateFilter.setDefaultFormat = (format) => {
  dateFilterDefaultFormat = format;
};

// install the filter to nunjucks environment
dateFilter.install = (env, customName) => {
  (env || nunjucks.configure()).addFilter(customName ?? 'date', dateFilter);
};

export default dateFilter;
