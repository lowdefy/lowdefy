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

import fs from 'fs';

// Playwright's installer writes INSTALLATION_COMPLETE into the browser
// directory last, after extracting and chmod-ing the executable. An install
// that was killed or crashed after the executable landed leaves a directory
// without it: chromium.launch() checks only the executable and fails with a
// launch error, while a new `playwright install` sees the missing marker and
// installs again. The registry is Playwright's own (an exported subpath of the
// pinned playwright-core), so the directory honours PLAYWRIGHT_BROWSERS_PATH.
async function isHeadlessShellIncomplete() {
  const { browserDirectoryToMarkerFilePath, registry } = await import(
    'playwright-core/lib/server/registry/index'
  );
  const { directory } = registry.findExecutable('chromium-headless-shell');
  return fs.existsSync(directory) && !fs.existsSync(browserDirectoryToMarkerFilePath(directory));
}

export default isHeadlessShellIncomplete;
