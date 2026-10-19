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

import htmlToText from '@lowdefy/blocks-antd/table/htmlToText.js';

import generateColumnKey from './generateColumnKey.js';
import getRawColumn from './getRawColumn.js';

// Action `duplicateColumn({ key })`: a copy of a user-defined column, with a new key and
// "(copy)" in its title, added right after it (onColumnAdd `{ column, position: { after } }`).
function createDuplicateColumn(api) {
  return function duplicateColumn({ key }) {
    const column = api.config.columnsByKey.get(key);
    const title = `${htmlToText(column.title)} (copy)`;
    const copy = {
      ...getRawColumn({ api, key }),
      key: generateColumnKey({ title, existingKeys: [...api.config.columnsByKey.keys()] }),
      title,
      userDefined: true,
    };
    return api.actions.addColumn({ column: copy, position: { after: key } });
  };
}

export default createDuplicateColumn;
