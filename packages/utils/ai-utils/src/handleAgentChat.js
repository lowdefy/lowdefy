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

import {
  ToolLoopAgent,
  convertToModelMessages,
  createAgentUIStream,
  createUIMessageStream,
  createUIMessageStreamResponse,
  pruneMessages,
  stepCountIs,
  hasToolCall,
  validateUIMessages,
} from 'ai';

import { serializer } from '@lowdefy/helpers';

import buildAgentTools from './buildAgentTools.js';
import buildPrepareStep from './buildPrepareStep.js';
import buildUpdatePageStateTool from './buildUpdatePageStateTool.js';

function createUsageAccumulator() {
  const usage = {
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
    reasoningTokens: 0,
    cacheReadTokens: 0,
    cacheWriteTokens: 0,
  };

  let finishReason = 'stop';

  function add(stepResult) {
    const stepUsage = stepResult?.usage ?? stepResult;
    if (stepResult?.finishReason) {
      finishReason = stepResult.finishReason;
    }
    if (!stepUsage) return;
    usage.inputTokens += stepUsage.inputTokens ?? 0;
    usage.outputTokens += stepUsage.outputTokens ?? 0;
    usage.totalTokens += stepUsage.totalTokens ?? 0;
    usage.reasoningTokens += stepUsage.outputTokenDetails?.reasoningTokens ?? 0;
    usage.cacheReadTokens += stepUsage.inputTokenDetails?.cacheReadTokens ?? 0;
    usage.cacheWriteTokens += stepUsage.inputTokenDetails?.cacheWriteTokens ?? 0;
  }

  return { usage, add, getFinishReason: () => finishReason };
}

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
// onFinish is intentionally excluded — it is handled at the stream level inside the
// createUIMessageStream execute function so that hooks are awaited and can return
// dataParts to be written to the response stream.
const hookMapping = {
  onStart: 'experimental_onStart',
  onStepStart: 'experimental_onStepStart',
  onToolCallStart: 'experimental_onToolCallStart',
  onToolCallFinish: 'experimental_onToolCallFinish',
  onStepFinish: 'onStepFinish',
};

function createHookCallbacks({ hooks, callEndpoint }) {
  if (!hooks) return {};

  const callbacks = {};
  for (const [yamlKey, sdkKey] of Object.entries(hookMapping)) {
    const endpointIds = hooks[yamlKey];
    if (!endpointIds || endpointIds.length === 0) continue;

    callbacks[sdkKey] = (event) => {
      const payload = cleanHookEvent(event);
      for (const endpointId of endpointIds) {
        callEndpoint(endpointId, { payload }).catch(() => {});
      }
    };
  }
  return callbacks;
}

// Convert data: URLs in file parts to raw base64 so the AI SDK does not attempt
// to download them (it only supports http/https).  The mediaType field already
// carries the MIME type, so nothing is lost.
function convertDataUrlsToBase64(messages) {
  return messages.map((msg) => {
    if (!msg.parts) return msg;
    const converted = msg.parts.map((part) => {
      if (part.type !== 'file' || typeof part.url !== 'string' || !part.url.startsWith('data:')) {
        return part;
      }
      const commaIndex = part.url.indexOf(',');
      if (commaIndex === -1) return part;
      return { ...part, url: part.url.slice(commaIndex + 1) };
    });
    return { ...msg, parts: converted };
  });
}

async function handleAgentChat({ connection, properties, context, format }) {
  const { agent, messages: rawMessages } = properties;
  const messages = convertDataUrlsToBase64(rawMessages);

  const { tools, mcpClients } = await buildAgentTools({ agent, context });

  const sharedState = context.agentContext?.sharedState;
  const updatePageStateTool = buildUpdatePageStateTool({ sharedState });
  if (updatePageStateTool) {
    tools['update-page-state'] = updatePageStateTool;
  }

  const model = connection.provider(agent.properties.model);

  const hookCallbacks = createHookCallbacks({
    hooks: agent.hooks,
    callEndpoint: context.callEndpoint,
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

  if (format === 'text' || format === 'stream') {
    const hasMcpClients = mcpClients.length > 0;
    const result = await agentInstance.stream({
      messages: await convertToModelMessages(messages, { tools }),
      ...(hasMcpClients
        ? {
            onFinish: async () => {
              await Promise.all(mcpClients.map(({ client }) => client.close().catch(() => {})));
            },
          }
        : {}),
    });
    if (format === 'stream') {
      return { response: result.textStream };
    }
    return { response: result.toTextStreamResponse() };
  }

  const onFinishEndpointIds = agent.hooks?.onFinish;
  const hasOnFinishHooks = onFinishEndpointIds && onFinishEndpointIds.length > 0;
  const hasMcpClients = mcpClients.length > 0;

  const pruneConfig = agent.properties.prune;
  const timeoutConfig =
    agent.properties.timeout != null ? { timeout: agent.properties.timeout } : {};

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      const usageAccumulator = createUsageAccumulator();
      const steps = [];
      let agentStream;

      function collectStep(stepResult) {
        usageAccumulator.add(stepResult);
        steps.push({
          stepNumber: stepResult.stepNumber,
          text: stepResult.text,
          toolCalls: stepResult.toolCalls,
          toolResults: stepResult.toolResults,
          finishReason: stepResult.finishReason,
        });
      }

      if (pruneConfig) {
        // Decompose createAgentUIStream so we can insert pruneMessages
        // between the UIMessage→ModelMessage conversion and agent execution.
        const validatedMessages = await validateUIMessages({
          messages,
          tools: agentInstance.tools,
        });
        const modelMessages = await convertToModelMessages(validatedMessages, {
          tools: agentInstance.tools,
        });
        const prunedMessages = pruneMessages({
          messages: modelMessages,
          ...pruneConfig,
        });
        const result = await agentInstance.stream({
          prompt: prunedMessages,
          ...timeoutConfig,
          onStepFinish: collectStep,
        });
        agentStream = result.toUIMessageStream({
          originalMessages: validatedMessages,
        });
      } else {
        // createAgentUIStream validates UIMessages, converts to ModelMessages,
        // runs the agent, and returns a UIMessageStream — handling the full
        // UI→model→UI conversion that ToolLoopAgent.stream() does not.
        agentStream = await createAgentUIStream({
          agent: agentInstance,
          uiMessages: messages,
          ...timeoutConfig,
          onStepFinish: collectStep,
        });
      }

      // Read the agent stream to completion before running onFinish hooks.
      // writer.merge() is fire-and-forget (returns void in the AI SDK), so we
      // manually read the stream to ensure hooks fire after the agent finishes.
      const reader = agentStream.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          writer.write(value);
        }
      } catch (error) {
        writer.write({ type: 'error', errorText: writer.onError(error) });
      }
      // Call onFinish hooks — awaited so dataParts can be written to stream.
      if (hasOnFinishHooks) {
        const finishPayload = {
          messages,
          steps,
          toolResults: steps.flatMap((s) => s.toolResults ?? []),
          finishReason: usageAccumulator.getFinishReason(),
          isAborted: false,
          ...(context.agentContext ?? {}),
          usage: usageAccumulator.usage,
        };
        for (const endpointId of onFinishEndpointIds) {
          try {
            const hookResponse = await context.callEndpoint(endpointId, {
              payload: finishPayload,
            });
            const responseData = serializer.deserialize(hookResponse?.response);
            if (Array.isArray(responseData?.dataParts)) {
              for (const part of responseData.dataParts) {
                writer.write(part);
              }
            }
          } catch (error) {
            console.warn(`onFinish hook "${endpointId}" failed: ${error.message}`);
          }
        }
      }

      if (hasMcpClients) {
        await Promise.all(mcpClients.map(({ client }) => client.close().catch(() => {})));
      }
    },
  });

  const response = createUIMessageStreamResponse({ stream });
  return { response };
}

export default handleAgentChat;
