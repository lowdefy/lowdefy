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
import path from 'path';
import { type } from '@lowdefy/helpers';
import setupWatcher from '../utils/setupWatcher.mjs';

function readReason(filePath) {
  try {
    const { reason } = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return type.isString(reason) && reason !== '' ? reason : 'no reason given';
  } catch {
    // The app may still be writing the file, or it was already consumed.
    return 'no reason given';
  }
}

// The dev tools (POST /lowdefy-docs/restart, lowdefy_restart) run inside the
// app process, which has no channel to the manager except the build directory.
// They write build/.restart; the manager consumes it here.
function restartRequestWatcher(context) {
  const sentinelPath = path.join(context.directories.build, '.restart');

  const callback = async () => {
    if (!fs.existsSync(sentinelPath)) {
      return;
    }
    const reason = readReason(sentinelPath);
    fs.rmSync(sentinelPath, { force: true });
    context.logger.info({ spin: 'start' }, `Restart requested by the dev tools: ${reason}.`);
    context.restartServer();
  };

  // The sentinel does not exist until the first request, so watch the build
  // directory (non-recursively) and react only to the sentinel itself.
  return setupWatcher({
    callback,
    context,
    watchDotfiles: true,
    watchPaths: [context.directories.build],
    ignorePaths: [
      (filePath) => filePath !== context.directories.build && filePath !== sentinelPath,
    ],
    delay: 100,
  });
}

export default restartRequestWatcher;
