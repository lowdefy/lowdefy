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
import { runClass, runInstance } from '@lowdefy/operators';

function date(input) {
  const result = new Date(input);
  if (!type.isDate(result)) {
    throw new Error(`${input} could not resolve as a valid javascript date.`);
  }
  return result;
}

function now() {
  return new Date();
}

const functions = {
  __default: date,
  parse: Date.parse,
  now,
  UTC: Date.UTC,
};

// TODO: return null instead of current date when null is passed in, consider modifying run instance and run class
const prep = (args) => {
  if (type.isNone(args[0])) {
    args[0] = new Date();
  }
  return args;
};

const meta = {
  // Methods that use prep (default to current date when null) are marked dynamic
  // to prevent build-time evaluation freezing the date
  getDate: { singleArg: true, prep, validTypes: ['date', 'null'], dynamic: true },
  getDay: { singleArg: true, prep, validTypes: ['date', 'null'], dynamic: true },
  getFullYear: { singleArg: true, prep, validTypes: ['date', 'null'], dynamic: true },
  getHours: { singleArg: true, prep, validTypes: ['date', 'null'], dynamic: true },
  getMilliseconds: { singleArg: true, prep, validTypes: ['date', 'null'], dynamic: true },
  getMinutes: { singleArg: true, prep, validTypes: ['date', 'null'], dynamic: true },
  getMonth: { singleArg: true, prep, validTypes: ['date', 'null'], dynamic: true },
  getSeconds: { singleArg: true, prep, validTypes: ['date', 'null'], dynamic: true },
  getTime: { singleArg: true, prep, validTypes: ['date', 'null'], dynamic: true },
  getTimezoneOffset: { singleArg: true, prep, validTypes: ['date', 'null'], dynamic: true },
  getUTCDate: { singleArg: true, prep, validTypes: ['date', 'null'], dynamic: true },
  getUTCDay: { singleArg: true, prep, validTypes: ['date', 'null'], dynamic: true },
  getUTCFullYear: { singleArg: true, prep, validTypes: ['date', 'null'], dynamic: true },
  getUTCHours: { singleArg: true, prep, validTypes: ['date', 'null'], dynamic: true },
  getUTCMilliseconds: { singleArg: true, prep, validTypes: ['date', 'null'], dynamic: true },
  getUTCMinutes: { singleArg: true, prep, validTypes: ['date', 'null'], dynamic: true },
  getUTCMonth: { singleArg: true, prep, validTypes: ['date', 'null'], dynamic: true },
  getUTCSeconds: { singleArg: true, prep, validTypes: ['date', 'null'], dynamic: true },
  now: { noArgs: true, dynamic: true },
  parse: { singleArg: true, prep, validTypes: ['string', 'null'], dynamic: true },
  setDate: { namedArgs: ['on', 'dayOfMonth'], validTypes: ['array', 'object'] },
  setFullYear: { namedArgs: ['on', 'year'], validTypes: ['array', 'object'] },
  setHours: { namedArgs: ['on', 'hours'], validTypes: ['array', 'object'] },
  setMilliseconds: { namedArgs: ['on', 'milliseconds'], validTypes: ['array', 'object'] },
  setMinutes: { namedArgs: ['on', 'minutes'], validTypes: ['array', 'object'] },
  setMonth: { namedArgs: ['on', 'month'], validTypes: ['array', 'object'] },
  setSeconds: { namedArgs: ['on', 'seconds'], validTypes: ['array', 'object'] },
  setTime: { namedArgs: ['on', 'time'], validTypes: ['array', 'object'] },
  setUTCDate: { namedArgs: ['on', 'dayOfMonth'], validTypes: ['array', 'object'] },
  setUTCFullYear: { namedArgs: ['on', 'year'], validTypes: ['array', 'object'] },
  setUTCHours: { namedArgs: ['on', 'hours'], validTypes: ['array', 'object'] },
  setUTCMilliseconds: { namedArgs: ['on', 'milliseconds'], validTypes: ['array', 'object'] },
  setUTCMinutes: { namedArgs: ['on', 'minutes'], validTypes: ['array', 'object'] },
  setUTCMonth: { namedArgs: ['on', 'month'], validTypes: ['array', 'object'] },
  setUTCSeconds: { namedArgs: ['on', 'seconds'], validTypes: ['array', 'object'] },
  toDateString: { singleArg: true, prep, validTypes: ['date', 'null'], dynamic: true },
  toISOString: { singleArg: true, prep, validTypes: ['date', 'null'], dynamic: true },
  toJSON: { singleArg: true, prep, validTypes: ['date', 'null'], dynamic: true },
  toString: { singleArg: true, prep, validTypes: ['date', 'null'], dynamic: true },
  toTimeString: { singleArg: true, prep, validTypes: ['date', 'null'], dynamic: true },
  toUTCString: { singleArg: true, prep, validTypes: ['date', 'null'], dynamic: true },
  UTC: {
    namedArgs: ['year', 'month', 'day', 'hours', 'minutes', 'seconds'],
    validTypes: ['array', 'object'],
  },
  valueOf: { singleArg: true, prep, validTypes: ['date', 'null'], dynamic: true },
  __default: { singleArg: true, validTypes: ['number', 'string'] },
};

function _date({ params, location, methodName }) {
  if (['now', 'parse', 'UTC'].includes(methodName) || methodName === undefined) {
    return runClass({
      functions,
      location,
      meta,
      methodName,
      operator: '_date',
      params,
      defaultFunction: '__default',
    });
  }
  return runInstance({
    location,
    meta,
    methodName,
    operator: '_date',
    params,
    instanceType: 'date',
  });
}

_date.dynamic = false;
_date.meta = meta;

export default _date;
