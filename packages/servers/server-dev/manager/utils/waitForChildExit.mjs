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

function hasExited(child) {
  return child.exitCode !== null || child.signalCode !== null;
}

function waitForExit({ child, timeoutMs }) {
  if (hasExited(child)) {
    return Promise.resolve(true);
  }
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      child.off('exit', onExit);
      resolve(false);
    }, timeoutMs);
    function onExit() {
      clearTimeout(timer);
      resolve(true);
    }
    child.once('exit', onExit);
  });
}

// Waits for a signalled child to let go of its port before a new one binds
// it. The wait is bounded so a child that ignores SIGTERM, or never exits even
// after SIGKILL, cannot hang a restart or the build-status wait around it.
// Resolves true once the child has exited, false if it never did.
async function waitForChildExit({ child, timeoutMs = 10000, killTimeoutMs = 5000 }) {
  if (!child) {
    return true;
  }
  if (await waitForExit({ child, timeoutMs })) {
    return true;
  }
  child.kill('SIGKILL');
  return waitForExit({ child, timeoutMs: killTimeoutMs });
}

export default waitForChildExit;
