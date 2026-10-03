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

// An engine event no interaction caused (a mount event, an app event, a
// programmatic or off-path event) as a v1 trace record of kind engine. The
// compiler decides what each compiles to.
function buildEngineRecord({ engineEvent, session, roles }) {
  return {
    v: 1,
    session,
    t: new Date(engineEvent.startTimestamp).toISOString(),
    kind: 'engine',
    scope: engineEvent.scope,
    page_id: engineEvent.pageId,
    roles: roles ?? [],
    person: null,
    org: null,
    target: null,
    event: engineEvent.traceEvent,
  };
}

export default buildEngineRecord;
