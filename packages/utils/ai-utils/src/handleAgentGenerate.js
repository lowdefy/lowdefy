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

import createToolLoopAgent from './createToolLoopAgent.js';
import createUsageAccumulator from './createUsageAccumulator.js';

// Runs an agent headlessly to completion — no chat UI, no streaming. Used by
// the CallAgent routine step. Confirm tools auto-execute (no client exists to
// resolve an approval), update-page-state is excluded (callers pass no
// sharedState), and no conversation title is generated.
async function handleAgentGenerate({ connection, properties, context }) {
  const { agent, prompt } = properties;

  const { agentInstance, mcpClients, timeoutConfig, locale } = await createToolLoopAgent({
    connection,
    agent,
    context,
    autoApprove: true,
  });

  const usageAccumulator = createUsageAccumulator();

  let result;
  try {
    result = await agentInstance.generate({
      prompt,
      ...timeoutConfig,
      onStepFinish: (stepResult) => usageAccumulator.add(stepResult),
    });
  } finally {
    await Promise.all(mcpClients.map(({ client }) => client.close().catch(() => {})));
  }

  const toolCalls = result.steps
    .flatMap((step) => step.toolCalls ?? [])
    .map(({ toolCallId, toolName, input }) => ({ toolCallId, toolName, input }));
  const toolResults = result.steps
    .flatMap((step) => step.toolResults ?? [])
    .map(({ toolCallId, toolName, output }) => ({ toolCallId, toolName, output }));

  // JSON round-trip guards serializability — tool outputs can carry
  // non-serializable provider values, and the summary lands in _step.
  const summary = JSON.parse(
    JSON.stringify({
      text: result.text,
      finishReason: result.finishReason,
      usage: usageAccumulator.usage,
      toolCalls,
      toolResults,
    })
  );

  // Call onFinish hooks — awaited, mirroring the stream path, but any
  // dataParts returned by hook endpoints are ignored (there is no stream).
  const onFinishEndpointIds = agent.hooks?.onFinish;
  if (onFinishEndpointIds && onFinishEndpointIds.length > 0) {
    const finishPayload = {
      messages: result.response.messages,
      steps: result.steps.map(
        ({ stepNumber, text, toolCalls: calls, toolResults: results, finishReason }) => ({
          stepNumber,
          text,
          toolCalls: calls,
          toolResults: results,
          finishReason,
        })
      ),
      toolResults,
      finishReason: result.finishReason,
      isAborted: false,
      ...(context.agentContext ?? {}),
      usage: usageAccumulator.usage,
      locale,
    };
    for (const endpointId of onFinishEndpointIds) {
      try {
        await context.callEndpoint(endpointId, { payload: finishPayload });
      } catch (error) {
        context.logger.error({ err: error }, `onFinish hook "${endpointId}" failed.`);
      }
    }
  }

  return { result: summary };
}

export default handleAgentGenerate;
