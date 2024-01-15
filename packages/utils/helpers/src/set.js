/* eslint-disable no-plusplus */
/* eslint-disable no-use-before-define */
/* eslint-disable no-param-reassign */

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
// https://github.com/jonschlinkert/set-value/blob/master/index.js
// https://www.npmjs.com/package/set-value

// The MIT License (MIT)

// Copyright (c) 2014-2018, Jon Schlinkert.

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

import type from './type.js';

function isValidKey(key) {
  return key !== '__proto__' && key !== 'constructor' && key !== 'prototype';
}

function isObjectOrFunction(val) {
  return val !== null && (typeof val === 'object' || typeof val === 'function');
}

function result(target, path, value, merge) {
  if (merge && isObjectOrFunction(target[path]) && isObjectOrFunction(value)) {
    target[path] = merge({}, target[path], value);
  } else {
    target[path] = value;
  }
}

// eslint-disable-next-line no-use-before-define
set.memo = {};

function set(target, path, value, options) {
  if (!type.isObject(target)) {
    return target;
  }

  const opts = options || {};
  if (!type.isArray(path) && !type.isString(path)) {
    return target;
  }

  let { merge } = opts;
  if (merge && typeof merge !== 'function') {
    merge = Object.assign;
  }

  const keys = (type.isArray(path) ? path : split(path, opts)).filter(isValidKey);
  const len = keys.length;
  const orig = target;

  if (!options && keys.length === 1) {
    result(target, keys[0], value, merge);
    return target;
  }

  for (let i = 0; i < len; i++) {
    const prop = keys[i];
    const propUp = keys[i + 1]; // changed to set an array value where the array was undefined be assigning value
    if (!isObjectOrFunction(target[prop]) && !type.isInt(parseInt(propUp, 10))) {
      // changed
      target[prop] = {};
    } else if (!isObjectOrFunction(target[prop]) && type.isInt(parseInt(propUp, 10))) {
      // added
      target[prop] = []; // added
    }

    if (i === len - 1) {
      result(target, prop, value, merge);
      break;
    }

    target = target[prop];
  }

  return orig;
}

function createKey(pattern, options) {
  let id = pattern;
  if (typeof options === 'undefined') {
    return `${id}`;
  }
  const keys = Object.keys(options);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    id += `;${key}=${String(options[key])}`;
  }
  return id;
}

export function split(path, options) {
  const id = createKey(path, options);
  if (set.memo[id]) return set.memo[id];

  const char = options && options.separator ? options.separator : '.';
  let keys = [];
  const res = [];

  if (options && typeof options.split === 'function') {
    keys = options.split(path);
  } else {
    keys = path.split(char);
  }

  for (let i = 0; i < keys.length; i++) {
    let prop = keys[i];
    while (prop && prop.slice(-1) === '\\' && keys[i + 1]) {
      prop = prop.slice(0, -1) + char + keys[++i];
    }
    res.push(prop);
  }
  set.memo[id] = res;
  return res;
}

export default set;
