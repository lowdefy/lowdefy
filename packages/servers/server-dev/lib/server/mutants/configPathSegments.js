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

// The array-item segments of a keyMap config path, such as
// `root.pages[0:tickets:PageHeaderMenu].blocks[3:assign_submit:Button]`: each
// with the path before it, its index and what follows the index (the item's
// id and type, empty for an item that has neither).
function configPathSegments(configPath) {
  const pattern = /\[(\d+)(?::([^\]]*))?\]/g;
  const segments = [];
  let match = pattern.exec(configPath);
  while (match !== null) {
    segments.push({
      start: match.index,
      end: match.index + match[0].length,
      prefix: configPath.slice(0, match.index),
      index: match[1],
      label: match[2] ?? '',
    });
    match = pattern.exec(configPath);
  }
  return segments;
}

export default configPathSegments;
