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

import { compileTrace } from '@lowdefy/node-utils';

import readNewestTestRun from './readNewestTestRun.js';

function sequenceKey({ page, identity }) {
  return `${page} ${identity}`;
}

// The interactions the newest test run drove, as sequence keys. No test run:
// testRun null.
function readTestRunKeys({ configDirectory }) {
  const newest = readNewestTestRun({ configDirectory });
  if (newest === null) {
    return { testRun: null, keys: new Set() };
  }
  const { segments } = compileTrace({ records: newest.records, source: 'journey' });
  const keys = new Set(segments.flatMap((segment) => segment.sequence.map(sequenceKey)));
  return { testRun: { id: newest.id }, keys };
}

export { sequenceKey };
export default readTestRunKeys;
