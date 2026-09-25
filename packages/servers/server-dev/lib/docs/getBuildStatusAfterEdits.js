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

import buildEditedPages from './buildEditedPages.js';
import getBuildStatus from './getBuildStatus.js';
import waitForBuild from './waitForBuild.js';

// Build status for wait: true. Waits until the dev server has processed the
// latest edits, then builds the pages they touched, so the answer covers
// those pages whether or not anything has requested them since.
async function getBuildStatusAfterEdits() {
  const waited = await waitForBuild();
  if (!waited.settled) {
    return { ...waited, ...getBuildStatus() };
  }
  const checked = await buildEditedPages();
  return { ...waited, ...getBuildStatus({ checked }) };
}

export default getBuildStatusAfterEdits;
