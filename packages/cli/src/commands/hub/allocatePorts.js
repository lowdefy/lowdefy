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

import { isPortAvailable } from '@lowdefy/node-utils';

import { PORT_RANGE } from './hubProtocol.js';

async function isPairFree({ port, internalPort }) {
  return (await isPortAvailable({ port })) && (await isPortAvailable({ port: internalPort }));
}

// Ports stick to an app across restarts - open tabs, screenshots and earlier
// tool results keep pointing at the right server - and move only when
// something else took them. reserved holds the pairs other managed apps own,
// running or not, so two apps never trade ports between restarts.
async function allocatePorts({ previous, reserved }) {
  if (previous && (await isPairFree(previous))) {
    return previous;
  }
  const taken = new Set(reserved.flatMap((pair) => [pair.port, pair.internalPort]));
  for (let port = PORT_RANGE.first; port < PORT_RANGE.last; port += 2) {
    const pair = { port, internalPort: port + 1 };
    if (!taken.has(pair.port) && !taken.has(pair.internalPort) && (await isPairFree(pair))) {
      return pair;
    }
  }
  throw new Error(
    `No free port pair in ${PORT_RANGE.first}-${PORT_RANGE.last}. Stop some dev servers with: lowdefy hub stop --all`
  );
}

export default allocatePorts;
