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

import { defineConfig } from 'vitest/config';

// The suite over a production build of apps/journey-fixture, which the global setup builds once
// per run (test/fixture/globalSetup.mjs) into the server copy @lowdefy/test-utils' fixture suites
// read, _server/test-utils-journey-fixture. Do not run it at the same time as those suites in one
// worktree. Sessions start the run's mongod, so the timeouts leave room for a loaded machine.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/fixture/**/*.test.mjs'],
    globalSetup: ['./test/fixture/globalSetup.mjs'],
    clearMocks: true,
    testTimeout: 120000,
    hookTimeout: 120000,
    maxWorkers: 2,
  },
});
