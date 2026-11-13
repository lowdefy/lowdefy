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

const POLL_MS = 50;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Calls check every 50 ms until it returns a value other than undefined, and resolves with it, or
// with undefined once `timeout` ms have passed.
async function waitUntil({ check, timeout }) {
  const deadline = Date.now() + timeout;
  for (;;) {
    const value = check();
    if (value !== undefined) {
      return value;
    }
    if (Date.now() >= deadline) {
      return undefined;
    }
    await sleep(POLL_MS);
  }
}

export { sleep };
export default waitUntil;
