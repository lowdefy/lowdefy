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

/**
 * Decides which camera reads become onScan events. A camera reports the same code many times a
 * second while it is in view: one read per code is kept, and the same code again only after
 * `repeatAfter` milliseconds. A single-scan scanner keeps only its first read.
 *
 * @param {Object} params
 * @param {boolean} params.continuous
 * @param {number} [params.repeatAfter]
 * @param {() => number} [params.now]
 * @returns {(read: { data: string, type: string }) => boolean}
 */
function createScanFilter({ continuous, repeatAfter = 2000, now = Date.now }) {
  let done = false;
  const seen = new Map();
  return function keep({ data }) {
    if (done) {
      return false;
    }
    const time = now();
    const last = seen.get(data);
    if (last !== undefined && time - last < repeatAfter) {
      return false;
    }
    seen.set(data, time);
    if (!continuous) {
      done = true;
    }
    return true;
  };
}

export default createScanFilter;
