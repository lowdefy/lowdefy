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

// Writes report.json and findings.json into the run directory.
async function writeExploreReport({ runDirectory, report, findings }) {
  await fs.promises.mkdir(runDirectory, { recursive: true });
  await fs.promises.writeFile(
    path.join(runDirectory, 'report.json'),
    `${JSON.stringify(report, null, 2)}\n`
  );
  await fs.promises.writeFile(
    path.join(runDirectory, 'findings.json'),
    `${JSON.stringify(findings, null, 2)}\n`
  );
}

export default writeExploreReport;
