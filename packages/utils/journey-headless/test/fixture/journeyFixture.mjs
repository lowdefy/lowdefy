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

import path from 'node:path';

const repositoryRoot = path.resolve(import.meta.dirname, '../../../../..');

// apps/journey-fixture, built as @lowdefy/test-utils' fixture suites build it, into the same
// server copy, so a run of either suite leaves the build the other reads.
const journeyFixture = {
  configDirectory: path.join(repositoryRoot, 'apps', 'journey-fixture'),
  serverDirectory: path.join(repositoryRoot, '_server', 'test-utils-journey-fixture'),
};

export { repositoryRoot };
export default journeyFixture;
