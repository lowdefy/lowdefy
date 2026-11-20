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

// Removes every jitMaps file but those named in `keep`. A page build's
// temporary file (written whole, then renamed to .json) is left for that build
// to rename.
function pruneJitMaps({ buildDirectory, keep }) {
  const keptFiles = new Set(keep);
  const jitMapsDirectory = path.join(buildDirectory, 'jitMaps');
  if (!fs.existsSync(jitMapsDirectory)) {
    return;
  }
  for (const file of fs.readdirSync(jitMapsDirectory)) {
    if (file.endsWith('.json') && !keptFiles.has(file)) {
      fs.rmSync(path.join(jitMapsDirectory, file), { force: true });
    }
  }
}

export default pruneJitMaps;
