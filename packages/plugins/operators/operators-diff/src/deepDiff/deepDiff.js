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

// Derived from deep-diff 1.0.2 (index.js), https://github.com/flitbit/diff
// Copied so _diff.deep keeps returning exactly the records it always has after
// the deprecated package was removed. Only the code that diff(lhs, rhs) runs is
// kept; the logic is otherwise unchanged.

// deep-diff is released under the MIT license:

// Copyright (c) 2011-2018 Phillip Clark

// Permission is hereby granted, free of charge, to any person obtaining a copy of
// this software and associated documentation files (the "Software"), to deal in
// the Software without restriction, including without limitation the rights to
// use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
// the Software, and to permit persons to whom the Software is furnished to do so,
// subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
// FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
// COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
// IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
// CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

import { DiffArray, DiffDeleted, DiffEdit, DiffNew } from './diffRecords.js';
import realTypeOf from './realTypeOf.js';

// Upstream's deepDiff also takes a prefilter and an orderIndependent flag.
// diff(lhs, rhs) passes neither, so those parameters and their branches are left
// out. Positional arguments and the loop structure are kept as upstream wrote
// them so this can be compared line by line with deep-diff 1.0.2.
function deepDiff(lhs, rhs, changes, path, key, stack) {
  changes = changes || [];
  path = path || [];
  stack = stack || [];
  const currentPath = path.slice(0);
  if (typeof key !== 'undefined' && key !== null) {
    currentPath.push(key);
  }

  // Use string comparison for regexes
  if (realTypeOf(lhs) === 'regexp' && realTypeOf(rhs) === 'regexp') {
    lhs = lhs.toString();
    rhs = rhs.toString();
  }

  const ltype = typeof lhs;
  const rtype = typeof rhs;
  let i, j, k, other;

  // A key that exists with the value undefined counts as defined.
  const ldefined =
    ltype !== 'undefined' ||
    (stack &&
      stack.length > 0 &&
      stack[stack.length - 1].lhs &&
      Object.getOwnPropertyDescriptor(stack[stack.length - 1].lhs, key));
  const rdefined =
    rtype !== 'undefined' ||
    (stack &&
      stack.length > 0 &&
      stack[stack.length - 1].rhs &&
      Object.getOwnPropertyDescriptor(stack[stack.length - 1].rhs, key));

  if (!ldefined && rdefined) {
    changes.push(new DiffNew(currentPath, rhs));
  } else if (!rdefined && ldefined) {
    changes.push(new DiffDeleted(currentPath, lhs));
  } else if (realTypeOf(lhs) !== realTypeOf(rhs)) {
    changes.push(new DiffEdit(currentPath, lhs, rhs));
  } else if (realTypeOf(lhs) === 'date' && lhs - rhs !== 0) {
    changes.push(new DiffEdit(currentPath, lhs, rhs));
  } else if (ltype === 'object' && lhs !== null && rhs !== null) {
    for (i = stack.length - 1; i > -1; --i) {
      if (stack[i].lhs === lhs) {
        other = true;
        break;
      }
    }
    if (!other) {
      stack.push({ lhs: lhs, rhs: rhs });
      if (Array.isArray(lhs)) {
        i = rhs.length - 1;
        j = lhs.length - 1;
        while (i > j) {
          changes.push(new DiffArray(currentPath, i, new DiffNew(undefined, rhs[i--])));
        }
        while (j > i) {
          changes.push(new DiffArray(currentPath, j, new DiffDeleted(undefined, lhs[j--])));
        }
        for (; i >= 0; --i) {
          deepDiff(lhs[i], rhs[i], changes, currentPath, i, stack);
        }
      } else {
        const akeys = Object.keys(lhs);
        const pkeys = Object.keys(rhs);
        for (i = 0; i < akeys.length; ++i) {
          k = akeys[i];
          other = pkeys.indexOf(k);
          if (other >= 0) {
            deepDiff(lhs[k], rhs[k], changes, currentPath, k, stack);
            pkeys[other] = null;
          } else {
            deepDiff(lhs[k], undefined, changes, currentPath, k, stack);
          }
        }
        for (i = 0; i < pkeys.length; ++i) {
          k = pkeys[i];
          if (k) {
            deepDiff(undefined, rhs[k], changes, currentPath, k, stack);
          }
        }
      }
      stack.length = stack.length - 1;
    } else if (lhs !== rhs) {
      // lhs contains a cycle at this element and it differs from rhs
      changes.push(new DiffEdit(currentPath, lhs, rhs));
    }
  } else if (lhs !== rhs) {
    if (!(ltype === 'number' && isNaN(lhs) && isNaN(rhs))) {
      changes.push(new DiffEdit(currentPath, lhs, rhs));
    }
  }
}

export default deepDiff;
