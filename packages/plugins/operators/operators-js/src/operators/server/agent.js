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

import { getFromObject } from '@lowdefy/operators';

// Reads the agent ({ id, conversationId }) the engine put on the routine when an agent called the
// endpoint as a tool or hook. On any other call there is no agent, and every read resolves to null
// or its default, the way `_error` does outside a catch.
function _agent({ agent, arrayIndices, location, params }) {
  return getFromObject({
    arrayIndices,
    location,
    object: agent ?? null,
    operator: '_agent',
    params,
  });
}

_agent.dynamic = true;

export default _agent;
