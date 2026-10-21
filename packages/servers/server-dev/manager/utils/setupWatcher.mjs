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

import path from 'path';

import chokidar from 'chokidar';
import { type } from '@lowdefy/helpers';

import BatchChanges from './BatchChanges.mjs';
import createDotPathIgnore from './createDotPathIgnore.mjs';
import createGlobIgnore from './createGlobIgnore.mjs';
import createGlobWatchPaths from './createGlobWatchPaths.mjs';

// chokidar hands ignore functions a path with forward slashes on every platform
// (its matcher normalizes it), while watch paths and the directories they are
// compared with use the platform separator. Ignore functions get the platform
// form, so a comparison with a watch path holds on Windows too.
function withNativePath(ignore) {
  if (typeof ignore !== 'function') {
    return ignore;
  }
  return (filePath, ...rest) => ignore(path.normalize(filePath), ...rest);
}

function setupWatcher({
  callback,
  context,
  watchDotfiles = false,
  ignorePaths = [],
  watchPaths,
  delay = 500,
  onBusy,
}) {
  return new Promise((resolve) => {
    const batchChanges = new BatchChanges({ context, fn: callback, delay, onBusy });
    const globWatch = createGlobWatchPaths(watchPaths);
    const ignored = watchDotfiles
      ? []
      : [createDotPathIgnore({ watchPaths: globWatch.watchPaths })];
    if (globWatch.ignore !== null) {
      ignored.push(globWatch.ignore);
    }
    ignored.push(...ignorePaths.filter((ignore) => !type.isString(ignore)));
    const globIgnores = ignorePaths.filter((ignore) => type.isString(ignore));
    if (globIgnores.length > 0) {
      ignored.push(createGlobIgnore(globIgnores));
    }
    const configWatcher = chokidar.watch(globWatch.watchPaths, {
      ignored: ignored.map(withNativePath),
      persistent: true,
      ignoreInitial: true,
    });
    configWatcher.on('add', (...args) => batchChanges.newChange(...args));
    configWatcher.on('change', (...args) => batchChanges.newChange(...args));
    configWatcher.on('unlink', (...args) => batchChanges.newChange(...args));
    configWatcher.on('ready', () => resolve(configWatcher));
  });
}

export default setupWatcher;
