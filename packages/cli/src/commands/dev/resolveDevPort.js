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
import { type } from '@lowdefy/helpers';

import isPortExplicit from './isPortExplicit.js';

async function resolveDevPort({ context }) {
  // The hub allocates each managed server's port and sets it here. It
  // outranks --port because dev scripts often hard-code one, and a hub server
  // on the script's port would collide with the developer's own.
  const hubPort = process.env.LOWDEFY_DEV_PORT;
  const hubAllocated = !type.isNone(hubPort) && hubPort !== '';
  if (hubAllocated) {
    context.options.port = Number(hubPort);
  }
  const { port } = context.options;
  context.options.strictPort = hubAllocated || isPortExplicit({ context });
  if (context.options.strictPort) {
    if (!(await isPortAvailable({ port }))) {
      throw new Error(
        `Port ${port} is already in use. Stop the process using it or choose another port.`
      );
    }
    return;
  }
  const availablePort = await findAvailablePort({ port });
  if (availablePort !== port) {
    context.logger.warn(`Port ${port} is in use, using port ${availablePort} instead.`);
    context.options.port = availablePort;
  }
}

export default resolveDevPort;
