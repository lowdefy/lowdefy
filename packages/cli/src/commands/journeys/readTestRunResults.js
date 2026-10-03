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

// Whether each journey passed in the recorded test run `run`, from the
// .lowdefy/test/run.json the test runner writes, keyed by `run.journey`
// (`<file relative to config>#<name>`). Null when the file is missing or
// belongs to another run, so a pass is never read off a different run.
function readTestRunResults({ directories, run }) {
  const filePath = path.join(directories.test, 'run.json');
  if (!fs.existsSync(filePath)) {
    return null;
  }
  const report = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  if (report.run !== run) {
    return null;
  }
  return report.journeys;
}

export default readTestRunResults;
