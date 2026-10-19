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

// Throttled progress lines for a long harden phase: a line when `everyCount`
// units have finished or `everyMs` has passed since the last line, whichever
// comes first, and always one for the last unit. `format` turns the counts
// into the line.
function createProgress({ total, format, log, everyCount = 25, everyMs = 15000, now = Date.now }) {
  let done = 0;
  let sinceLine = 0;
  let lastAt = now();
  return function tick(detail = {}) {
    done += 1;
    sinceLine += 1;
    const time = now();
    if (done === total || sinceLine >= everyCount || time - lastAt >= everyMs) {
      sinceLine = 0;
      lastAt = time;
      log(format({ done, total, ...detail }));
    }
  };
}

export default createProgress;
