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

import getExercisedPath from './getExercisedPath.js';
import hashJourney from './hashJourney.js';

function readFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return { journeys: {} };
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

// Keeps the newest measured path of each journey in
// .lowdefy/test/exercised.json, for lints, variants and harden. Journeys this
// run did not measure keep their earlier entries.
function writeExercised({ directories, results, buildId }) {
  const measured = results.filter(
    (result) => !type.isNone(result.exercised) && !type.isNone(result.journey)
  );
  if (measured.length === 0) {
    return;
  }
  const filePath = getExercisedPath({ directories });
  const journeys = readFile(filePath).journeys ?? {};
  measured.forEach((result) => {
    const file = path.relative(directories.config, result.filePath);
    journeys[`${file}#${result.name}`] = {
      hash: hashJourney(result.journey),
      passed: result.newestPassed,
      exercised: result.exercised,
    };
  });
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(
    filePath,
    JSON.stringify({ version: 1, buildId: buildId ?? null, journeys }, null, 2)
  );
}

export default writeExercised;
