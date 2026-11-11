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

import { type } from '@lowdefy/helpers';

import closeSession from './closeSession.js';

// Releases what the test app holds, so the test file's process can exit: its sessions (each
// waits for its background work, then drops its databases), the driver clients the app's
// MongoDB connections opened, its own client on the run's data store, and the build files and
// config it read. The data store itself stays up for the run's other test files and stops with
// the run. Calls on a closed app are refused, so a test never reads a build its file already
// let go of.
//
// The MongoDB plugin keeps one set of clients per process, so closing one app also closes the
// clients of another app opened from the same server install; its next request reconnects.
async function closeTestApp({ testApp }) {
  if (testApp.closed) return;
  testApp.closed = true;
  testApp.accessConfig = null;
  // Settled, not all: a session that cannot close (its store is gone) must not leave the
  // clients below open, which would keep the test file's process alive.
  const closed = await Promise.allSettled(
    [...testApp.sessions].map((testSession) => closeSession({ testSession }))
  );
  testApp.sessions.clear();
  if (!type.isNone(testApp.runtime)) {
    const { closeClients } = await testApp.runtime;
    if (!type.isNone(closeClients)) {
      await closeClients();
    }
  }
  if (!type.isNone(testApp.store)) {
    const store = await testApp.store;
    await store.stop();
  }
  testApp.fileCache.clear();
  const failed = closed.find((result) => result.status === 'rejected');
  if (!type.isUndefined(failed)) {
    throw failed.reason;
  }
}

export default closeTestApp;
