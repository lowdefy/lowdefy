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

import CSV_HEADER_SYNONYMS from './csvHeaderSynonyms.js';
import getTextSimilarity from './getTextSimilarity.js';
import normalizeHeader from './normalizeHeader.js';

export const NEW_COLUMN = '__new';
export const SKIP_COLUMN = '__skip';

// How alike a header and a column must be to be suggested without a synonym.
const SIMILARITY_THRESHOLD = 0.8;

const CONCEPTS = new Map(
  CSV_HEADER_SYNONYMS.flatMap((group, index) => group.map((name) => [name, index]))
);

function compact(text) {
  return text.replace(/ /g, '');
}

// The best reason a header matches a column, with its score: the same name (key or title,
// ignoring case, spaces and punctuation), a synonym (csvHeaderSynonyms), or a similar spelling.
function scoreMatch({ header, names }) {
  if (names.some((name) => compact(name) === compact(header))) {
    return { reason: 'exact', score: 1 };
  }
  const concept = CONCEPTS.get(header);
  if (concept !== undefined && names.some((name) => CONCEPTS.get(name) === concept)) {
    return { reason: 'synonym', score: 0.9 };
  }
  const similarity = Math.max(...names.map((name) => getTextSimilarity(header, name)));
  if (similarity >= SIMILARITY_THRESHOLD) return { reason: 'similar', score: similarity * 0.85 };
  return null;
}

// The import dialog's first guess at the mapping, one `{ target, reason }` per header: `target`
// is a column key, NEW_COLUMN (no column matches: a new text column) or SKIP_COLUMN (an empty
// header); `reason` says why a column was suggested: `exact` (its key or title), `synonym`
// ("Website" for "Company domain") or `similar` (a close spelling, "Emial"), else null. Every
// header and column pair is scored and the best pairs are taken first, each header and column
// once, so a weaker match never takes a column a better one needs.
function matchCsvHeaders({ headers, columns }) {
  const normalizedHeaders = headers.map(normalizeHeader);
  const candidates = [];
  columns.forEach((column, columnIndex) => {
    const names = [normalizeHeader(column.key), normalizeHeader(htmlToText(column.title))].filter(
      (name) => name !== ''
    );
    normalizedHeaders.forEach((header, headerIndex) => {
      if (header === '') return;
      const match = scoreMatch({ header, names });
      if (match !== null) candidates.push({ ...match, headerIndex, columnIndex, key: column.key });
    });
  });
  candidates.sort(
    (a, b) => b.score - a.score || a.headerIndex - b.headerIndex || a.columnIndex - b.columnIndex
  );
  const result = normalizedHeaders.map((header) => ({
    target: header === '' ? SKIP_COLUMN : NEW_COLUMN,
    reason: null,
  }));
  const usedColumns = new Set();
  candidates.forEach((candidate) => {
    if (result[candidate.headerIndex].reason !== null || usedColumns.has(candidate.key)) return;
    usedColumns.add(candidate.key);
    result[candidate.headerIndex] = { target: candidate.key, reason: candidate.reason };
  });
  return result;
}

export default matchCsvHeaders;
