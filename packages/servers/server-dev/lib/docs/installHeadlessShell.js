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

import { spawn } from 'child_process';
import { createRequire } from 'module';
import path from 'path';

import { type } from '@lowdefy/helpers';

// Read the way Playwright's own installer reads it, so a value that turns
// Playwright's download off turns this one off too.
function isDownloadSkipped() {
  const value = process.env.PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD;
  if (type.isNone(value) || value === '' || value === 'false' || value === '0') {
    return false;
  }
  return true;
}

function runInstall() {
  // cli.js is not in playwright-core's exports, so it is found next to the
  // package.json, which is. Running the installer of the playwright-core this
  // server loads fetches exactly the shell revision it launches.
  const require = createRequire(import.meta.url);
  const cliPath = path.join(
    path.dirname(require.resolve('playwright-core/package.json')),
    'cli.js'
  );
  console.info('Installing chromium-headless-shell for the dev server browser tools.');
  return new Promise((resolve) => {
    let settled = false;
    let stderr = '';
    function settle({ installed, reason }) {
      if (settled) return;
      settled = true;
      if (!installed) {
        console.warn(
          `Could not install chromium-headless-shell (${reason}). The dev server browser tools use system Chrome when it is installed. Run: npx playwright install chromium-headless-shell`
        );
      }
      resolve(installed);
    }
    // A short-lived process: the download and unzip never touch this
    // server's memory. Playwright's registry lock serialises installs from
    // several dev servers on one machine.
    const installer = spawn(process.execPath, [cliPath, 'install', 'chromium-headless-shell'], {
      stdio: ['ignore', 'ignore', 'pipe'],
    });
    installer.stderr.on('data', (data) => {
      stderr = `${stderr}${data.toString('utf8')}`.slice(-1000);
    });
    installer.on('error', (error) => settle({ installed: false, reason: error.message }));
    installer.on('exit', (code) => {
      if (code === 0) {
        settle({ installed: true });
        return;
      }
      settle({ installed: false, reason: stderr.trim() || `exit code ${code}` });
    });
  });
}

// One install per dev server process, shared by every caller. A failed
// install is not retried in this process: system Chrome stays the fallback.
let installPromise = null;

// Resolves true once the shell is installed, false when the install failed,
// or returns null when downloads are turned off.
function installHeadlessShell() {
  if (isDownloadSkipped()) {
    return null;
  }
  if (type.isNone(installPromise)) {
    installPromise = runInstall();
  }
  return installPromise;
}

export default installHeadlessShell;
