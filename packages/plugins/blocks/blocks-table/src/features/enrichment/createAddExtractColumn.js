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

import generateColumnKey from './generateColumnKey.js';
import humanizePath from './humanizePath.js';
import inferColumnType from './inferColumnType.js';

// Action `addExtractColumn({ source, path, value })`: "Add as column" on a node of a cell's raw
// result. Fires onColumnAdd with an extract column for that path (title from the path, type
// from the value), placed after its source column.
function createAddExtractColumn(api) {
  return function addExtractColumn({ source, path, value }) {
    const title = humanizePath(path);
    const column = {
      key: generateColumnKey({
        title: `${source} ${title}`,
        existingKeys: [...api.config.columnsByKey.keys()],
      }),
      title,
      type: inferColumnType(value),
      kind: 'extract',
      source,
      path,
      userDefined: true,
    };
    return api.actions.addColumn({ column, position: { after: source } });
  };
}

export default createAddExtractColumn;
