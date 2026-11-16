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

// The suites that read production builds of three apps in this repository, which the global
// setup builds once per run (test/fixtureApps/globalSetup.mjs), so the timeouts leave room for
// a loaded machine.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/fixtureApps/**/*.test.mjs'],
    globalSetup: ['./test/fixtureApps/globalSetup.mjs'],
    clearMocks: true,
    testTimeout: 120000,
    hookTimeout: 120000,
    maxWorkers: 2,
  },
});
