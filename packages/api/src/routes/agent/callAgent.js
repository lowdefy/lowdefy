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

async function callAgent(
  context,
  {
    agentId,
    pageId,
    messages,
    conversationId,
    pathParams,
    urlQuery,
    sharedState,
    sharedStateReadOnly,
  }
) {
  const { logger } = context;

  context.pageId = pageId;
  context.evaluateOperators = createEvaluateOperators(context);
  // A chat run is not cancelled when the client disconnects: it runs to its end so the
  // onFinish hooks still persist the whole conversation, bounded by the agent's timeout
  // and maxSteps. Its tool endpoints' requests are not cancelled either.
  context.signal = undefined;

  logger.debug({ event: 'debug_agent', agentId, pageId });

  const agentContext = {
    conversationId: conversationId ?? undefined,
    pageId,
    pathParams: pathParams ?? {},
    sharedState: sharedState ?? {},
    sharedStateReadOnly: sharedStateReadOnly ?? false,
    urlQuery: urlQuery ?? {},
    userId: context.user?.sub ?? context.user?.id ?? null,
  };

  const { agentConfig, connectionInstance, agentType, resolverContext } = await prepareAgent(
    context,
    { agentId, agentContext, endpointDepth: 0, mode: 'chat' }
  );

  // Call the agent resolver
  const { response } = await agentType.resolver({
    connection: connectionInstance,
    properties: { agent: agentConfig, messages },
    context: resolverContext,
  });

  return { response };
}

export default callAgent;
