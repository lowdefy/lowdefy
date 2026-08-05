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

import type from './type.js';
import extractErrorProps from './extractErrorProps.js';
import serializer from './serializer.js';
import splitPath from './splitPath.js';
import { isReserved, ReservedKeyError } from './ReservedKeyError.js';

// "May I step into this value to reach a child?" Plain objects, arrays and errors are traversable;
// functions, Date, URL, Map, Set, RegExp, Promise, Buffer and typed arrays are not, because
// serializing their internals is information disclosure. Class instances are NOT excluded:
// type.isObject cannot distinguish them from plain objects, since kindOf maps every
// `[object Object]` tag to 'object', so an instance's own properties are reachable. Narrowing the
// predicate is a cross-cutting decision - mergeObjects sits on the same type.isObject boundary -
// and is tracked separately. Note the predicate cannot close the disclosure case anyway: when the
// live object is the endpoint of the path it is returned (and under copy, serialized) without
// isTraversable ever being consulted. Error is handled by forLookup, which converts it to plain
// data before a lookup.
// Kept local rather than shared with set/unset - a module imported by all three trips a Jest ESM
// module-cache bug in operators-js' mocked re-imports.
function isTraversable(value) {
  return type.isObject(value) || Array.isArray(value) || value instanceof Error;
}

// A lookup on an Error reads the error's plain-data form, so `name` resolves (it is own on the
// extracted props, inherited on the instance) and an own key holding a class instance arrives as
// a marker rather than a live object. Applied only where a lookup happens, so an error that is
// the endpoint of the path is returned as an Error - `_actions: x.error` is unchanged.
function forLookup(value) {
  if (value instanceof Error) {
    return extractErrorProps(value);
  }
  return value;
}

function getter(target, path, options) {
  if (type.isNone(path) || !isTraversable(target)) {
    return options.default;
  }

  if (type.isNumber(path)) {
    path = String(path);
  }
  if (!type.isString(path)) {
    return options.default;
  }

  const segs = splitPath(path);

  // Scanned before the walk so a reserved key is rejected even when it is an own property - the
  // reserved rule is about illegal input, not about what the target holds. This also means a
  // literal dotted key whose segments include a reserved name, such as 'a.constructor', throws
  // rather than resolving; set and unset reject it identically. A rejoined candidate always
  // contains a dot, so it can never equal a reserved name; scanning the split segments stays
  // sufficient.
  const reservedSeg = segs.find(isReserved);
  if (!type.isNone(reservedSeg)) {
    throw new ReservedKeyError(reservedSeg);
  }

  let current = forLookup(target);

  const len = segs.length;
  let idx = 0;

  while (idx < len) {
    let candidate = segs[idx];
    let next = idx + 1;

    // The strict segment wins if present. On a miss, grow the candidate one segment at a time
    // looking for a literal dotted key - shortest-first, no backtracking, so segments are
    // consumed monotonically and the walk stays a single forward pass.
    while (!Object.hasOwn(current, candidate) && next < len) {
      candidate = `${candidate}.${segs[next]}`;
      next += 1;
    }
    if (!Object.hasOwn(current, candidate)) {
      return options.default;
    }

    current = current[candidate];
    idx = next;

    if (idx < len) {
      if (!isTraversable(current)) {
        return options.default;
      }
      current = forLookup(current);
    }
  }

  return current;
}

function get(target, path, options) {
  if (!type.isObject(options)) {
    options = { default: options };
  }

  if (options.copy) {
    return serializer.copy(getter(target, path, options));
  }
  return getter(target, path, options);
}

export default get;
