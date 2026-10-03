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
import os from 'os';
import path from 'path';
import chokidar from 'chokidar';

// macOS FSEvents can report a write made just before a watcher started to
// that watcher, as if it happened after: the OS had not yet handed the write
// out when the watcher's stream began. Fixture writes then reach the watcher
// under test as edits. Once one watcher has been told about a write, no
// stream started later is, so this writes a probe file, waits until a
// throwaway watcher reports it, and returns: every earlier write has been
// handed out by then. Call it after writing fixtures and before starting the
// watcher under test. On Linux it costs a few milliseconds.
async function flushFsEvents({ timeout = 60000 } = {}) {
  const probeDir = fs.mkdtempSync(
    path.join(fs.realpathSync(os.tmpdir()), 'lowdefy-fs-events-flush-')
  );
  const probePath = path.join(probeDir, 'probe');
  const watcher = chokidar.watch(probeDir, { ignoreInitial: true, persistent: true });
  try {
    await new Promise((resolve) => watcher.on('ready', resolve));
    await new Promise((resolve, reject) => {
      const timer = setTimeout(
        () =>
          reject(
            new Error(
              `flushFsEvents: the OS did not report a file write within ${timeout}ms. File events are stalled on this machine, so no file watcher test can pass until they recover.`
            )
          ),
        timeout
      );
      watcher.on('all', (_, filePath) => {
        if (filePath !== probePath) return;
        clearTimeout(timer);
        resolve();
      });
      fs.writeFileSync(probePath, String(Date.now()));
    });
  } finally {
    await watcher.close();
    fs.rmSync(probeDir, { recursive: true, force: true });
  }
}

export default flushFsEvents;
