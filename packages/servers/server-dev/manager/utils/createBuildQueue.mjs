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

// Watchers, restarts and plugin installs each start config builds, and an edit
// that feeds only endpoints starts an endpoint build. Each reads or writes the
// build directory and the key prefix the last config build left, so a build
// waits for the one before it.
function createBuildQueue() {
  let previous = Promise.resolve();
  return function enqueue(task) {
    const next = previous.then(task);
    // Settles when the build does, without its result. The queue lives as long
    // as the manager, so a promise that resolved to the result kept the whole
    // config the last build resolved in memory.
    previous = next.then(
      () => {},
      () => {}
    );
    return next;
  };
}

export default createBuildQueue;
