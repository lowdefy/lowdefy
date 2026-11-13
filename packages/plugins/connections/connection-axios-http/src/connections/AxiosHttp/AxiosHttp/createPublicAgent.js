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

import { isIP } from 'node:net';

import createLookupPublicAddress from '@lowdefy/node-utils/createLookupPublicAddress.js';
import isPublicAddress from '@lowdefy/node-utils/isPublicAddress.js';

import createRefusedError from './createRefusedError.js';

// An http or https agent that opens sockets only to public addresses. Every socket axios opens,
// for the first request and every redirect, comes from the agent. A hostname is checked by the
// agent's lookup, so the address checked is the address connected to. Node skips the lookup for
// an IP literal, so a literal is checked before connecting.
function createPublicAgent({ Agent, agentOptions }) {
  const createNotPublicError = (hostname) =>
    createRefusedError(
      `AxiosHttp request to "${hostname}" was refused because it leads to an address that is not public. Set "allowInternalAddresses: true" on the connection to call a service on the same machine or network.`
    );
  const agent = new Agent({
    ...agentOptions,
    lookup: createLookupPublicAddress({ createNotPublicError }),
  });
  const createConnection = agent.createConnection;
  agent.createConnection = function createPublicConnection(options, callback) {
    if (isIP(options.host) !== 0 && !isPublicAddress(options.host)) {
      callback(createNotPublicError(options.host));
      return undefined;
    }
    return createConnection.call(this, options, callback);
  };
  return agent;
}

export default createPublicAgent;
