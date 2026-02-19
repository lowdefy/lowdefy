/* eslint-disable no-param-reassign */

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

import {
  ActionError,
  BlockError,
  ConfigError,
  LowdefyInternalError,
  OperatorError,
  PluginError,
  RequestError,
  ServiceError,
  UserError,
} from '@lowdefy/errors';

import extractErrorProps from './extractErrorProps.js';
import type from './type.js';
import stableStringify from './stableStringify.js';

const lowdefyErrorTypes = {
  ActionError,
  BlockError,
  ConfigError,
  LowdefyInternalError,
  OperatorError,
  PluginError,
  RequestError,
  ServiceError,
  UserError,
};

function propsToError(data) {
  const ErrorClass = lowdefyErrorTypes[data.name] || Error;
  const error = Object.create(ErrorClass.prototype);
  for (const [k, v] of Object.entries(data)) {
    if (k === 'cause' && v !== null && typeof v === 'object' && v.message !== undefined) {
      error[k] = propsToError(v);
    } else {
      error[k] = v;
    }
  }
  return error;
}

const makeReplacer = (customReplacer, isoStringDates) => (key, value) => {
  let dateReplacer = (date) => ({ '~d': date.valueOf() });
  if (isoStringDates) {
    dateReplacer = (date) => ({ '~d': date.toISOString() });
  }
  let newValue = value;
  if (customReplacer) {
    newValue = customReplacer(key, value);
  }
  if (type.isError(newValue)) {
    return { '~e': extractErrorProps(newValue) };
  }
  if (type.isObject(newValue)) {
    Object.keys(newValue).forEach((k) => {
      if (type.isDate(newValue[k])) {
        // shallow copy original value before reassigning a value in order not to mutate original value
        newValue = { ...newValue };
        newValue[k] = dateReplacer(newValue[k]);
      }
    });
    if (newValue['~r']) {
      Object.defineProperty(newValue, '~r', {
        value: newValue['~r'],
        enumerable: true,
        writable: true,
        configurable: true,
      });
    }
    if (newValue['~k']) {
      Object.defineProperty(newValue, '~k', {
        value: newValue['~k'],
        enumerable: true,
        writable: true,
        configurable: true,
      });
    }
    if (newValue['~l']) {
      Object.defineProperty(newValue, '~l', {
        value: newValue['~l'],
        enumerable: true,
        writable: true,
        configurable: true,
      });
    }
    return newValue;
  }
  if (type.isArray(newValue)) {
    const mappedArray = newValue.map((item) => {
      if (type.isDate(item)) {
        return dateReplacer(item);
      }
      return item;
    });
    // Preserve ~l, ~k, ~r on arrays by wrapping in a marker object
    if (
      newValue['~l'] !== undefined ||
      newValue['~k'] !== undefined ||
      newValue['~r'] !== undefined
    ) {
      const wrapper = { '~arr': mappedArray };
      if (newValue['~r'] !== undefined) wrapper['~r'] = newValue['~r'];
      if (newValue['~k'] !== undefined) wrapper['~k'] = newValue['~k'];
      if (newValue['~l'] !== undefined) wrapper['~l'] = newValue['~l'];
      return wrapper;
    }
    return mappedArray;
  }
  return newValue;
};

const makeReviver = (customReviver) => (key, value) => {
  let newValue = value;
  if (type.isObject(newValue)) {
    // Restore arrays that were wrapped with ~arr marker
    if (type.isArray(newValue['~arr'])) {
      const arr = newValue['~arr'];
      if (newValue['~r']) {
        Object.defineProperty(arr, '~r', {
          value: newValue['~r'],
          enumerable: false,
          writable: true,
          configurable: true,
        });
      }
      if (newValue['~k']) {
        Object.defineProperty(arr, '~k', {
          value: newValue['~k'],
          enumerable: false,
          writable: true,
          configurable: true,
        });
      }
      if (newValue['~l']) {
        Object.defineProperty(arr, '~l', {
          value: newValue['~l'],
          enumerable: false,
          writable: true,
          configurable: true,
        });
      }
      newValue = arr;
    } else {
      if (newValue['~r']) {
        Object.defineProperty(newValue, '~r', {
          value: newValue['~r'],
          enumerable: false,
          writable: true,
          configurable: true,
        });
      }
      if (newValue['~k']) {
        Object.defineProperty(newValue, '~k', {
          value: newValue['~k'],
          enumerable: false,
          writable: true,
          configurable: true,
        });
      }
      if (newValue['~l']) {
        Object.defineProperty(newValue, '~l', {
          value: newValue['~l'],
          enumerable: false,
          writable: true,
          configurable: true,
        });
      }
    }
  }
  if (customReviver) {
    newValue = customReviver(key, newValue);
  }
  if (type.isObject(newValue)) {
    if (!type.isUndefined(newValue['~e'])) {
      return propsToError(newValue['~e']);
    }
    if (!type.isUndefined(newValue['~d'])) {
      const result = new Date(newValue['~d']);
      if (!type.isDate(result)) {
        return newValue;
      }
      return result;
    }
  }
  return newValue;
};

const serialize = (json, options = {}) => {
  if (type.isUndefined(json)) return json;
  if (type.isDate(json)) {
    if (options.isoStringDates) {
      return { '~d': json.toISOString() };
    }
    return { '~d': json.valueOf() };
  }
  return JSON.parse(JSON.stringify(json, makeReplacer(options.replacer, options.isoStringDates)));
};

const serializeToString = (json, options = {}) => {
  if (type.isUndefined(json)) return json;

  if (type.isDate(json)) {
    if (options.isoStringDates) {
      return `{ "~d": "${json.toISOString()}" }`;
    }
    return `{ "~d": ${json.valueOf()} }`;
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
