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

import computeJourneyCoverage from './computeJourneyCoverage.js';
import formatJourneyCoverage from './formatJourneyCoverage.js';

const COVERAGE_ARTIFACT = 'journeyCoverage.json';
const JOURNEY_INDEX_PATH = path.join('.lowdefy', 'test', 'journeyIndex.json');

// The build writes journeyCoverage.json on every build, so a missing file means
// the run never got a server up - reporting a 0% share off an absent denominator
// would be a lie, so say nothing was measured.
function readCoverageArtifact({ context }) {
  const filePath = path.join(context.directories.build, COVERAGE_ARTIFACT);
  if (!fs.existsSync(filePath)) return undefined;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

// page -> the journeys that start on it. A later "run the touched pages'
// journeys" hook reads this to pick a subset from a changed config file.
function writeJourneyIndex({ context, pageJourneys }) {
  const filePath = path.resolve(context.directories.config, JOURNEY_INDEX_PATH);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify({ pages: pageJourneys }, null, 2)}\n`);
  return filePath;
}

function reportJourneyCoverage({ context, journeys }) {
  const artifact = readCoverageArtifact({ context });
  if (artifact === undefined) {
    context.logger.warn(
      'Journey coverage is unavailable: the build wrote no journeyCoverage.json. Run `lowdefy build` first.'
    );
    return undefined;
  }
  const coverage = computeJourneyCoverage({ coverage: artifact, journeys });
  formatJourneyCoverage({ coverage }).forEach((line) => context.logger.info(line));
  const filePath = writeJourneyIndex({ context, pageJourneys: coverage.pageJourneys });
  context.logger.info(`Journey index written to ${filePath}`);
  return coverage;
}

export default reportJourneyCoverage;
