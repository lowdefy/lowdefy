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

function splitPath(path) {
  if (!type.isString(path)) {
    throw new TypeError(`splitPath: path must be a string. Received ${JSON.stringify(path)}.`);
  }
  const parts = path.split('.');
  const segments = [];
  let i = 0;
  while (i < parts.length) {
    let segment = parts[i];
    // A trailing backslash escapes the dot that follows, so the next part
    // continues the current segment instead of starting a new one.
    while (segment && segment.slice(-1) === '\\' && !type.isUndefined(parts[i + 1])) {
      i += 1;
      segment = `${segment.slice(0, -1)}.${parts[i]}`;
    }
    segments.push(segment);
    i += 1;
  }
  return segments;
}

export default splitPath;
