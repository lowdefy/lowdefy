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

// Waits until every promise in `work` has settled, including any added while it waits (a background
// task can schedule another), or until `timeoutMs` passes. Returns true when the work drained.
async function drainSessionWork({ work, timeoutMs }) {
  let timer;
  const timedOut = new Promise((resolve) => {
    timer = setTimeout(() => resolve(false), timeoutMs);
  });
  async function settleAll() {
    while (work.size > 0) {
      await Promise.allSettled([...work]);
    }
    return true;
  }
  try {
    return await Promise.race([settleAll(), timedOut]);
  } finally {
    clearTimeout(timer);
  }
}

export default drainSessionWork;
