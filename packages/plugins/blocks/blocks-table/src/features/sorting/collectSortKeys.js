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

import createSortKeyCollector from './createSortKeyCollector.js';

// Every row's sort key and the distinct keys, in one pass (see createSortKeyCollector).
function collectSortKeys({ rows, accessor, getSortKey }) {
  const collector = createSortKeyCollector({ count: rows.length, getSortKey });
  collector.collect({ rows, accessor, start: 0, end: rows.length });
  return collector.result();
}

export default collectSortKeys;
