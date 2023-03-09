/* eslint-disable no-param-reassign */

/*
  Copyright 2020-2023 Lowdefy, Inc

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

import type from './type.js';
import stableStringify from './stableStringify.js';

const makeReplacer = (customReplacer, isoStringDates) => (key, value) => {
  let dateReplacer = (date) => ({ _date: date.valueOf() });
  if (isoStringDates) {
    dateReplacer = (date) => ({ _date: date.toISOString() });
  }
  let newValue = value;
  if (customReplacer) {
    newValue = customReplacer(key, value);
  }
  if (type.isError(newValue)) {
    return {
      _error: {
        name: newValue.name,
        message: newValue.message,
        value: newValue.toString(),
      },
    };
  }
  if (type.isObject(newValue)) {
    Object.keys(newValue).forEach((k) => {
      if (type.isDate(newValue[k])) {
        // shallow copy original value before reassigning a value in order not to mutate original value
        newValue = { ...newValue };
        newValue[k] = dateReplacer(newValue[k]);
      }
    });
    if (newValue._r_) {
      Object.defineProperty(newValue, '_r_', {
        value: newValue._r_,
        enumerable: true,
        writable: true,
        configurable: true,
      });
    }
    if (newValue._k_) {
      Object.defineProperty(newValue, '_k_', {
        value: newValue._k_,
        enumerable: true,
        writable: true,
        configurable: true,
      });
    }
    return newValue;
  }
  if (type.isArray(newValue)) {
    return newValue.map((item) => {
      if (type.isDate(item)) {
        return dateReplacer(item);
      }
      return item;
    });
  }
  return newValue;
};

const makeReviver = (customReviver) => (key, value) => {
  let newValue = value;
  if (customReviver) {
    newValue = customReviver(key, value);
  }
  if (type.isObject(newValue)) {
    if (!type.isUndefined(newValue._error)) {
      const error = new Error(newValue._error.message);
      error.name = newValue._error.name;
      return error;
    }
    if (!type.isUndefined(newValue._date)) {
      if (type.isInt(newValue._date)) {
        return new Date(newValue._date);
      }
      if (newValue._date === 'now') {
        return newValue;
      }
      const result = new Date(newValue._date);
      if (!type.isDate(result)) {
        return newValue;
      }
      return result;
    }
    if (newValue._r_) {
      Object.defineProperty(newValue, '_r_', {
        value: newValue._r_,
        enumerable: false,
        writable: true,
        configurable: true,
      });
    }
    if (newValue._k_) {
      Object.defineProperty(newValue, '_k_', {
        value: newValue._k_,
        enumerable: false,
        writable: true,
        configurable: true,
      });
    }
  }
  return newValue;
};

const serialize = (json, options = {}) => {
  if (type.isUndefined(json)) return json;
  if (type.isDate(json)) {
    if (options.isoStringDates) {
      return { _date: json.toISOString() };
    }
    return { _date: json.valueOf() };
  }
  return JSON.parse(JSON.stringify(json, makeReplacer(options.replacer, options.isoStringDates)));
};

const serializeToString = (json, options = {}) => {
  if (type.isUndefined(json)) return json;

  if (type.isDate(json)) {
    if (options.isoStringDates) {
      return `{ "_date": "${json.toISOString()}" }`;
    }
    return `{ "_date": ${json.valueOf()} }`;
  }
  if (options.stable) {
    return stableStringify(json, {
      replacer: makeReplacer(options.replacer),
      space: options.space,
    });
  }
  return JSON.stringify(
    json,
    makeReplacer(options.replacer, options.isoStringDates),
    options.space
  );
};

const deserialize = (json, options = {}) => {
  if (type.isUndefined(json)) return json;
  return JSON.parse(JSON.stringify(json), makeReviver(options.reviver));
};

const deserializeFromString = (str, options = {}) => {
  if (type.isUndefined(str)) return str;
  return JSON.parse(str, makeReviver(options.reviver));
};

const copy = (json, options = {}) => {
  if (type.isUndefined(json)) return undefined;
  if (type.isDate(json)) return new Date(json.valueOf());

  return JSON.parse(
    JSON.stringify(json, makeReplacer(options.replacer)),
    makeReviver(options.reviver)
  );
};

const serializer = { copy, serialize, serializeToString, deserialize, deserializeFromString };
export default serializer;
