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

import { ConfigError } from '@lowdefy/errors';
import { type } from '@lowdefy/helpers';

import addStepResult from './addStepResult.js';
import prepareAgent from '../agent/prepareAgent.js';

async function handleAgentCall(context, routineContext, { step }) {
  const { logger, evaluateOperators } = context;

  logger.debug({
    event: 'debug_start_agent_call',
    step,
  });

  // Evaluate operators in step.properties (resolves agentId, prompt)
  const evaluatedProperties = evaluateOperators({
    input: step.properties,
    items: routineContext.items,
    location: step.stepId,
    payload: routineContext.payload,
    state: routineContext.state,
    steps: routineContext.steps,
  });

  const { agentId, prompt } = evaluatedProperties;
  if (!type.isString(agentId)) {
    throw new ConfigError(
      `CallAgent step "${step.stepId}" properties.agentId must evaluate to a string. Received ${JSON.stringify(agentId)}.`,
      { configKey: step['~k'] }
    );
  }
  if (!type.isString(prompt)) {
    throw new ConfigError(
      `CallAgent step "${step.stepId}" properties.prompt must evaluate to a string. Received ${JSON.stringify(prompt)}.`,
      { configKey: step['~k'] }
    );
  }

  // Headless agent context — no page, no conversation, no sharedState (which
  // also excludes the client-only update-page-state tool). userId is null
  // under scheduled (system) context.
  const agentContext = {
    conversationId: null,
    pageId: null,
    sharedState: undefined,
    urlQuery: {},
    userId: context.user?.sub ?? context.user?.id ?? null,
  };

  const { agentConfig, connectionInstance, agentType, resolverContext } = await prepareAgent(
    context,
    {
      agentId,
      agentContext,
      endpointDepth: routineContext.endpointDepth,
      mode: 'generate',
    }
  );

  const { result } = await agentType.resolver({
    connection: connectionInstance,
    properties: { agent: agentConfig, prompt },
    context: resolverContext,
  });

  addStepResult(context, routineContext, {
    result,
    stepId: step.stepId,
  });

  logger.debug({
    event: 'debug_end_agent_call',
    stepId: step.stepId,
    targetAgentId: agentId,
    finishReason: result?.finishReason,
  });

  return { status: 'continue' };
}

export default handleAgentCall;
