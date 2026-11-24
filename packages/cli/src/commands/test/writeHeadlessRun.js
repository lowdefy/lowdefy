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
import { type } from '@lowdefy/helpers';
import { relativePosixPath } from '@lowdefy/node-utils';

import hashJourney from './hashJourney.js';
import readHeadlessRun from './readHeadlessRun.js';

// The record of one journey's headless run, with the hashes that say which journey and config it
// was taken on: `hash` (hashJourney; null for a file that did not parse) and `configHash`
// (hashBuild of the dev server's build as the run started; null on the production build, whose
// records a dev run never reads).
function describeJourney({ result, configHash }) {
  return {
    hash: type.isObject(result.journey) ? hashJourney(result.journey) : null,
    configHash: configHash ?? null,
  };
}

// Writes .lowdefy/test/headless-run.json after a headless run: every journey it ran headless,
// keyed `<file>#<name>`, as { passed } or { browserOnly: { index, step, reason } } ({ phase:
// 'open', reason } when opening the page needed a browser), each with its hashes
// (describeJourney), so CI and agents read which journeys this run could not take as well as
// which passed, and a later mixed run sends a journey found to need a browser straight to the
// browser (routeJourney). Records of journeys this run did not run headless are kept. A headless
// run records no traces, so it leaves the browser run's run.json alone. `mode` is "build" or
// "dev", where the newest run ran.
function writeHeadlessRun({ directories, results, browserOnly, mode, configHash }) {
  const journeys = readHeadlessRun({ directories });
  results.forEach((result) => {
    const file = relativePosixPath({ from: directories.config, to: result.filePath });
    journeys[`${file}#${result.name}`] = {
      passed: result.passed,
      ...describeJourney({ result, configHash }),
    };
  });
  browserOnly.forEach((result) => {
    const file = relativePosixPath({ from: directories.config, to: result.filePath });
    journeys[`${file}#${result.name}`] = {
      browserOnly: result.browserOnly,
      ...describeJourney({ result, configHash }),
    };
  });
  fs.mkdirSync(directories.test, { recursive: true });
  fs.writeFileSync(
    path.join(directories.test, 'headless-run.json'),
    `${JSON.stringify({ version: 1, mode, journeys }, null, 2)}\n`
  );
}

export default writeHeadlessRun;
