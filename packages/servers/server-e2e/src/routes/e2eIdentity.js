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

import fs from 'node:fs';
import path from 'node:path';

// @lowdefy/e2e-utils compares this with the build directory its config expects, so a
// Playwright run reuses a running server only when it serves this app's e2e build.
const buildDirectory = fs.realpathSync(path.join(process.cwd(), 'build'));

function e2eIdentityHandler(c) {
  return c.json({ server: 'lowdefy-e2e', buildDirectory });
}

export default e2eIdentityHandler;
