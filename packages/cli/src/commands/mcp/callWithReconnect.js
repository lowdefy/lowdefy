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

import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';

// Calls a dev tool, and once more on a fresh connection when the first call
// fails: the dev server restarts under a cached connection. A call that timed
// out is not repeated - the server took it and ran out of time (a long
// journey), and running it again would only double the wait.
async function callWithReconnect({ call, reconnect }) {
  try {
    return await call();
  } catch (error) {
    if (error instanceof McpError && error.code === ErrorCode.RequestTimeout) {
      throw error;
    }
    await reconnect();
    return call();
  }
}

export default callWithReconnect;
