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

import { compileTrace, listFailurePaths } from '@lowdefy/node-utils';

import readNewestTestRun from './readNewestTestRun.js';
import readTestRunResults from './readTestRunResults.js';
import { sequenceKey } from './readTestRunKeys.js';

// What the newest test run measured, for coverage: the interactions the suite
// drove, as sequence keys, and the failed events the journeys that passed
// produced (passingFailurePaths, null when the run's pass results are not on
// this machine). Null when there is no test run.
function readMeasuredRun({ context }) {
  const newest = readNewestTestRun({ configDirectory: context.directories.config });
  if (newest === null) {
    return null;
  }
  const { segments } = compileTrace({ records: newest.records, source: 'journey' });
  const keys = new Set(segments.flatMap((segment) => segment.sequence.map(sequenceKey)));
  const results = readTestRunResults({ directories: context.directories, run: newest.id });
  if (results === null) {
    return { run: newest.id, keys, passingFailurePaths: null };
  }
  const passing = newest.records.filter((record) => results[record.run.journey]?.passed === true);
  return {
    run: newest.id,
    keys,
    passingFailurePaths: listFailurePaths({ records: passing }),
  };
}

export default readMeasuredRun;
