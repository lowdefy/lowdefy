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

import HeadlessStepError from './HeadlessStepError.js';
import pollUntil from './pollUntil.js';

// wait.request: a call to the request on the actor's page that started since the last
// interaction (the actor's calls from `since` on) and has answered, as the browser runner waits
// for one. A call the page made before the window (on open, when a click was meant to call it
// again) does not count.
async function waitForRequestCall({ actor, requestId, since, timeout }) {
  const { held } = await pollUntil({
    check: (found) => found,
    read: () =>
      actor.calls
        .slice(since)
        .some(
          (call) =>
            call.kind === 'request' &&
            call.requestId === requestId &&
            call.pageId === actor.page?.pageId
        ),
    timeout,
  });
  if (!held) {
    const expected = `request "${requestId}" to have been called since the last interaction and finished loading`;
    throw new HeadlessStepError(`Timed out after ${timeout}ms waiting for ${expected}.`, {
      actual: null,
      expected,
    });
  }
}

export default waitForRequestCall;
