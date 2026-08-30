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

import { type } from '@lowdefy/helpers';

// Splits a dotted state path into segments, treating `[n]` and `.n` the same
// way: `a.b[0].c` and `a.b.0.c` both give ['a', 'b', '0', 'c']. A `$` segment
// is the engine's list-item placeholder and is kept as a segment so schema
// navigation can map it onto `items`.
function splitSchemaPath(path) {
  if (type.isArray(path)) {
    return path.map((segment) => String(segment));
  }
  if (!type.isString(path) || path === '') {
    return [];
  }
  return path
    .replace(/\[(\d+)\]/g, '.$1')
    .split('.')
    .filter((segment) => segment !== '');
}

export default splitSchemaPath;
