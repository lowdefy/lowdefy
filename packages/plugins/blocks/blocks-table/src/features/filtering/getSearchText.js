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

import getCellText from '@lowdefy/blocks-antd/table/getCellText.js';

import createAccessor from '../../core/createAccessor.js';

// Formatting a cell's display text (numbers, dates, option labels) is the expensive part of a
// search, and it only depends on the row and the searched columns. Each row's lowercased text is
// kept per searched-column set, weakly by row object, so typing more of a search word only runs
// `includes`, and unchanged rows keep their text across data updates. A set is identified by its
// column objects: new column config (new objects) starts a new index.
const indexes = new Map();

function sameColumns(a, b) {
  return a.length === b.length && a.every((column, i) => column === b[i]);
}

function getIndex(columns) {
  const signature = columns.map((column) => column.key).join('\u0000');
  let index = indexes.get(signature);
  if (!index || !sameColumns(index.columns, columns)) {
    index = {
      columns,
      accessors: columns.map((column) => createAccessor(column.field)),
      texts: new WeakMap(),
    };
    indexes.set(signature, index);
  }
  return index;
}

// The lowercased display text of `row` across `columns`, one cell per line.
function getSearchText({ columns, row }) {
  const index = getIndex(columns);
  let text = index.texts.get(row);
  if (text === undefined) {
    const parts = new Array(columns.length);
    for (let i = 0; i < columns.length; i++) {
      parts[i] = getCellText({ column: columns[i], value: index.accessors[i](row), row });
    }
    text = parts.join('\n').toLowerCase();
    index.texts.set(row, text);
  }
  return text;
}

export default getSearchText;
