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

import crypto from 'node:crypto';
import { syncBuiltinESMExports } from 'node:module';
import path from 'node:path';

// Loaded into every Node process of a bench build (NODE_OPTIONS=--import), and
// acts only in the server's Lowdefy build script (lowdefy/build.mjs). The
// build gives each run a random buildId (buildAppMeta), which has no
// environment variable to pin it, so two builds of the same code would never
// match. Within the build, randomUUID hands out a fixed sequence instead.
// syncBuiltinESMExports carries the change to `import { randomUUID } from
// 'crypto'`.
const script = process.argv[1] ?? '';
const isLowdefyBuild =
  path.basename(script) === 'build.mjs' && path.basename(path.dirname(script)) === 'lowdefy';

if (isLowdefyBuild) {
  let counter = 0;
  crypto.randomUUID = function pinnedRandomUUID() {
    counter += 1;
    return `00000000-0000-4000-8000-${counter.toString(16).padStart(12, '0')}`;
  };
  syncBuiltinESMExports();
}
