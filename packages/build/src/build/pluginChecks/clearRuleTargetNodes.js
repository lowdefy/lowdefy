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

// Drops the nodes the plugin checks ran on. The counters hold the config as it
// was before buildJs replaced it with copies, so a build that keeps its context
// (the full build until it ends, a dev server's skeleton for its whole life)
// would otherwise keep both copies alive. A page build drops its context.
function clearRuleTargetNodes({ context }) {
  const { typeCounters } = context;
  [
    typeCounters.blocks,
    typeCounters.actions,
    typeCounters.requests,
    typeCounters.connections,
    typeCounters.operators.client,
    typeCounters.operators.server,
  ].forEach((counter) => counter.clearNodes());
}

export default clearRuleTargetNodes;
