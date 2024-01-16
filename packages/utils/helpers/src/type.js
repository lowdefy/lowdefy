/* eslint-disable indent */
/* eslint-disable default-case */

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

// Derived from source:
// because both js typeof and instance of sucks! use this.
// https://ultimatecourses.com/blog/understanding-javascript-types-and-reliable-type-checking

const { toString } = Object.prototype;

function ctorName(val) {
  return val.constructor ? val.constructor.name : null;
}

function isArray(val) {
  if (Array.isArray) return Array.isArray(val);
  return val instanceof Array;
}

function isError(val) {
  return (
    !!val &&
    (val instanceof Error ||
      (typeof val.message === 'string' &&
        val.constructor &&
        typeof val.constructor.stackTraceLimit === 'number'))
  );
}

function isDate(val) {
  if (val instanceof Date && !Number.isNaN(val.getTime())) return true;
  return (
    val &&
    typeof val.toDateString === 'function' &&
    typeof val.getDate === 'function' &&
    typeof val.setDate === 'function' &&
    !Number.isNaN(val.getTime())
  );
}

function isRegexp(val) {
  if (val instanceof RegExp) return true;
  return (
    typeof val.flags === 'string' &&
    typeof val.ignoreCase === 'boolean' &&
    typeof val.multiline === 'boolean' &&
    typeof val.global === 'boolean'
  );
}

function isGeneratorFn(name) {
  return ctorName(name) === 'GeneratorFunction';
}

function isGeneratorObj(val) {
  return (
    typeof val.throw === 'function' &&
    typeof val.return === 'function' &&
    typeof val.next === 'function'
  );
}

function isArguments(val) {
  try {
    if (typeof val.length === 'number' && typeof val.callee === 'function') {
      return true;
    }
  } catch (err) {
    if (err.message.indexOf('callee') !== -1) {
      return true;
    }
  }
  return false;
}

/**
 * If you need to support Safari 5-7 (8-10 yr-old browser),
 * take a look at https://github.com/feross/is-buffer
 */

function isBuffer(val) {
  if (val.constructor && typeof val.constructor.isBuffer === 'function') {
    return val.constructor.isBuffer(val);
  }
  return false;
}

function kindOf(val) {
  // eslint-disable-next-line no-void
  if (val === void 0) return 'undefined';
  if (val === null) return 'null';

  let type = typeof val;
  if (type === 'boolean') return 'boolean';
  if (type === 'string') return 'string';
  if (type === 'number') return 'number';
  if (type === 'symbol') return 'symbol';
  if (type === 'function') {
    return isGeneratorFn(val) ? 'generatorfunction' : 'function';
  }

  if (isArray(val)) return 'array';
  if (isDate(val)) return 'date';
  if (isError(val)) return 'error';
  if (isRegexp(val)) return 'regexp';
  if (isArguments(val)) return 'arguments';
  if (isBuffer(val)) return 'buffer';

  switch (ctorName(val)) {
    case 'Symbol':
      return 'symbol';
    case 'Promise':
      return 'promise';

    // Set, Map, WeakSet, WeakMap
    case 'WeakMap':
      return 'weakmap';
    case 'WeakSet':
      return 'weakset';
    case 'Map':
      return 'map';
    case 'Set':
      return 'set';

    // 8-bit typed arrays
    case 'Int8Array':
      return 'int8array';
    case 'Uint8Array':
      return 'uint8array';
    case 'Uint8ClampedArray':
      return 'uint8clampedarray';

    // 16-bit typed arrays
    case 'Int16Array':
      return 'int16array';
    case 'Uint16Array':
      return 'uint16array';

    // 32-bit typed arrays
    case 'Int32Array':
      return 'int32array';
    case 'Uint32Array':
      return 'uint32array';
    case 'Float32Array':
      return 'float32array';
    case 'Float64Array':
      return 'float64array';
  }

  if (isGeneratorObj(val)) {
    return 'generator';
  }

  // Non-plain objects
  type = toString.call(val);
  switch (type) {
    case '[object Object]':
      return 'object';
    // iterators
    case '[object Map Iterator]':
      return 'mapiterator';
    case '[object Set Iterator]':
      return 'setiterator';
    case '[object String Iterator]':
      return 'stringiterator';
    case '[object Array Iterator]':
      return 'arrayiterator';
  }

  // other
  return type.slice(8, -1).toLowerCase().replace(/\s/g, '');
}

const reISO = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*))(?:Z|(\+|-)([\d|:]*))?$/;
function isDateString(val) {
  return reISO.test(val);
}

const type = {};
type.typeOf = kindOf;
type.isArray = isArray;
type.isDate = isDate;
type.isError = isError;
type.isDateString = isDateString;
type.isObject = (value) => kindOf(value) === 'object';
type.isString = (value) => typeof value === 'string';
type.isRegExp = (value) => kindOf(value) === 'regexp';
type.isFunction = (value) => kindOf(value) === 'function';
type.isBoolean = (value) => typeof value === 'boolean';
type.isNumber = (value) => typeof value === 'number' && Number.isFinite(value);
type.isNumeric = (value) => !Number.isNaN(Number(value));
type.isInt = (value) => Number.isInteger(value) === true;
type.isSet = (value) => kindOf(value) === 'set';
type.isNull = (value) => kindOf(value) === 'null';
type.isUndefined = (value) => kindOf(value) === 'undefined';
type.isNone = (value) => kindOf(value) === 'undefined' || kindOf(value) === 'null';
type.isPrimitive = (value) =>
  kindOf(value) === 'undefined' || // are we making undefined a primative ?
  kindOf(value) === 'null' ||
  kindOf(value) === 'string' ||
  kindOf(value) === 'number' ||
  kindOf(value) === 'boolean' ||
  kindOf(value) === 'date';
type.isEmptyObject = (value) => kindOf(value) === 'object' && Object.keys(value).length === 0;

// Lowdefy operator types
function isName(value) {
  if (!type.isString(value)) return false;
  const noLeadingNumeric = value
    .split('.')
    .reduce((acc, val) => acc && !type.isNumeric(val.charAt(0)), true);
  const noLeadTrailStop = value.charAt(0) !== '.' && value.charAt(value.length - 1) !== '.';
  const noLowdefy = !value.toLowerCase().startsWith('lowdefy');
  return /^[a-zA-Z0-9_.]+$/g.test(value) && noLeadTrailStop && noLeadingNumeric && noLowdefy;
}

function isOpRequest(val) {
  return kindOf(val) === 'object' && '_request' in val && isName(val._request);
}

// Lowdefy
type.isOpRequest = isOpRequest;
type.isName = isName;

function enforceType(typeName, value) {
  switch (typeName) {
    case 'string':
      return type.isString(value) && value !== '' ? value : null;
    case 'number':
      return type.isNumber(value) ? value : null;
    case 'boolean':
      return type.isBoolean(value) ? value : false;
    case 'date':
      return type.isDate(value) ? value : null;
    case 'array':
      return type.isArray(value) ? value : [];
    case 'primitive':
      return (type.isString(value) && value !== '') ||
        type.isNumber(value) ||
        type.isDate(value) ||
        type.isBoolean(value)
        ? value
        : null;
    case 'object':
      return type.isObject(value) ? value : null;
    case 'any':
      return !type.isUndefined(value) ? value : null;
    default:
      return null;
  }
}

type.enforceType = enforceType;

export default type;
