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

// Calls `onDue` once `now()` has reached `until`, and returns a cancel function. A timer can
// fire a little before its time as `performance.now()` reads it (the timer and the coarsened
// performance clock round differently), and a re-render then would still find the same phase, so
// nothing would ever re-render again: the check re-arms instead of calling early.
function waitUntil({ until, now, onDue }) {
  let timer = null;
  function check() {
    const remaining = until - now();
    if (remaining > 0) {
      timer = setTimeout(check, remaining);
      return;
    }
    timer = null;
    onDue();
  }
  check();
  return () => {
    if (timer !== null) clearTimeout(timer);
  };
}

export default waitUntil;
