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

import removeDataStoreFiles from './removeDataStoreFiles.js';

const SHUTDOWN_SIGNALS = ['SIGTERM', 'SIGINT', 'SIGHUP'];

// A store is stopped, with its temporary database directory removed, when the dev server process
// shuts down. The manager stops the process with SIGTERM, a terminal Ctrl+C sends SIGINT and closing
// the terminal sends SIGHUP, whose default action ends the process without an exit event; on each
// the store stops first and the signal is raised again, so the process ends as it would have.
// Vite's own SIGTERM handler can exit before that stop finishes, so the exit hook kills mongod and
// removes its directory synchronously. mongodb-memory-server's killer process still stops mongod
// after a crash, which runs neither.
function registerDataStoreShutdown({ replSet, stop }) {
  async function onSignal(signal) {
    try {
      await stop();
    } finally {
      process.kill(process.pid, signal);
    }
  }
  function onExit() {
    removeDataStoreFiles({ replSet });
  }
  SHUTDOWN_SIGNALS.forEach((signal) => process.once(signal, onSignal));
  process.once('exit', onExit);
  return function unregisterDataStoreShutdown() {
    SHUTDOWN_SIGNALS.forEach((signal) => process.off(signal, onSignal));
    process.off('exit', onExit);
  };
}

export default registerDataStoreShutdown;
