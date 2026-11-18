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

// Records a forced failure (createForcedFailure) that reached the server's error sink, by the call
// it failed: `rid`, the request id the call's context carries and its error answer names. The
// client only ever sees the generic message, so a check reads the test's message from here
// (readForcedFailure). The sink logs no fault for it: a forced failure is never an app error.
function recordForcedFailure({ error, rid, session }) {
  session.forced.push({ rid, message: error.message });
}

export default recordForcedFailure;
