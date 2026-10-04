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

// Every explorer run with a report: { run, pr, base, head, finishedAt }, oldest
// first. Journey evidence maps explorer records' run id to a pull request
// through it.
function readExploreRuns({ configDirectory }) {
  const exploreDirectory = path.join(configDirectory, '.lowdefy', 'explore');
  if (!fs.existsSync(exploreDirectory)) return [];
  return fs
    .readdirSync(exploreDirectory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(exploreDirectory, entry.name, 'report.json'))
    .filter((reportPath) => fs.existsSync(reportPath))
    .map((reportPath) => {
      const { run, pr, base, head, finishedAt } = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
      return { run, pr, base, head, finishedAt };
    })
    .sort((a, b) => a.run.localeCompare(b.run));
}

export default readExploreRuns;
