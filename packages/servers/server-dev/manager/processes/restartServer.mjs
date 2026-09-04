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

import startServer from './startServer.mjs';

// The child binds context.internalPort with --strictPort, so the new one must
// not be spawned until the old one has released the socket - otherwise it dies
// with EADDRINUSE and nothing is serving. SIGTERM is honoured by Vite well
// inside this budget; a child that is not gone by then is not going to leave.
const EXIT_TIMEOUT = 5000;

function waitForExit({ child, context }) {
  return new Promise((resolve) => {
    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      clearTimeout(termTimer);
      clearTimeout(hardTimer);
      resolve();
    };
    const termTimer = setTimeout(() => {
      context.logger.warn(`Dev server pid ${child.pid} did not exit, sending SIGKILL.`);
      child.kill('SIGKILL');
    }, EXIT_TIMEOUT);
    const hardTimer = setTimeout(done, EXIT_TIMEOUT * 2);
    child.once('exit', done);
  });
}

// Coalesces concurrent triggers into one restart. There are four independent
// triggers (env, server artifacts, local plugin sources, the dev tools'
// .restart sentinel) and a single plugin edit plausibly fires two of them
// (source change -> rebuild -> artifact hash change). A trigger that arrives
// while a restart is in flight joins it rather than starting a second one: the
// restart it joins spawns after it fired, so it serves the same edit.
let inFlight = null;

async function restart(context) {
  context.shutdownServer();
  // shutdownServer signals the child and hands it over as exitingServer; it is
  // still holding the port until its exit event. exitCode and signalCode are
  // both null only while the process is alive.
  const child = context.exitingServer;
  if (!type.isNone(child) && child.exitCode === null && child.signalCode === null) {
    await waitForExit({ child, context });
  }
  context.exitingServer = null;
  context.logger.info({ spin: 'start' }, 'Restarting server...');
  startServer(context);
  context.logger.info({ spin: 'succeed' }, 'Restarted server.');
}

function restartServer(context) {
  return () => {
    if (inFlight !== null) {
      return inFlight;
    }
    inFlight = restart(context).finally(() => {
      inFlight = null;
    });
    return inFlight;
  };
}

export default restartServer;
