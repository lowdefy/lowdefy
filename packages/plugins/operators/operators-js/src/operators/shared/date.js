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
  getDate: { singleArg: true, prep, validTypes: ['date', 'null'] },
  getDay: { singleArg: true, prep, validTypes: ['date', 'null'] },
  getFullYear: { singleArg: true, prep, validTypes: ['date', 'null'] },
  getHours: { singleArg: true, prep, validTypes: ['date', 'null'] },
  getMilliseconds: { singleArg: true, prep, validTypes: ['date', 'null'] },
  getMinutes: { singleArg: true, prep, validTypes: ['date', 'null'] },
  getMonth: { singleArg: true, prep, validTypes: ['date', 'null'] },
  getSeconds: { singleArg: true, prep, validTypes: ['date', 'null'] },
  getTime: { singleArg: true, prep, validTypes: ['date', 'null'] },
  getTimezoneOffset: { singleArg: true, prep, validTypes: ['date', 'null'] },
  getUTCDate: { singleArg: true, prep, validTypes: ['date', 'null'] },
  getUTCDay: { singleArg: true, prep, validTypes: ['date', 'null'] },
  getUTCFullYear: { singleArg: true, prep, validTypes: ['date', 'null'] },
  getUTCHours: { singleArg: true, prep, validTypes: ['date', 'null'] },
  getUTCMilliseconds: { singleArg: true, prep, validTypes: ['date', 'null'] },
  getUTCMinutes: { singleArg: true, prep, validTypes: ['date', 'null'] },
  getUTCMonth: { singleArg: true, prep, validTypes: ['date', 'null'] },
  getUTCSeconds: { singleArg: true, prep, validTypes: ['date', 'null'] },
  now: { noArgs: true },
  parse: { singleArg: true, prep, validTypes: ['string', 'null'] },
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
  toDateString: { singleArg: true, prep, validTypes: ['date', 'null'] },
  toISOString: { singleArg: true, prep, validTypes: ['date', 'null'] },
  toJSON: { singleArg: true, prep, validTypes: ['date', 'null'] },
  toString: { singleArg: true, prep, validTypes: ['date', 'null'] },
  toTimeString: { singleArg: true, prep, validTypes: ['date', 'null'] },
  toUTCString: { singleArg: true, prep, validTypes: ['date', 'null'] },
  UTC: {
    namedArgs: ['year', 'month', 'day', 'hours', 'minutes', 'seconds'],
    validTypes: ['array', 'object'],
  },
  valueOf: { singleArg: true, prep, validTypes: ['date', 'null'] },
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

export default _date;
