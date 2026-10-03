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

// A server that stopped answering must not hold up lowdefy_dev_start.
const TOUCH_TIMEOUT_MS = 5000;

// Asking for a server is using it: the dev manager counts this request, so
// the hub does not stop a server an agent has just been told is ready. Only
// lowdefy_dev_start needs it - every other tool forwards a request of its own.
async function touchDevServer({ url, timeoutMs = TOUCH_TIMEOUT_MS }) {
  try {
    await fetch(`${url}/api/ping`, { signal: AbortSignal.timeout(timeoutMs) });
  } catch {
    // The next lowdefy_ call starts a server that has gone meanwhile.
  }
}

export default touchDevServer;
