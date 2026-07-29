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

import createEvaluateOperators from '../../context/createEvaluateOperators.js';
import prepareAgent from './prepareAgent.js';

// Runs an agent headlessly to completion from a single prompt - the MCP
// tools/call path. Mirrors the CallAgent routine step (handleAgentCall)
// without the routine plumbing. Authorization runs inside prepareAgent
// against the calling context's user.
async function callAgentGenerate(context, { agentId, prompt }) {
  const { logger } = context;

  context.evaluateOperators = createEvaluateOperators(context);

  logger.debug({ event: 'debug_agent_generate', agentId });

  // Headless agent context - no page, no conversation, no sharedState (which
  // also excludes the client-only update-page-state tool).
  const agentContext = {
    conversationId: null,
    pageId: null,
    sharedState: undefined,
    urlQuery: {},
    userId: context.user?.sub ?? context.user?.id ?? null,
  };

  const { agentConfig, connectionInstance, agentType, resolverContext } = await prepareAgent(
    context,
    { agentId, agentContext, endpointDepth: 0, mode: 'generate' }
  );

  const { result } = await agentType.resolver({
    connection: connectionInstance,
    properties: { agent: agentConfig, prompt },
    context: resolverContext,
  });

  return { result };
}

export default callAgentGenerate;
