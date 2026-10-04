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

import asList from './asList.js';

// Only a run of the whole suite, once, records as the suite's journey run: a
// replay of one candidate, a filtered or a tagged run must never become what
// the suite is read to drive. `filter` is one string or a list.
function isFullSuiteRun({ paths, filter, tags, repetition }) {
  const noPaths = asList(paths).length === 0;
  const noFilter = asList(filter).every((value) => value === '');
  const noTags = asList(tags).length === 0;
  return noPaths && noFilter && noTags && repetition === 1;
}

export default isFullSuiteRun;
