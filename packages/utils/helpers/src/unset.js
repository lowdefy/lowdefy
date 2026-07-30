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

  if (segs.length === 1) {
    if (Object.prototype.hasOwnProperty.call(obj, segs[0])) {
      delete obj[segs[0]];
    }
    return true;
  }

  const last = segs.pop();
  let target = obj;
  for (const seg of segs) {
    // A missing or primitive intermediate means there is nothing to unset.
    if (!isTraversable(target) || !Object.prototype.hasOwnProperty.call(target, seg)) {
      return true;
    }
    target = target[seg];
  }
  if (!isTraversable(target)) {
    return true;
  }
  return delete target[last];
};

export default unset;
