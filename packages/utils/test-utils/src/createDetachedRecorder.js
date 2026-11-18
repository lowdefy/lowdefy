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

// The context.sendDetached of a call made by the harness. On a server a detached CallApi is sent
// over the /api/detached route, which needs CRON_SECRET, and its target runs in an invocation of
// its own. The test host has no route and no CRON_SECRET, so it takes the call here: it records
// the target's endpoint id and the payload the step built on `detached`, and never runs the
// target, as an outside service's request is recorded and never sent. The payload is copied as
// the server's serializer would carry it, so a later change to the routine's values leaves the
// record as it was sent.
function createDetachedRecorder({ detached, testApp }) {
  const { serializer } = testApp.modules.helpers;
  return function sendDetached(context, { endpointId, payload }) {
    detached.push({ endpointId, payload: serializer.copy(payload) });
  };
}

export default createDetachedRecorder;
