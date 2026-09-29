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

import compileCondition from '@lowdefy/blocks-antd/table/compileCondition.js';

import createSearchMatcher from './createSearchMatcher.js';

// The filter and the search as one row test, or null when neither constrains anything.
function createRowTest({ condition, search, context, searchColumns }) {
  const matchesSearch = createSearchMatcher({ search, columns: searchColumns });
  const matchesFilter =
    condition === null
      ? null
      : compileCondition({ condition, columnsByKey: context.columnsByKey, user: context.user });
  if (matchesFilter === null) return matchesSearch;
  if (matchesSearch === null) return matchesFilter;
  return (row) => matchesFilter(row) && matchesSearch(row);
}

export default createRowTest;
