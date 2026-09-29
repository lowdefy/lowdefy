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

import { get, isReserved, splitPath } from '@lowdefy/helpers';

// A row field read compiled once. Conditions test every row, and `get` re-parses the path and
// re-checks it for reserved segments on every call (about 60 ms per 100k rows). This walks the
// segments directly and hands every case it cannot settle to `get`: a missing segment (it may be
// a literal dotted key), a function value (it may be inherited, which `get` does not read), an
// Error or primitive on the way, and reserved or non-string paths. For plain data rows the
// result is what `get` returns. `Object.hasOwn` on every segment would cost as much again as the
// rest of the test, so only function values are checked for ownership.
function createFieldAccessor(field) {
  if (typeof field !== 'string' || field === '') {
    return (row) => get(row, field);
  }
  const segments = splitPath(field);
  if (segments.some(isReserved)) {
    return (row) => get(row, field);
  }
  const last = segments.length - 1;
  return function readField(row) {
    let current = row;
    for (let i = 0; i <= last; i++) {
      // Plain checks, not the `type` helpers: this runs for every row and every segment.
      if (typeof current !== 'object' || current === null || current instanceof Error) {
        return get(row, field);
      }
      const segment = segments[i];
      const value = current[segment];
      if (value === undefined) {
        return last === 0 ? undefined : get(row, field);
      }
      if (typeof value === 'function' && !Object.hasOwn(current, segment)) {
        return get(row, field);
      }
      current = value;
    }
    return current;
  };
}

export default createFieldAccessor;
