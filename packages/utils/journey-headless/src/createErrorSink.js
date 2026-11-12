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

// Collects what fails while a headless page runs: the server's faults ('server'), the errors the
// client's handleError takes ('client') and the client logger's errors ('logger'). The runner's
// invariants read it after each step, as the browser runner reads the page's errors. A server
// fault carries the call it came from ({ pageId, requestId, endpointId }).
function createErrorSink() {
  const errors = [];
  return {
    errors,
    add: ({ call, error, source }) => {
      errors.push({ call, error, source });
    },
  };
}

export default createErrorSink;
