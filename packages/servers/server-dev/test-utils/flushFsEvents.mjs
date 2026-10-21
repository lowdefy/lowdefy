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
// stream started later is, so this writes a probe file, waits until the probe
// watcher reports it, and returns: every earlier write has been handed out by
// then. Call it after writing fixtures and before starting the watcher under
// test, and after a watcher under test is ready, before the first edit. On
// Linux it costs a few milliseconds.
//
// chokidar 4 watches with fs.watch. On macOS, Node runs one FSEvents stream for
// all of a process's fs.watch watchers and restarts it whenever one is added
// or closed, and a write made while it restarts is never reported. So the probe
// watcher is started once and kept for the rest of the test file: a flush that
// started and closed a watcher of its own would lose the test's next write. Its
// probe is written again until it is seen, since the first write can land in a
// restart.
let probe;

function startProbe() {
  const directory = fs.mkdtempSync(
    path.join(fs.realpathSync(os.tmpdir()), 'lowdefy-fs-events-flush-')
  );
  process.once('exit', () => fs.rmSync(directory, { recursive: true, force: true }));
  // Not persistent, so the probe watcher never keeps the test process alive.
  const watcher = chokidar.watch(directory, { ignoreInitial: true, persistent: false });
  const ready = new Promise((resolve) => watcher.once('ready', resolve));
  return { count: 0, directory, ready, watcher };
}

async function flushFsEvents({ timeout = 60000 } = {}) {
  probe = probe ?? startProbe();
  await probe.ready;
  probe.count += 1;
  const probePath = path.join(probe.directory, `probe-${probe.count}`);
  const { watcher } = probe;
  await new Promise((resolve, reject) => {
    function writeProbe() {
      fs.writeFileSync(probePath, String(Date.now()));
    }
    const retry = setInterval(writeProbe, 250);
    const timer = setTimeout(() => {
      stop();
      reject(
        new Error(
          `flushFsEvents: the OS did not report a file write within ${timeout}ms. File events are stalled on this machine, so no file watcher test can pass until they recover.`
        )
      );
    }, timeout);
    function onEvent(_, filePath) {
      if (filePath !== probePath) return;
      stop();
      resolve();
    }
    function stop() {
      clearInterval(retry);
      clearTimeout(timer);
      watcher.off('all', onEvent);
    }
    watcher.on('all', onEvent);
    writeProbe();
  });
}

export default flushFsEvents;
