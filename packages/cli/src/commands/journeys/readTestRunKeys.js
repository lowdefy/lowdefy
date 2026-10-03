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

import { compileTrace, listRecordingFiles, readRecordings } from '@lowdefy/node-utils';

function sequenceKey({ page, identity }) {
  return `${page} ${identity}`;
}

// The interactions the newest test run drove, as sequence keys: the newest
// `journey` run recorded by `lowdefy test` or lowdefy_run_tests (`run.by:
// test`, always a full-suite run). A newer lowdefy_run_journey experiment
// (`run.by: agent`) never stands in for the suite. No such run: testRun null.
function readTestRunKeys({ configDirectory }) {
  const files = listRecordingFiles({ configDirectory, source: 'journey' }).reverse();
  for (const file of files) {
    const records = readRecordings({ configDirectory, source: 'journey', run: file.id });
    if (records.some((record) => record?.run?.by === 'test')) {
      const { segments } = compileTrace({
        records: records.filter((record) => record?.run?.by === 'test'),
        source: 'journey',
      });
      const keys = new Set(segments.flatMap((segment) => segment.sequence.map(sequenceKey)));
      return { testRun: { id: file.id }, keys };
    }
  }
  return { testRun: null, keys: new Set() };
}

export { sequenceKey };
export default readTestRunKeys;
