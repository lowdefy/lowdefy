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

// Derived from source:
// https://github.com/jonschlinkert/get-value/blob/master/index.js
// https://www.npmjs.com/package/get-value

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

import typeTest from './type.js';
import serializer from './serializer.js';
import splitPath from './splitPath.js';
import { isReserved, ReservedKeyError } from './ReservedKeyError.js';

// "May I step into this value to reach a child?" Deliberately looser than type.isObject, which
// is plain-object-only: the walk must step into arrays, errors, class instances, Date and URL,
// otherwise a nested path like `x.error.cause.code` resolves to nothing even though the value
// is there. Kept local rather than shared with set/unset - a module imported by all three trips
// a Jest ESM module-cache bug in operators-js' mocked re-imports.
function isTraversable(value) {
  return !typeTest.isNone(value) && (typeof value === 'object' || typeof value === 'function');
}

function getter(target, path, options) {
  if (typeTest.isNone(path) || !isTraversable(target)) {
    return options.default;
  }

  if (typeTest.isNumber(path)) {
    path = String(path);
  }
  if (!typeTest.isString(path)) {
    return options.default;
  }

  const segs = splitPath(path);

  // Scanned before the fast path so a reserved key is rejected even when it is an own
  // property — the reserved rule is about illegal input, not about what the target holds.
  const reservedSeg = segs.find(isReserved);
  if (!typeTest.isNone(reservedSeg)) {
    throw new ReservedKeyError(reservedSeg);
  }

  // Own-property fast path: skip the walk when the whole path is a single own key. `hasOwn`
  // rather than `in` because this shortcut must only fire on a key the target really holds -
  // it also lets keys containing literal dots resolve before splitPath breaks them up. It is
  // not an inherited-property guard: when it misses, the walk below uses `prop in target`, so
  // inherited members like `error.message` still resolve by design.
  if (Object.prototype.hasOwnProperty.call(target, path)) {
    return target[path];
  }

  const len = segs.length;
  let idx = 0;

  do {
    const prop = segs[idx];

    if (!(prop in target)) {
      return options.default;
    }
    target = target[prop];
    idx += 1;
  } while (idx < len && isTraversable(target));

  if (idx === len) {
    return target;
  }

  return options.default;
}

function get(target, path, options) {
  if (!typeTest.isObject(options)) {
    options = { default: options };
  }

  if (options.copy) {
    return serializer.copy(getter(target, path, options));
  }
  return getter(target, path, options);
}

export default get;
