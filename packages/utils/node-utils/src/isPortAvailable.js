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

// libuv sets SO_REUSEADDR on listening sockets, so on macOS a wildcard bind
// succeeds while another process holds a specific loopback address (and vice
// versa) — only an exact address match fails with EADDRINUSE. A single
// anonymous bind therefore reports ports busy on 127.0.0.1 (how Vite binds
// `localhost`) as available. Probe the wildcard and both loopback addresses
// so each common binding pattern is detected by its exact match.
const HOSTS = [undefined, '127.0.0.1', '::1'];

function checkHost({ port, host }) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        resolve(false);
        return;
      }
      // Host has no IPv6 loopback — nothing can occupy that address.
      if (['EADDRNOTAVAIL', 'EAFNOSUPPORT', 'EINVAL'].includes(error.code)) {
        resolve(true);
        return;
      }
      reject(error);
    });
    server.listen(port, host, () => {
      server.close(() => resolve(true));
    });
  });
}

async function isPortAvailable({ port }) {
  for (const host of HOSTS) {
    if (!(await checkHost({ port, host }))) {
      return false;
    }
  }
  return true;
}

export default isPortAvailable;
