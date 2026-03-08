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
import { type } from '@lowdefy/helpers';
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

// Allowed dayjs instance methods for chaining mode.
const allowedChainMethods = new Set([
  'add',
  'subtract',
  'startOf',
  'endOf',
  'set',
  'utc',
  'local',
  'locale',
  // Query methods
  'isBefore',
  'isAfter',
  'isSame',
  // Display methods
  'format',
  'fromNow',
  'from',
  'toNow',
  'to',
  'diff',
  'valueOf',
  'unix',
  'toISOString',
  'toJSON',
  'toString',
  'daysInMonth',
  // Getter methods
  'year',
  'month',
  'date',
  'day',
  'hour',
  'minute',
  'second',
  'millisecond',
  'week',
]);

// Chain mode: _dayjs: ["now", {"subtract": [3, "days"]}, "fromNow"]
// First element is the input (or "now"), rest are chained method calls.
function runChain(params) {
  const [input, ...steps] = params;
  let instance = input === 'now' ? dayjs() : dayjs(input);

  for (const step of steps) {
    if (type.isString(step)) {
      if (!allowedChainMethods.has(step)) {
        throw new Error(
          `_dayjs chain method "${step}" is not supported. Allowed methods: ${[
            ...allowedChainMethods,
          ].join(', ')}.`
        );
      }
      const result = instance[step]();
      if (!dayjs.isDayjs(result)) return result;
      instance = result;
    } else if (type.isObject(step)) {
      const method = Object.keys(step)[0];
      if (!allowedChainMethods.has(method)) {
        throw new Error(
          `_dayjs chain method "${method}" is not supported. Allowed methods: ${[
            ...allowedChainMethods,
          ].join(', ')}.`
        );
      }
      const args = type.isArray(step[method]) ? step[method] : [step[method]];
      const result = instance[method](...args);
      if (!dayjs.isDayjs(result)) return result;
      instance = result;
    }
  }

  return instance.toISOString();
}

function _dayjs({ params, location, methodName }) {
  // Chain mode: when no methodName and params is an array starting with a string/date
  if (!methodName && type.isArray(params) && params.length >= 1) {
    return runChain(params);
  }
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
