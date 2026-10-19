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
// https://github.com/jonschlinkert/unset-value/blob/master/index.js
// https://github.com/jonschlinkert/unset-value/issues/3
// The MIT License (MIT)
// Copyright (c) 2015, 2017, Jon Schlinkert

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
import splitPath from './splitPath.js';
import { isReserved, ReservedKeyError } from './ReservedKeyError.js';

// "May I step into this value to reach a child?" Kept local rather than shared with get/set -
// a module imported by all three trips a Jest ESM module-cache bug in operators-js' mocked
// re-imports.
function isTraversable(value) {
  return !type.isNone(value) && (typeof value === 'object' || typeof value === 'function');
}

const unset = (obj, prop) => {
  // supports array references in the form a.0 or a.0.b
  if (!type.isObject(obj)) {
    throw new TypeError('expected an object.');
  }
  if (!type.isString(prop)) {
    return true;
  }

  const segs = splitPath(prop);
  const reserved = segs.find(isReserved);
  if (!type.isNone(reserved)) {
    throw new ReservedKeyError(reserved);
  }

  const len = segs.length;
  let target = obj;
  let idx = 0;

  while (idx < len) {
    let seg = segs[idx];
    let next = idx + 1;

    // The strict segment wins if present. On a miss, grow the candidate one segment at a time
    // looking for a literal dotted key - shortest-first, no backtracking, matching get and set.
    if (!Object.hasOwn(target, seg)) {
      let candidate = seg;
      let n = next;
      while (n < len) {
        candidate = `${candidate}.${segs[n]}`;
        n += 1;
        if (Object.hasOwn(target, candidate)) {
          seg = candidate;
          next = n;
          break;
        }
      }
    }

    // Nothing matches at this level, so there is nothing to unset.
    if (!Object.hasOwn(target, seg)) {
      return true;
    }

    if (next === len) {
      return delete target[seg];
    }

    target = target[seg];
    // A missing or primitive intermediate means there is nothing to unset.
    if (!isTraversable(target)) {
      return true;
    }
    idx = next;
  }

  return true;
};

export default unset;
