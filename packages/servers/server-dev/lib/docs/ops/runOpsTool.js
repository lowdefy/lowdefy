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

import createOpsSink from './createOpsSink.js';
import recordOpsQuery from './recordOpsQuery.js';

// One door for the four ops tools: access control, then the audit line, then
// the tool's own body. A refusal is data, not a throw — it carries
// howToEnable so an agent that meets the closed door learns what the
// developer has to do, the isWriteRequestsAllowed pattern.
async function runOpsTool({ origin, tool, params, run }) {
  const sink = createOpsSink({ origin });
  const allowed = sink.refused !== true;
  recordOpsQuery({ tool, params, allowed, reason: sink.reason });
  if (!allowed) {
    return { refused: true, reason: sink.reason, howToEnable: sink.howToEnable };
  }
  return run({ adapter: sink.adapter });
}

export default runOpsTool;
