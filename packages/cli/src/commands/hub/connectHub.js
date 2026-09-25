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

import net from 'net';
import { wait } from '@lowdefy/helpers';

import createHubClient from './createHubClient.js';
import getHubPaths from './getHubPaths.js';
import { HUB_PROTOCOL } from './hubProtocol.js';
import startHubProcess from './startHubProcess.js';

const START_TIMEOUT_MS = 10000;

function openSocket(socketPath) {
  return new Promise((resolve) => {
    const socket = net.connect(socketPath);
    socket.once('connect', () => resolve(socket));
    socket.once('error', () => resolve(null));
  });
}

async function waitForSocket(socketPath) {
  const deadline = Date.now() + START_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const socket = await openSocket(socketPath);
    if (socket !== null) {
      return socket;
    }
    await wait(100);
  }
  throw new Error(
    `The Lowdefy hub did not start within ${START_TIMEOUT_MS / 1000}s. See its log for why.`
  );
}

async function openClient({ paths, autoStart }) {
  let socket = await openSocket(paths.socketPath);
  if (socket === null) {
    if (!autoStart) {
      return null;
    }
    startHubProcess({ paths });
    socket = await waitForSocket(paths.socketPath);
  }
  return createHubClient({ socket });
}

// Connects to the per-user hub, starting it when none runs.
async function connectHub({ autoStart = true } = {}) {
  const paths = getHubPaths();
  const client = await openClient({ paths, autoStart });
  if (client === null) {
    return null;
  }
  const { protocol, pid, version } = await client.request('hello');
  if (protocol !== HUB_PROTOCOL) {
    client.close();
    throw new Error(
      `The running Lowdefy hub (pid ${pid}, lowdefy ${version}) speaks hub protocol ${protocol}; this CLI needs ${HUB_PROTOCOL}. Stop it (kill ${pid}) - the servers it runs keep running and the next hub adopts them.`
    );
  }
  return client;
}

export default connectHub;
