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
  getDate: { singleArg: true, prep, validTypes: ['date', 'null'], dynamic: false },
  getDay: { singleArg: true, prep, validTypes: ['date', 'null'], dynamic: false },
  getFullYear: { singleArg: true, prep, validTypes: ['date', 'null'], dynamic: false },
  getHours: { singleArg: true, prep, validTypes: ['date', 'null'], dynamic: false },
  getMilliseconds: { singleArg: true, prep, validTypes: ['date', 'null'], dynamic: false },
  getMinutes: { singleArg: true, prep, validTypes: ['date', 'null'], dynamic: false },
  getMonth: { singleArg: true, prep, validTypes: ['date', 'null'], dynamic: false },
  getSeconds: { singleArg: true, prep, validTypes: ['date', 'null'], dynamic: false },
  getTime: { singleArg: true, prep, validTypes: ['date', 'null'], dynamic: false },
  getTimezoneOffset: { singleArg: true, prep, validTypes: ['date', 'null'], dynamic: false },
  getUTCDate: { singleArg: true, prep, validTypes: ['date', 'null'], dynamic: false },
  getUTCDay: { singleArg: true, prep, validTypes: ['date', 'null'], dynamic: false },
  getUTCFullYear: { singleArg: true, prep, validTypes: ['date', 'null'], dynamic: false },
  getUTCHours: { singleArg: true, prep, validTypes: ['date', 'null'], dynamic: false },
  getUTCMilliseconds: { singleArg: true, prep, validTypes: ['date', 'null'], dynamic: false },
  getUTCMinutes: { singleArg: true, prep, validTypes: ['date', 'null'], dynamic: false },
  getUTCMonth: { singleArg: true, prep, validTypes: ['date', 'null'], dynamic: false },
  getUTCSeconds: { singleArg: true, prep, validTypes: ['date', 'null'], dynamic: false },
  now: { noArgs: true, dynamic: true },
  parse: { singleArg: true, prep, validTypes: ['string', 'null'], dynamic: false },
  setDate: { namedArgs: ['on', 'dayOfMonth'], validTypes: ['array', 'object'], dynamic: false },
  setFullYear: { namedArgs: ['on', 'year'], validTypes: ['array', 'object'], dynamic: false },
  setHours: { namedArgs: ['on', 'hours'], validTypes: ['array', 'object'], dynamic: false },
  setMilliseconds: { namedArgs: ['on', 'milliseconds'], validTypes: ['array', 'object'], dynamic: false },
  setMinutes: { namedArgs: ['on', 'minutes'], validTypes: ['array', 'object'], dynamic: false },
  setMonth: { namedArgs: ['on', 'month'], validTypes: ['array', 'object'], dynamic: false },
  setSeconds: { namedArgs: ['on', 'seconds'], validTypes: ['array', 'object'], dynamic: false },
  setTime: { namedArgs: ['on', 'time'], validTypes: ['array', 'object'], dynamic: false },
  setUTCDate: { namedArgs: ['on', 'dayOfMonth'], validTypes: ['array', 'object'], dynamic: false },
  setUTCFullYear: { namedArgs: ['on', 'year'], validTypes: ['array', 'object'], dynamic: false },
  setUTCHours: { namedArgs: ['on', 'hours'], validTypes: ['array', 'object'], dynamic: false },
  setUTCMilliseconds: { namedArgs: ['on', 'milliseconds'], validTypes: ['array', 'object'], dynamic: false },
  setUTCMinutes: { namedArgs: ['on', 'minutes'], validTypes: ['array', 'object'], dynamic: false },
  setUTCMonth: { namedArgs: ['on', 'month'], validTypes: ['array', 'object'], dynamic: false },
  setUTCSeconds: { namedArgs: ['on', 'seconds'], validTypes: ['array', 'object'], dynamic: false },
  toDateString: { singleArg: true, prep, validTypes: ['date', 'null'], dynamic: false },
  toISOString: { singleArg: true, prep, validTypes: ['date', 'null'], dynamic: false },
  toJSON: { singleArg: true, prep, validTypes: ['date', 'null'], dynamic: false },
  toString: { singleArg: true, prep, validTypes: ['date', 'null'], dynamic: false },
  toTimeString: { singleArg: true, prep, validTypes: ['date', 'null'], dynamic: false },
  toUTCString: { singleArg: true, prep, validTypes: ['date', 'null'], dynamic: false },
  UTC: {
    namedArgs: ['year', 'month', 'day', 'hours', 'minutes', 'seconds'],
    validTypes: ['array', 'object'],
    dynamic: false,
  },
  valueOf: { singleArg: true, prep, validTypes: ['date', 'null'], dynamic: false },
  __default: { singleArg: true, validTypes: ['number', 'string'], dynamic: false },
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

export default _date;
