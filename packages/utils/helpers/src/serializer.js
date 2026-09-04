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
  AuthenticationError,
  AuthorizationError,
  BlockError,
  BuildError,
  ConfigError,
  ConfigWarning,
  LowdefyInternalError,
  OperatorError,
  PluginError,
  RequestError,
  ServiceError,
  TwoFactorEnrolmentRequiredError,
  UserError,
} from '@lowdefy/errors';

import extractErrorProps from './extractErrorProps.js';
import type from './type.js';
import stableStringify from './stableStringify.js';

// The non-enumerable provenance markers the build stamps on config nodes:
// ~r (ref file), ~k (key), ~l (line), ~c (column) and ~x (the ${ … } source).
// They are carried across a copy so an error raised on a node that has been
// copied — a component body, an expanded ref — still resolves to source.
// cloneWithMarkers in @lowdefy/build carries the same set; keep them in step.
const MARKER_KEYS = ['~r', '~k', '~l', '~c', '~x'];

const lowdefyErrorTypes = {
  ActionError,
  AuthenticationError,
  AuthorizationError,
  BlockError,
  BuildError,
  ConfigError,
  ConfigWarning,
  LowdefyInternalError,
  OperatorError,
  PluginError,
  RequestError,
  ServiceError,
  TwoFactorEnrolmentRequiredError,
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

const makeReplacer =
  ({ replacer, isoStringDates, skipMarkers, omitErrorProps } = {}) =>
  (key, value) => {
    let dateReplacer = (date) => ({ '~d': date.valueOf() });
    if (isoStringDates) {
      dateReplacer = (date) => ({ '~d': date.toISOString() });
    }
    let newValue = value;
    if (replacer) {
      newValue = replacer(key, value);
    }
    if (type.isError(newValue)) {
      return { '~e': extractErrorProps(newValue, { omit: omitErrorProps }) };
    }
    if (type.isObject(newValue)) {
      // Capture the markers before any shallow copy: a spread drops non-enumerable
      // properties, and the Date replacement below spreads the object, so reading
      // the markers after it would lose the ~k of every object with a Date child.
      const markers = skipMarkers
        ? []
        : MARKER_KEYS.filter((marker) => newValue[marker] !== undefined).map((marker) => [
            marker,
            newValue[marker],
          ]);
      Object.keys(newValue).forEach((k) => {
        if (type.isDate(newValue[k])) {
          // shallow copy original value before reassigning a value in order not to mutate original value
          newValue = { ...newValue };
          newValue[k] = dateReplacer(newValue[k]);
        }
      });
      if (!skipMarkers) {
        if (markers.length > 0) {
          // Shallow copy to avoid mutating the original object's property descriptors
          if (newValue === value) {
            newValue = { ...newValue };
          }
          for (const [marker, markerValue] of markers) {
            Object.defineProperty(newValue, marker, {
              value: markerValue,
              enumerable: true,
              writable: true,
              configurable: true,
            });
          }
        }
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
      // Arrays cannot carry the markers through JSON, so wrap them
      const arrayMarkers = skipMarkers
        ? []
        : MARKER_KEYS.filter((marker) => newValue[marker] !== undefined);
      if (arrayMarkers.length > 0) {
        const wrapper = { '~arr': mappedArray };
        for (const marker of arrayMarkers) {
          wrapper[marker] = newValue[marker];
        }
        return wrapper;
      }
      return mappedArray;
    }
    return newValue;
  };

// The markers travel through JSON as ordinary keys; restore them as the
// non-enumerable properties the build reads.
function restoreMarkers(target, source) {
  for (const marker of MARKER_KEYS) {
    if (source[marker] !== undefined) {
      Object.defineProperty(target, marker, {
        value: source[marker],
        enumerable: false,
        writable: true,
        configurable: true,
      });
    }
  }
}

const makeReviver = (customReviver) => (key, value) => {
  let newValue = value;
  if (type.isObject(newValue)) {
    // Restore arrays that were wrapped with ~arr marker
    if (type.isArray(newValue['~arr'])) {
      const arr = newValue['~arr'];
      restoreMarkers(arr, newValue);
      newValue = arr;
    } else {
      restoreMarkers(newValue, newValue);
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
  // skipMarkers is deliberately not threaded here - serialize has never applied
  // it, and its callers depend on markers surviving.
  return JSON.parse(
    JSON.stringify(
      json,
      makeReplacer({
        replacer: options.replacer,
        isoStringDates: options.isoStringDates,
        omitErrorProps: options.omitErrorProps,
      })
    )
  );
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
      replacer: makeReplacer({
        replacer: options.replacer,
        skipMarkers: options.skipMarkers,
        omitErrorProps: options.omitErrorProps,
      }),
      space: options.space,
    });
  }
  return JSON.stringify(
    json,
    makeReplacer({
      replacer: options.replacer,
      isoStringDates: options.isoStringDates,
      skipMarkers: options.skipMarkers,
      omitErrorProps: options.omitErrorProps,
    }),
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
    JSON.stringify(
      json,
      makeReplacer({ replacer: options.replacer, omitErrorProps: options.omitErrorProps })
    ),
    makeReviver(options.reviver)
  );
};

const serializer = { copy, serialize, serializeToString, deserialize, deserializeFromString };
export default serializer;
