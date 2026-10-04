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

import fs from 'fs';
import path from 'path';

function isJourneyFile(fileName) {
  return fileName.endsWith('.yaml') || fileName.endsWith('.yml');
}

// Every journey file under `directory`, in sub-folders too, sorted by path.
// `skipUnderscored` leaves out each folder below `directory` whose name starts
// with "_" (tests/journeys/_candidates and the like): the full suite run never
// reads them, while a directory named on the command line is read whole.
function listJourneyFiles({ directory, skipUnderscored = false }) {
  return fs
    .readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        if (skipUnderscored && entry.name.startsWith('_')) {
          return [];
        }
        return listJourneyFiles({ directory: entryPath, skipUnderscored });
      }
      return isJourneyFile(entry.name) ? [entryPath] : [];
    })
    .sort((a, b) => a.localeCompare(b));
}

export { isJourneyFile };
export default listJourneyFiles;
