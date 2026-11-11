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

import dataSessionRegistry from './dataSessionRegistry.js';
import isProcessAlive from './isProcessAlive.js';

const processPattern = /^ld_p(\d+)_/;

// On a test run's store (getRunDataStore) every test process of the run holds sessions, and
// this process's registry lists only its own. A session database there carries its process's
// pid (ld_p<pid>_...), and it is another process's to keep for as long as that process lives.
function isHeldByAnotherProcess(name) {
  const pid = Number(processPattern.exec(name)?.[1]);
  return Number.isInteger(pid) && pid !== process.pid && isProcessAlive({ pid });
}

// Drops every session database on the store that no registered session owns: one left behind by a
// write that was still in flight when its session dropped its databases, or by a dev server that
// stopped mid-run. A session owns every database under its prefix (<prefix>_<n>), including one it
// numbers after this sweep lists them.
//
// `perRun` is set for a test run's store, which the run's test processes share. The sweep then
// drops by run, not by process: the databases of this process that no session owns, and those
// of test processes of the run that have exited, and it leaves the databases of the ones still
// running. The dev server never passes it: its store has one process.
async function sweepOrphanDatabases({ client, perRun = false }) {
  const prefixes = [...dataSessionRegistry.values()].map((session) => `${session.prefix}_`);
  const { databases } = await client.db('admin').admin().listDatabases({ nameOnly: true });
  await Promise.all(
    databases
      .map((database) => database.name)
      .filter(
        (name) => name.startsWith('ld_') && !prefixes.some((prefix) => name.startsWith(prefix))
      )
      .filter((name) => !perRun || !isHeldByAnotherProcess(name))
      .map((name) => client.db(name).dropDatabase())
  );
}

export default sweepOrphanDatabases;
