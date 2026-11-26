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

import { execFile } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const repositoryRoot = path.resolve(import.meta.dirname, '../../../../..');

// A production build of apps/journey-fixture for the headless side of the parity check
// (checkParity.mjs), in a server copy of its own, so @lowdefy/test-utils' and
// @lowdefy/journey-headless' fixture suites keep theirs. Built as `lowdefy build
// --no-client-build` makes one; the monorepo is not rebuilt (run `pnpm build` first). Returns
// the server directory.
async function buildParityFixture({ configDirectory }) {
  const serverDirectory = path.join(repositoryRoot, '_server', 'parity-journey-fixture');
  try {
    await execFileAsync(
      process.execPath,
      [
        path.join(repositoryRoot, 'scripts', 'build.mjs'),
        '--skip-build',
        '--no-client-build',
        '--log-level',
        'error',
        '--config-directory',
        configDirectory,
        '--server-directory',
        serverDirectory,
      ],
      { cwd: repositoryRoot, maxBuffer: 64 * 1024 * 1024 }
    );
  } catch (error) {
    throw new Error(
      `Could not build apps/journey-fixture for the headless parity check. Run "pnpm build" from the repository root first.\n${error.stdout}\n${error.stderr}`
    );
  }
  return serverDirectory;
}

export default buildParityFixture;
