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

// Runs one build in its own Node process and logs JSON lines to stdout, as
// `lowdefy build` runs each Lowdefy build in a process of its own. The test
// runner caches module resolution, so a test that installs a package between
// two builds in one test process would not see it. Options are one JSON argument.
import { createNodeLogger } from '@lowdefy/logger/node';

import build from '../index.js';

const options = JSON.parse(process.argv[2]);
const logger = createNodeLogger({ level: 'debug' });

try {
  await build({ ...options, logger });
} catch {
  process.exitCode = 1;
}
