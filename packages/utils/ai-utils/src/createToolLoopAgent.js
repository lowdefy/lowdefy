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

import { ToolLoopAgent, stepCountIs, hasToolCall } from 'ai';

import buildAgentTools from './buildAgentTools.js';
import buildPrepareStep from './buildPrepareStep.js';
import buildUpdatePageStateTool from './buildUpdatePageStateTool.js';

// Strip non-serializable fields from agent-level hook events before sending as payload.
// messages excluded here — the stream-level onFinish sends UIMessage[] directly.
function cleanHookEvent(event) {
  const clean = {};
  for (const [key, value] of Object.entries(event)) {
    if (key === 'abortSignal') continue;
    if (key === 'messages') continue;
    if (typeof value === 'function') continue;
    clean[key] = value;
  }
  return clean;
}

// Maps YAML hook names to AI SDK callback names and creates fire-and-forget callbacks.
// onFinish is intentionally excluded — it is handled by the callers (at the stream
// level in handleAgentChat, after generate in handleAgentGenerate) so that hooks
// are awaited.
const hookMapping = {
  onStart: 'experimental_onStart',
  onStepStart: 'experimental_onStepStart',
  onToolCallStart: 'experimental_onToolCallStart',
  onToolCallFinish: 'experimental_onToolCallFinish',
  onStepFinish: 'onStepFinish',
};

function createHookCallbacks({ callEndpoint, hooks, locale, logger }) {
  if (!hooks) return {};

  const callbacks = {};
  for (const [yamlKey, sdkKey] of Object.entries(hookMapping)) {
    const endpointIds = hooks[yamlKey];
    if (!endpointIds || endpointIds.length === 0) continue;

    callbacks[sdkKey] = (event) => {
      const payload = { ...cleanHookEvent(event), locale };
      for (const endpointId of endpointIds) {
        callEndpoint(endpointId, { payload }).catch((error) =>
          logger.warn({ err: error, endpointId }, 'Agent hook endpoint failed.')
        );
      }
    };
  }
  return callbacks;
}

// Shared agent assembly for the streaming chat path and the headless generate
// path: tools, model, hook callbacks, instructions, stop conditions, and the
// ToolLoopAgent instance.
async function createToolLoopAgent({ connection, agent, context, autoApprove = false }) {
  const { tools, mcpClients } = await buildAgentTools({ agent, context, autoApprove });

  const sharedState = context.agentContext?.sharedState;
  const updatePageStateTool = buildUpdatePageStateTool({ sharedState });
  if (updatePageStateTool) {
    tools['update-page-state'] = updatePageStateTool;
  }

  const model = connection.provider(agent.properties.model);

  const locale = context.i18n?.active;
  const hookCallbacks = createHookCallbacks({
    callEndpoint: context.callEndpoint,
    hooks: agent.hooks,
    locale,
    logger: context.logger,
  });

  // Prepend page context to instructions when pageContext is enabled
  let instructions = agent.properties.instructions;
  if (agent.properties.pageContext && context.agentContext) {
    const ctx = context.agentContext;
    const contextLines = ['<context>'];
    if (ctx.pageId) contextLines.push(`  pageId: ${ctx.pageId}`);
    if (ctx.userId) contextLines.push(`  userId: ${ctx.userId}`);
    if (ctx.conversationId) contextLines.push(`  conversationId: ${ctx.conversationId}`);
    if (ctx.urlQuery && Object.keys(ctx.urlQuery).length > 0) {
      contextLines.push(`  urlQuery: ${JSON.stringify(ctx.urlQuery)}`);
    }
    if (ctx.sharedState && Object.keys(ctx.sharedState).length > 0) {
      contextLines.push(`  sharedState: ${JSON.stringify(ctx.sharedState)}`);
    }
    contextLines.push('</context>');
    instructions = `${contextLines.join('\n')}\n\n${instructions ?? ''}`;
  }

  // Build stop conditions
  const stopConditions = [stepCountIs(agent.properties.maxSteps ?? 10)];
  const stopOnToolCall = agent.properties.stopOnToolCall;
  if (stopOnToolCall) {
    const toolNames = Array.isArray(stopOnToolCall) ? stopOnToolCall : [stopOnToolCall];
    for (const name of toolNames) {
      stopConditions.push(hasToolCall(name));
    }
  }

  const agentInstance = new ToolLoopAgent({
    model,
    instructions,
    tools,
    stopWhen: stopConditions.length === 1 ? stopConditions[0] : stopConditions,
    maxOutputTokens: agent.properties.maxOutputTokens,
    temperature: agent.properties.temperature,
    toolChoice: agent.properties.toolChoice ?? 'auto',
    providerOptions: agent.properties.providerOptions,
    activeTools: agent.properties.activeTools,
    topP: agent.properties.topP,
    topK: agent.properties.topK,
    frequencyPenalty: agent.properties.frequencyPenalty,
    presencePenalty: agent.properties.presencePenalty,
    seed: agent.properties.seed,
    stopSequences: agent.properties.stopSequences,
    maxRetries: agent.properties.maxRetries,
    ...(agent.properties.prepareStep
      ? { prepareStep: buildPrepareStep(agent.properties.prepareStep) }
      : {}),
    ...hookCallbacks,
    ...(agent.properties.repairToolCall
      ? {
          experimental_repairToolCall: async ({ toolCall }) => {
            return { ...toolCall };
          },
        }
      : {}),
  });

  const timeoutConfig =
    agent.properties.timeout != null ? { timeout: agent.properties.timeout } : {};

  return { agentInstance, mcpClients, model, timeoutConfig, locale };
}

export default createToolLoopAgent;
