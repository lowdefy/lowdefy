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

import { execFileSync } from 'child_process';
import path from 'path';

import shellPackage from '../../package.json';
import shellVersion from './shellVersion.js';

// The committed version the bundle carries must be the package's: run
// `pnpm --filter=@lowdefy/shell shell-version` after changing it. `pnpm release:version` does.
test('src/version/shellVersion.js matches the @lowdefy/shell package version', () => {
  expect(shellVersion).toBe(shellPackage.version);
  expect(
    execFileSync(process.execPath, [path.join(__dirname, '../../scripts/createShellVersion.mjs')], {
      encoding: 'utf8',
    })
  ).toBe(shellVersion);
});
