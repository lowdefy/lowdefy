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

// Runs fn over every item, at most `limit` at a time. Resolves once all have settled; a failed
// item does not stop the others, and the failures are returned.
async function runLimited({ items, limit, fn }) {
  const queue = [...items];
  const failures = [];
  async function worker() {
    while (queue.length > 0) {
      const item = queue.shift();
      try {
        await fn(item);
      } catch (error) {
        failures.push({ item, error });
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, queue.length) }, () => worker()));
  return failures;
}

export default runLimited;
