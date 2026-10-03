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

// Only a run of the whole suite, once, records as the suite's journey run: a
// replay of one candidate or a filtered run must never become what the suite
// is read to drive.
function isFullSuiteRun({ paths, filter, repetition }) {
  const noPaths = type.isNone(paths) || paths.length === 0;
  const noFilter = type.isNone(filter) || filter === '';
  return noPaths && noFilter && repetition === 1;
}

export default isFullSuiteRun;
