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

import configPathSegments from './configPathSegments.js';

// A config path without the index of every array item that carries an id, so
// inserting a block above a node leaves its path unchanged:
// `blocks[3:assign_submit:Button]` becomes `blocks[assign_submit:Button]`.
// Items with no id, and siblings that share one (sharedIds), keep their index.
function positionFreePath({ configPath, sharedIds = new Set() }) {
  let result = '';
  let cursor = 0;
  configPathSegments(configPath).forEach(({ start, end, prefix, label }) => {
    result += configPath.slice(cursor, start);
    if (label === '' || sharedIds.has(`${prefix}[${label}]`)) {
      result += configPath.slice(start, end);
    } else {
      result += `[${label}]`;
    }
    cursor = end;
  });
  return result + configPath.slice(cursor);
}

export default positionFreePath;
