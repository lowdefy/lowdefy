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

import { AuthorizationError } from '@lowdefy/errors';
import { translate, type } from '@lowdefy/helpers';

import authorizeViewWrite from '../auth/view/authorizeViewWrite.js';
import readViewReach from '../auth/view/readViewReach.js';
import viewGrantCovers from '../auth/view/viewGrantCovers.js';

// A view session chats only with the agents the build listed for a view page.
// The build lists none yet, so today a view session reaches no agent. Checked
// on the id alone, before the agent is looked up, and answered as an agent the
// caller's roles refuse, so an agent that is not listed and one that does not
// exist are the same answer.
//
// This is the check of the chat route alone. An agent a listed endpoint's
// routine runs (a CallAgent step) is the app's own call and is not held to the
// list.
//
// A caller that is not a view session is never refused here.
async function authorizeViewAgent(context, { agentId }) {
  const { i18n, logger, viewSession } = context;
  if (type.isNone(viewSession)) {
    return;
  }
  const { agents } = await readViewReach(context);
  if (agents.has(agentId) && viewGrantCovers({ viewSession, scope: 'mcp:read' })) {
    // An agent run calls tools and hooks, which write, so a chat needs
    // mcp:write as a CallAgent step does.
    authorizeViewWrite(context, { subject: `agent "${agentId}"` });
    return;
  }
  logger.debug(
    { event: 'debug_view_agent_refused', agentId },
    `View session refused on agent "${agentId}": no view page it may read lists it.`
  );
  throw new AuthorizationError(
    translate({ key: 'agent.runtime.agentNotFound', values: { agentId }, i18n })
  );
}

export default authorizeViewAgent;
