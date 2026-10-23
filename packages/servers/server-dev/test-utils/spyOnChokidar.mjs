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

import chokidar from 'chokidar';
import { vi } from 'vitest';

import flushFsEvents from './flushFsEvents.mjs';

// Replaces chokidar with the real one plus a record of every watcher it
// creates, so a test can reach a watcher the module under test starts
// internally: wait for it to be ready, check what it watches, or listen to its
// events. Call it before importing that module. Returns the live list of
// { watcher, ready } entries, oldest first; ready resolves once the watcher's
// ready event has fired and the OS reports file events to it. chokidar 4 watches
// with fs.watch, which on macOS can miss a write made right after ready.
function spyOnChokidar() {
  const watchers = [];
  function watch(...args) {
    const watcher = chokidar.watch(...args);
    const ready = new Promise((resolve) => watcher.once('ready', resolve)).then(() =>
      flushFsEvents()
    );
    watchers.push({ watcher, ready });
    return watcher;
  }
  vi.doMock('chokidar', () => ({
    default: { ...chokidar, watch },
    FSWatcher: chokidar.FSWatcher,
    watch,
  }));
  return watchers;
}

export default spyOnChokidar;
