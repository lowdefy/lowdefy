/*
  Copyright 2020-2022 Lowdefy, Inc

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

import chokidar from 'chokidar';
import BatchChanges from './BatchChanges.mjs';

function setupWatcher({
  callback,
  watchDotfiles = false,
  ignorePaths = [],
  watchPaths,
  minDelay = 500,
}) {
  return new Promise((resolve) => {
    // const { watch = [], watchIgnore = [] } = context.options;
    // const resolvedWatchPaths = watch.map((pathName) => path.resolve(pathName));

    const batchChanges = new BatchChanges({ fn: callback, minDelay });
    const defaultIgnorePaths = watchDotfiles
      ? []
      : [
          /(^|[/\\])\../, // ignore dotfiles
        ];
    const configWatcher = chokidar.watch(watchPaths, {
      ignored: [...defaultIgnorePaths, ...ignorePaths],
      persistent: true,
      ignoreInitial: true,
    });
    configWatcher.on('add', (...args) => batchChanges.newChange(...args));
    configWatcher.on('change', (...args) => batchChanges.newChange(...args));
    configWatcher.on('unlink', (...args) => batchChanges.newChange(...args));
    configWatcher.on('ready', () => resolve());
  });
}

export default setupWatcher;
