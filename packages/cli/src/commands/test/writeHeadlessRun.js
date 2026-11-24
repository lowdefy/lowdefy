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

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { type } from '@lowdefy/helpers';
import { relativePosixPath } from '@lowdefy/node-utils';

import hashJourney from './hashJourney.js';
import readHeadlessRun from './readHeadlessRun.js';

// The hashes that say which journey and config a journey's headless run was taken on: `hash`
// (hashJourney; null for a file that did not parse) and `configHashes` (hashBuild of the dev
// server's build as the run started and as it ended, once the run's pages were built; [] on the
// production build, whose records a dev run never reads).
function describeJourney({ result, configHashes }) {
  return {
    hash: type.isObject(result.journey) ? hashJourney(result.journey) : null,
    configHashes: knownHashes(configHashes),
  };
}

function knownHashes(configHashes) {
  return [...new Set(configHashes.filter((configHash) => !type.isNone(configHash)))];
}

// Writes .lowdefy/test/headless-run.json after a headless run: every journey it ran headless,
// keyed `<file>#<name>`, as { passed } or { browserOnly: { index, step, reason } } ({ phase:
// 'open', reason } when opening the page needed a browser), each with its hashes
// (describeJourney), so CI and agents read which journeys this run could not take as well as
// which passed, and a later mixed run sends a journey found to need a browser straight to the
// browser (routeJourney). Records of journeys this run did not run headless are kept. A record
// that sent a journey of this run to the browser (`remembered`, the items) still holds, and takes
// this run's hashes, so a dev server kept running, whose build moves as pages are first opened,
// keeps reading it. A headless run records no traces, so it leaves the browser run's run.json
// alone. `mode` is "build" or "dev", where the newest run ran. The file is written to a temporary
// name and renamed over the old one, so a run reading it never reads it half written.
function writeHeadlessRun({
  directories,
  results,
  browserOnly,
  remembered = [],
  mode,
  configHashes = [],
}) {
  const journeys = readHeadlessRun({ directories });
  remembered.forEach((item) => {
    const file = relativePosixPath({ from: directories.config, to: item.filePath });
    const key = `${file}#${item.journey.name}`;
    journeys[key] = { ...journeys[key], configHashes: knownHashes(configHashes) };
  });
  results.forEach((result) => {
    const file = relativePosixPath({ from: directories.config, to: result.filePath });
    journeys[`${file}#${result.name}`] = {
      passed: result.passed,
      ...describeJourney({ result, configHashes }),
    };
  });
  browserOnly.forEach((result) => {
    const file = relativePosixPath({ from: directories.config, to: result.filePath });
    journeys[`${file}#${result.name}`] = {
      browserOnly: result.browserOnly,
      ...describeJourney({ result, configHashes }),
    };
  });
  fs.mkdirSync(directories.test, { recursive: true });
  const filePath = path.join(directories.test, 'headless-run.json');
  const temporary = `${filePath}.${crypto.randomBytes(6).toString('hex')}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify({ version: 1, mode, journeys }, null, 2)}\n`);
  fs.renameSync(temporary, filePath);
}

export default writeHeadlessRun;
