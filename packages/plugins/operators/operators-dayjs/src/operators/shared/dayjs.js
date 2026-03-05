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
import duration from 'dayjs/plugin/duration.js';
import relativeTime from 'dayjs/plugin/relativeTime.js';
import advancedFormat from 'dayjs/plugin/advancedFormat.js';
import weekOfYear from 'dayjs/plugin/weekOfYear.js';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import { runClass } from '@lowdefy/operators';

import '../../locales.js';

dayjs.extend(utc);
dayjs.extend(duration);
dayjs.extend(relativeTime);
dayjs.extend(advancedFormat);
dayjs.extend(weekOfYear);
dayjs.extend(customParseFormat);

function format(on, locale = 'en', format) {
  return dayjs(on).locale(locale.toLowerCase()).format(format);
}

// thresholds param is accepted for API compatibility but ignored (dayjs doesn't support per-call thresholds)
function humanizeDuration(on, locale = 'en', withSuffix = false, _thresholds) {
  return dayjs.duration(on).locale(locale.toLowerCase()).humanize(withSuffix);
}

const meta = {
  format: { namedArgs: ['on', 'locale', 'format'], validTypes: ['array', 'object'], dynamic: true },
  humanizeDuration: {
    namedArgs: ['on', 'locale', 'withSuffix', 'thresholds'],
    validTypes: ['array', 'object'],
    dynamic: true,
  },
};

const functions = { format, humanizeDuration };

function _dayjs({ params, location, methodName }) {
  return runClass({
    functions,
    location,
    meta,
    methodName,
    operator: '_dayjs',
    params,
  });
}

_dayjs.dynamic = false;
_dayjs.meta = meta;

export default _dayjs;
