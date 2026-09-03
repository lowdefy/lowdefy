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

import { ConfigError } from '@lowdefy/errors';

import runEndpoint from '../../../lib/docs/runEndpoint.js';

// Refusals, routine rejects and endpoint errors are returned as 200 data (see
// runEndpoint.js) - only malformed input (missing endpointId or a bad user,
// thrown as a ConfigError) is a 400. Anything else is a fault and propagates to
// the error handler.
//
// The raw `user` goes straight to the runner: resolveDevUser is the one place
// a name or an object becomes a caller, and its refusal (an unknown fixture
// name, a value that is neither) arrives here as the ConfigError below - so
// REST and MCP answer a bad caller identically.
async function docsRunEndpointHandler(c) {
  // Parse the body from a clone: runEndpoint builds a Lowdefy context whose
  // resolveAuthentication reads c.req.raw (headers) to resolve the caller,
  // so leave the original request body intact and read our own copy here.
  const { endpointId, payload, user, explain } = await c.req.raw.clone().json();
  try {
    const result = await runEndpoint({
      endpointId,
      payload,
      user,
      explain,
      honoContext: c,
    });
    return c.json(result);
  } catch (error) {
    if (error instanceof ConfigError) {
      return c.json({ error: error.message }, 400);
    }
    throw error;
  }
}

export default docsRunEndpointHandler;
