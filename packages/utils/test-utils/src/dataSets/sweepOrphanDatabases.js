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

import { threadId } from 'node:worker_threads';

import dataSessionRegistry from './dataSessionRegistry.js';
import isProcessAlive from './isProcessAlive.js';

const ownerPattern = /^ld_p(\d+)(?:t(\d+))?_/;

// On a test run's store (getRunDataStore) every test file of the run holds sessions, and this
// thread's registry lists only its own. A session database there carries the process and thread
// that opened it (openDataSession): ld_p<pid>_ from a main thread, ld_p<pid>t<threadId>_ from a
// worker thread, as under a runner that runs test files in worker threads. Another process's
// database is its to keep for as long as that process lives. Another thread's in this process is
// always left: a thread cannot tell whether another thread still runs, and the store drops those
// databases once this process has exited (a later sweep, or the store stopping).
function isHeldElsewhere(name) {
  const match = ownerPattern.exec(name);
  if (match === null) return false;
  const pid = Number(match[1]);
  if (pid !== process.pid) return isProcessAlive({ pid });
  return Number(match[2] ?? 0) !== threadId;
}

// Drops every session database on the store that no registered session owns: one left behind by a
// write that was still in flight when its session dropped its databases, or by a dev server that
// stopped mid-run. A session owns every database under its prefix (<prefix>_<n>), including one it
// numbers after this sweep lists them.
//
// `perRun` is set for a test run's store, which the run's test files share. The sweep then drops
// by run, not by thread: the databases of this thread that no session owns, and those of test
// processes of the run that have exited, and it leaves the databases of processes still running
// and of this process's other threads. The dev server never passes it: its store has one process
// and one thread.
async function sweepOrphanDatabases({ client, perRun = false }) {
  const prefixes = [...dataSessionRegistry.values()].map((session) => `${session.prefix}_`);
  const { databases } = await client.db('admin').admin().listDatabases({ nameOnly: true });
  await Promise.all(
    databases
      .map((database) => database.name)
      .filter(
        (name) => name.startsWith('ld_') && !prefixes.some((prefix) => name.startsWith(prefix))
      )
      .filter((name) => !perRun || !isHeldElsewhere(name))
      .map((name) => client.db(name).dropDatabase())
  );
}

export default sweepOrphanDatabases;
