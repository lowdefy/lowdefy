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
import { relativePosixPath } from '@lowdefy/node-utils';

// Writes .lowdefy/test/headless-run.json after a headless run: every journey it selected, keyed
// `<file>#<name>`, as { passed } or { browserOnly: { index, step, reason } }, so CI and agents
// read which journeys this run could not take as well as which passed. A headless run records no
// traces, so it leaves the browser run's run.json alone. `mode` is "build" or "dev", where it
// ran.
function writeHeadlessRun({ directories, results, browserOnly, mode }) {
  const journeys = {};
  results.forEach((result) => {
    const file = relativePosixPath({ from: directories.config, to: result.filePath });
    journeys[`${file}#${result.name}`] = { passed: result.passed };
  });
  browserOnly.forEach((result) => {
    const file = relativePosixPath({ from: directories.config, to: result.filePath });
    journeys[`${file}#${result.name}`] = { browserOnly: result.browserOnly };
  });
  fs.mkdirSync(directories.test, { recursive: true });
  fs.writeFileSync(
    path.join(directories.test, 'headless-run.json'),
    `${JSON.stringify({ version: 1, mode, journeys }, null, 2)}\n`
  );
}

export default writeHeadlessRun;
