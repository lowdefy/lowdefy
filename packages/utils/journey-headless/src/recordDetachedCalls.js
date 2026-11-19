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

// Records the detached CallApi calls a server call made (answer.detached) on `calls`, after the
// call that made them, so expect.calls counts and checks them as calls to their target endpoint,
// with the payload the step built. The test host takes a detached call instead of sending it and
// never runs its target, so a record has no answer of its own: status, success, response and
// error are null, and detached: true tells it from a call the actor made itself.
function recordDetachedCalls({ answer, calls }) {
  answer.detached.forEach(({ endpointId, payload }) => {
    calls.push({
      kind: 'endpoint',
      endpointId,
      detached: true,
      payload,
      status: null,
      success: null,
      response: null,
      error: null,
    });
  });
}

export default recordDetachedCalls;
