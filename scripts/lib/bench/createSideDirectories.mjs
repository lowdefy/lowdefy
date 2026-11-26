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

function ensureSymlink({ linkPath, target }) {
  const existing = fs.lstatSync(linkPath, { throwIfNoEntry: false });
  if (existing) {
    if (existing.isSymbolicLink() && fs.readlinkSync(linkPath) === target) {
      return;
    }
    fs.rmSync(linkPath, { recursive: true, force: true });
  }
  fs.symlinkSync(target, linkPath, process.platform === 'win32' ? 'junction' : 'dir');
}

// The folders of one side under the app's bench folder, the same shape for
// every side:
//   <name>/lowdefy           → the side's Lowdefy checkout (a symlink)
//   <name>/workspace/        → pnpm-workspace.yaml the CLI reads as the app's
//   <name>/workspace/server  → the prepared server
// Every side's server then sits at the same depth beside a "lowdefy" folder,
// so the relative paths the prep and the build write (link: paths to the
// @lowdefy/* packages, the app's styles from build/globals.css) are the same
// on both sides, and only the server directory itself differs.
function createSideDirectories({ benchDirectory, name, repoRoot }) {
  const sideDirectory = path.join(benchDirectory, name);
  const checkoutLink = path.join(sideDirectory, 'lowdefy');
  fs.mkdirSync(path.join(sideDirectory, 'workspace'), { recursive: true });
  ensureSymlink({ linkPath: checkoutLink, target: repoRoot });
  return {
    checkoutLink,
    logFile: path.join(benchDirectory, 'logs', `${name}.log`),
    serverDirectory: path.join(sideDirectory, 'workspace', 'server'),
  };
}

export default createSideDirectories;
