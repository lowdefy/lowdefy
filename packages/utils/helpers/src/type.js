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

// Includes `Buffer` so Node Buffers map to 'buffer'. Buffer extends Uint8Array but reports
// constructor.name 'Buffer', so matching the name here keeps the legacy kindOf return
// without a Node-only branch.
const TYPED_ARRAY_RE = /^(Int|Uint|Float)\d+(Clamped)?Array$|^Buffer$/;

function ctorName(val) {
  const ctor = val.constructor;
  return typeof ctor === 'function' ? ctor.name : null;
}

function isArray(val) {
  return Array.isArray(val);
}

function isError(val) {
  return val instanceof Error;
}

function isDate(val) {
  return val instanceof Date && !Number.isNaN(val.getTime());
}

function kindOf(val) {
  if (val === undefined) return 'undefined';
  if (val === null) return 'null';
  const t = typeof val;
  if (t !== 'object' && t !== 'function') return t;
  if (Array.isArray(val)) return 'array';
  if (val instanceof Date) return 'date';
  if (val instanceof Error) return 'error';
  if (val instanceof RegExp) return 'regexp';
  if (val instanceof Map) return 'map';
  if (val instanceof Set) return 'set';
  if (val instanceof WeakMap) return 'weakmap';
  if (val instanceof WeakSet) return 'weakset';
  if (val instanceof Promise) return 'promise';
  if (t === 'function') return 'function';
  const name = ctorName(val);
  if (name && TYPED_ARRAY_RE.test(name)) return name.toLowerCase();
  // Tail check: only plain objects map to 'object'. Non-plain web platform objects
  // (URL, Headers, URLSearchParams, etc.) and user classes with Symbol.toStringTag fall
  // through to the constructor-name branch so type.isObject preserves its
  // "plain object only" contract.
  if (Object.prototype.toString.call(val) === '[object Object]') return 'object';
  return name ? name.toLowerCase() : 'object';
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

// Lowdefy convention: `date` is treated as primitive. Used by the `_type: primitive`
// operator and `enforceType('primitive', ...)`. Do not "fix" this without coordinating
// with the operators-js, blocks-antd selector family, and nunjucks consumers.
type.isPrimitive = (value) =>
  kindOf(value) === 'undefined' ||
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
