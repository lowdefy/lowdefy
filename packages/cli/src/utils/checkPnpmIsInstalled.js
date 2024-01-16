/*
  Copyright 2020-2024 Lowdefy, Inc

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

import { execSync } from 'child_process';

function checkPnpmIsInstalled({ print, pnpmCmd }) {
  try {
    execSync(`${pnpmCmd} --version`, { stdio: 'ignore' });
  } catch (e) {
    print.error(`
-------------------------------------------------------------
  The package manager "pnpm" is required to run Lowdefy.
  Install pnpm as describe here:
  https://pnpm.io/installation
  or run  'corepack enable'.
-------------------------------------------------------------`);
    throw new Error('The package manager "pnpm" is required to run Lowdefy.');
  }
}

export default checkPnpmIsInstalled;
