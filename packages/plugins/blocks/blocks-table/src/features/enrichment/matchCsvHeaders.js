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

export const NEW_COLUMN = '__new';
export const SKIP_COLUMN = '__skip';

function normalize(text) {
  return String(text ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

// The import dialog's first guess at the mapping: each CSV header to the input column whose key
// or title matches it (ignoring case, spaces and punctuation), each column used once, and every
// header that matches none to a new text column. Returns one target per header: a column key,
// NEW_COLUMN or SKIP_COLUMN (empty headers).
function matchCsvHeaders({ headers, columns }) {
  const used = new Set();
  return headers.map((header) => {
    const wanted = normalize(header);
    if (wanted === '') return SKIP_COLUMN;
    const match = columns.find(
      (column) =>
        !used.has(column.key) &&
        (normalize(column.key) === wanted || normalize(htmlToText(column.title)) === wanted)
    );
    if (!match) return NEW_COLUMN;
    used.add(match.key);
    return match.key;
  });
}

export default matchCsvHeaders;
