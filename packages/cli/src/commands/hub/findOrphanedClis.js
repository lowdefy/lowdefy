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

import readProcessTable from './readProcessTable.js';
import selectOrphanedClis from './selectOrphanedClis.js';

// Registered servers kept alive only by an orphaned CLI (see selectOrphanedClis).
// macOS and Linux only.
function findOrphanedClis({ records, hubPids, platform = process.platform }) {
  if (platform !== 'darwin' && platform !== 'linux') {
    return [];
  }
  return selectOrphanedClis({ processes: readProcessTable(), records, hubPids, platform });
}

export default findOrphanedClis;
