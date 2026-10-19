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

import { StreamableHTTPError } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

// Errors raised before the dev server ran the call: the HTTP request was
// refused (a stale session after a restart, the manager proxy's 502/503 while
// the server comes back) or never reached it (fetch's network TypeError).
// An error the server answered with, or a timeout, may follow partial work.
function isConnectionError(error) {
  return error instanceof StreamableHTTPError || error instanceof TypeError;
}

// Calls a dev tool, and once more on a fresh connection when the first call
// could not reach the dev server - it restarts under a cached connection.
// Any other failure is returned as it is: repeating a call the server took
// (a journey that timed out, a tool that failed halfway) would run it twice.
async function callWithReconnect({ call, reconnect }) {
  try {
    return await call();
  } catch (error) {
    if (!isConnectionError(error)) {
      throw error;
    }
    await reconnect();
    return call();
  }
}

export default callWithReconnect;
