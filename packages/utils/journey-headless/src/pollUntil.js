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

// Reads until check(value) holds, every 50 ms, for at most `timeout` ms. Resolves the last value
// read and whether it held, so a check fails with what it last found.
async function pollUntil({ check, read, timeout }) {
  const deadline = Date.now() + timeout;
  let value = read();
  while (!check(value) && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, POLL_MS));
    value = read();
  }
  return { held: check(value), value };
}

export default pollUntil;
