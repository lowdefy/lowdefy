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

import createHub from './createHub.js';
import createLineReader from './createLineReader.js';
import getHubPaths from './getHubPaths.js';
import { HUB_IDLE_EXIT_MS } from './hubProtocol.js';

const REAP_INTERVAL_MS = 60 * 1000;

function createLogger() {
  function log(level, message) {
    process.stdout.write(`${new Date().toISOString()} ${level} ${message}\n`);
  }
  return {
    error: (message) => log('error', message),
    info: (message) => log('info', message),
  };
}

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

async function listen({ server, socketPath }) {
  try {
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(socketPath, resolve);
    });
    return true;
  } catch (error) {
    if (error.code !== 'EADDRINUSE') {
      throw error;
    }
  }
  // A socket file with no hub behind it is left over from a crash. One with a
  // live hub means another hub won the start-up race - this one steps aside.
  if (await isHubListening(socketPath)) {
    return false;
  }
  fs.rmSync(socketPath, { force: true });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(socketPath, resolve);
  });
  return true;
}

// `lowdefy hub serve` - the per-user daemon behind `lowdefy mcp` and the
// `lowdefy hub` commands. Started on demand by connectHub, detached from
// whoever started it, and gone again once it has had nothing to do for a while.
async function hubServe({ cliVersion }) {
  const paths = getHubPaths();
  const logger = createLogger();
  fs.mkdirSync(paths.hubDirectory, { recursive: true, mode: 0o700 });

  const hub = createHub({ paths, cliVersion, logger });
  const connections = new Set();
  let nextConnectionId = 1;
  let idleSince = Date.now();

  function shutdown() {
    hub.saveRegistry();
    server.close();
    connections.forEach((socket) => socket.destroy());
    process.exit(0);
  }

  const methods = {
    attach: (params, connectionId) => hub.attach({ ...params, connectionId }),
    hello: () => hub.hello(),
    list: () => hub.list(),
    logs: (params) => hub.logs(params),
    start: (params) => hub.start(params),
    status: (params) => hub.status(params),
    stop: (params) => hub.stop(params),
  };

  const server = net.createServer((socket) => {
    const connectionId = nextConnectionId;
    nextConnectionId += 1;
    connections.add(socket);
    socket.setEncoding('utf8');
    socket.on(
      'data',
      createLineReader({
        onMessage: async ({ id, method, params }) => {
          const handler = methods[method];
          let reply;
          try {
            if (handler === undefined) {
              throw new Error(`Unknown hub method "${method}".`);
            }
            reply = { id, result: await handler(params ?? {}, connectionId) };
          } catch (error) {
            reply = { id, error: { message: error.message } };
          }
          if (!socket.destroyed) {
            socket.write(`${JSON.stringify(reply)}\n`);
          }
        },
      })
    );
    socket.on('error', () => {});
    socket.on('close', () => {
      connections.delete(socket);
      hub.connectionClosed({ connectionId });
    });
  });

  if (!(await listen({ server, socketPath: paths.socketPath }))) {
    logger.info('Another hub is already running - exiting.');
    return;
  }
  if (process.platform !== 'win32') {
    fs.chmodSync(paths.socketPath, 0o600);
  }
  logger.info(`Lowdefy hub ${cliVersion} listening on ${paths.socketPath} (pid ${process.pid}).`);

  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, shutdown);
  }

  setInterval(async () => {
    try {
      await hub.reap();
    } catch (error) {
      logger.error(`Reaping failed: ${error.message}`);
    }
    if (connections.size > 0 || hub.hasManagedServers()) {
      idleSince = Date.now();
      return;
    }
    if (Date.now() - idleSince > HUB_IDLE_EXIT_MS) {
      logger.info('Idle with no dev servers and no clients - exiting.');
      shutdown();
    }
  }, REAP_INTERVAL_MS);

  await new Promise(() => {});
}

export default hubServe;
