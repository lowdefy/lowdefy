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

import recordingJourneyName from './recordingJourneyName.js';

// Writes .lowdefy/test/run.json for a recorded (full-suite) run: its trace id
// and whether each journey passed in the recorded repetition. Journey records
// carry no pass or fail, so measured failure coverage reads it to count only
// what a passing journey drove. A run that recorded nothing writes nothing.
function writeTestRun({ directories, results }) {
  const recorded = results.filter((result) => result.recorded !== undefined);
  if (recorded.length === 0) {
    return;
  }
  const journeys = {};
  recorded.forEach((result) => {
    const name = recordingJourneyName({
      configDirectory: directories.config,
      filePath: result.filePath,
      journey: result.journey,
    });
    journeys[name] = { passed: result.recorded.passed };
  });
  fs.mkdirSync(directories.test, { recursive: true });
  fs.writeFileSync(
    path.join(directories.test, 'run.json'),
    `${JSON.stringify({ version: 1, run: recorded[0].recorded.run, journeys }, null, 2)}\n`
  );
}

export default writeTestRun;
