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

// Sets a fail gate on a data session: the next matching request throws the forced failure
// before its resolver runs (throwAtFailGate). `times` is how many matching requests fail, 1 by
// default, or 'all' for every one for the rest of the session. `fired` counts the requests it
// failed, so a gate that never fired can be reported (listUnfiredFailGates).
function addFailGate({ endpoint, message, pageId, requestId, session, times }) {
  session.failGates.push({
    requestId,
    endpoint,
    pageId,
    message,
    times: times ?? 1,
    fired: 0,
  });
}

export default addFailGate;
