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

import { type } from '@lowdefy/helpers';

import getSearchText from './getSearchText.js';

// `view.search` as a row test: case-insensitive, every word must appear in the display text of
// one of the searched columns (the same rule MongoDBTableQuery applies in server mode). Null when
// there is nothing to search for.
function createSearchMatcher({ search, columns }) {
  if (!type.isString(search) || columns.length === 0) return null;
  const words = search.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return null;
  return function matchesSearch(row) {
    const text = getSearchText({ columns, row });
    for (let i = 0; i < words.length; i++) {
      if (!text.includes(words[i])) return false;
    }
    return true;
  };
}

export default createSearchMatcher;
