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

// .lowdefy/test/coverage.json, which `lowdefy journeys coverage` writes from
// production use, or null when it has not been run here.
function readCoverage({ directories }) {
  const coveragePath = path.join(directories.test, 'coverage.json');
  if (!fs.existsSync(coveragePath)) return null;
  return JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
}

export default readCoverage;
