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
import { type } from '@lowdefy/helpers';

// Shapes the trace an `explain: true` run collected into the object returned to
// the agent. `caller` carries exactly id, organization_id and roles - an explain
// must not become a way to dump a session. A resolver that never set
// trace.effective (a type outside the MongoDB set, or a run that failed before
// the driver call) reports effective: null with a note saying so.
function formatExplainTrace({ trace, requestType, user }) {
  const explain = {
    caller: {
      id: user?.id ?? null,
      organization_id: user?.organization_id ?? null,
      roles: user?.roles ?? [],
    },
    connection: trace.connection ?? null,
    properties: trace.properties ?? null,
    effective: type.isUndefined(trace.effective) ? null : trace.effective,
    rewritten: trace.rewritten,
  };
  if (type.isUndefined(trace.effective)) {
    explain.note = `Request type ${requestType} does not report an effective query.`;
  }
  if (!type.isUndefined(trace.stepId)) {
    return { stepId: trace.stepId, ...explain };
  }
  return explain;
}

export default formatExplainTrace;
