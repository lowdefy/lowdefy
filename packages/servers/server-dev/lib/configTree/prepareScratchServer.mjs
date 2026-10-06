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

// A build writes into its server directory as well as its build directory:
// it rewrites package.json, cleans and refills public/ from public_default/,
// rewrites lowdefy-build/tailwind/ and copies agent files in. A base or head
// build for the journeys scope gets a scratch server directory of its own, so the
// running dev server's directory (devDirectory) is only ever read: a copy of
// its package.json and public_default/, and a symlink to its node_modules,
// where block source collection resolves plugin packages.
async function prepareScratchServer({ devDirectory, serverDirectory }) {
  await fs.promises.rm(serverDirectory, { recursive: true, force: true });
  await fs.promises.mkdir(serverDirectory, { recursive: true });
  await fs.promises.copyFile(
    path.join(devDirectory, 'package.json'),
    path.join(serverDirectory, 'package.json')
  );
  await fs.promises.cp(
    path.join(devDirectory, 'public_default'),
    path.join(serverDirectory, 'public_default'),
    { recursive: true }
  );
  await fs.promises.symlink(
    path.join(devDirectory, 'node_modules'),
    path.join(serverDirectory, 'node_modules'),
    'dir'
  );
}

export default prepareScratchServer;
