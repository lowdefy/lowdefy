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
import net from 'net';

import withStartLock from './withStartLock.js';

function isHubListening(socketPath) {
  return new Promise((resolve) => {
    const socket = net.connect(socketPath);
    socket.once('connect', () => {
      socket.end();
      resolve(true);
    });
    socket.once('error', () => resolve(false));
  });
}

// Whoever can connect to the hub can have it run a dev script, as this user.
// The socket is created readable and writable by this user only - set by the
// umask at bind time, so there is no moment between listen and a chmod when
// another user could connect.
function tryListen({ server, socketPath }) {
  return new Promise((resolve, reject) => {
    function onError(error) {
      if (error.code === 'EADDRINUSE') {
        resolve(false);
        return;
      }
      reject(error);
    }
    server.once('error', onError);
    const umask = process.umask(0o077);
    try {
      server.listen(socketPath, () => {
        server.removeListener('error', onError);
        resolve(true);
      });
    } finally {
      process.umask(umask);
    }
  });
}

async function listenHubSocket({ server, socketPath, lockPath }) {
  if (await tryListen({ server, socketPath })) {
    return true;
  }
  // A socket file with no hub behind it is left over from a crash or a
  // reboot. One with a live hub means another hub won the start-up race - this
  // one steps aside. Hubs starting together would each find the file stale,
  // and one would remove the socket another had just bound, leaving that hub
  // running unreachable beside it - so the check and takeover are locked.
  return withStartLock({ lockPath }, async () => {
    if (await isHubListening(socketPath)) {
      return false;
    }
    fs.rmSync(socketPath, { force: true });
    return tryListen({ server, socketPath });
  });
}

export default listenHubSocket;
