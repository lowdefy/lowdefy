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

import type from './type.js';

// Dot-path grammar: `.` separates segments, `\.` is a literal dot and `\\` a
// literal backslash. Any other backslash is an ordinary character, so keys such
// as 'a\b' keep working unescaped. joinPath is the inverse.
function splitPath(path) {
  if (!type.isString(path)) {
    throw new TypeError(`splitPath: path must be a string. Received ${JSON.stringify(path)}.`);
  }
  const segments = [];
  let segment = '';
  let i = 0;
  while (i < path.length) {
    const char = path[i];
    if (char === '\\') {
      const next = path[i + 1];
      if (next === '.' || next === '\\') {
        segment += next;
        i += 2;
        continue;
      }
      segment += char;
      i += 1;
      continue;
    }
    if (char === '.') {
      segments.push(segment);
      segment = '';
      i += 1;
      continue;
    }
    segment += char;
    i += 1;
  }
  segments.push(segment);
  return segments;
}

export default splitPath;
