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

import crypto from 'node:crypto';
import net from 'node:net';

// The IANA dynamic range. The store binds above the ports apps usually take (3000 and up), so an
// app the developer starts while it runs never finds its port held by mongod.
const MIN_PORT = 49152;
const MAX_PORT = 65535;
const MAX_TRIES = 20;

function isPortFree(port) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.once('error', (error) => {
      // Windows refuses a port inside a range it reserves (Hyper-V, WinNAT) with EACCES, and those
      // ranges sit inside the dynamic range, so such a port is taken like one in use.
      if (error.code === 'EADDRINUSE' || error.code === 'EACCES') {
        resolve(false);
        return;
      }
      reject(error);
    });
    server.listen(port, '127.0.0.1', () => {
      server.close(() => resolve(true));
    });
  });
}

async function pickDataStorePort() {
  for (let tries = 0; tries < MAX_TRIES; tries += 1) {
    const port = crypto.randomInt(MIN_PORT, MAX_PORT + 1);
    if (await isPortFree(port)) {
      return port;
    }
  }
  throw new Error(
    `No free port between ${MIN_PORT} and ${MAX_PORT} for the journey data store after ${MAX_TRIES} tries.`
  );
}

export { MIN_PORT };
export default pickDataStorePort;
