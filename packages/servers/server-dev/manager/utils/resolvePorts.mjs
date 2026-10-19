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

import { findAvailablePort, isPortAvailable } from '@lowdefy/node-utils';

// An explicit port (--port, PORT, cli.port, or one the hub allocated) is a
// promise to whoever asked for it: moving silently to the next free port sent
// agents to a different app's server on the port they expected. Only the
// unrequested default still moves.
async function resolvePort({ port, strict, name }) {
  if (strict) {
    if (!(await isPortAvailable({ port }))) {
      throw new Error(
        `${name} ${port} is already in use. Stop the process using it or choose another port.`
      );
    }
    return port;
  }
  return findAvailablePort({ port });
}

async function resolvePorts(context) {
  const { options } = context;
  const port = await resolvePort({ port: options.port, strict: options.strictPort, name: 'Port' });
  if (port !== options.port) {
    context.logger.warn(`Port ${options.port} is in use, using port ${port} instead.`);
  }
  const internalPort = await resolvePort({
    port: options.internalPort ?? port + 1,
    strict: options.internalPort !== undefined,
    name: 'Internal port',
  });
  return { port, internalPort };
}

export default resolvePorts;
