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

const MAX_RESULTS = 16;

// Filter results prepared ahead of applying a filter or search (see prepareFilterResult): one
// flag per row, kept weakly per rows array, for one filter context (columns, user) and one
// searched-column set at a time.
const entries = new WeakMap();

function sameColumns(a, b) {
  return a.length === b.length && a.every((column, i) => column === b[i]);
}

function getFilterResults({ rows, context, searchColumns }) {
  let entry = entries.get(rows);
  if (!entry || entry.context !== context || !sameColumns(entry.searchColumns, searchColumns)) {
    entry = { context, searchColumns, results: new Map() };
    entries.set(rows, entry);
  }
  return {
    get: (key) => entry.results.get(key),
    set: (key, value) => {
      if (entry.results.size >= MAX_RESULTS) {
        entry.results.delete(entry.results.keys().next().value);
      }
      entry.results.set(key, value);
    },
    // The closest earlier result this one narrows: same filter, a search this one extends
    // (typing on). Rows it dropped cannot match.
    narrowest: ({ filterKey, searchKey }) => {
      let best = null;
      entry.results.forEach((value) => {
        if (value.filterKey !== filterKey || !searchKey.startsWith(value.searchKey)) return;
        if (best === null || value.searchKey.length > best.searchKey.length) best = value;
      });
      return best?.flags ?? null;
    },
  };
}

export default getFilterResults;
