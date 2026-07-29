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

import { convertToModelMessages, pruneMessages, validateUIMessages } from 'ai';

import convertDataUrlsToBase64 from './convertDataUrlsToBase64.js';
import createToolLoopAgent from './createToolLoopAgent.js';
import createUsageAccumulator from './createUsageAccumulator.js';
import transcribeAudioParts from './transcribeAudioParts.js';

// Streams an agent's reply as plain text - no UIMessage protocol. Used by the
// pageless agent route (format 'text' returns a text/plain Response) and by
// channels (format 'stream' returns the raw AsyncIterable<string> for
// in-process consumption). Confirm tools auto-execute: neither transport has a
// client that can resolve an approval. Title generation and hook dataParts are
// UIMessage-stream features and do not apply; onFinish hooks still run and MCP
// clients still close once the stream completes.
async function handleAgentTextStream({ connection, properties, context }) {
  const { agent, messages: rawMessages } = properties;
  // External callers and channel history send bare { role, parts } messages;
  // validateUIMessages requires an id, so index-derived ids fill the gap.
  const messages = await transcribeAudioParts({
    agent,
    messages: convertDataUrlsToBase64(rawMessages).map((msg, index) =>
      msg.id === undefined ? { ...msg, id: `msg-${index}` } : msg
    ),
    context,
  });

  const { agentInstance, mcpClients, timeoutConfig, locale } = await createToolLoopAgent({
    connection,
    agent,
    context,
    autoApprove: true,
  });

  const usageAccumulator = createUsageAccumulator();
  const steps = [];

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

  const validatedMessages = await validateUIMessages({
    messages,
    tools: agentInstance.tools,
  });
  let modelMessages = await convertToModelMessages(validatedMessages, {
    tools: agentInstance.tools,
  });
  if (agent.properties.prune) {
    modelMessages = pruneMessages({
      messages: modelMessages,
      ...agent.properties.prune,
    });
  }

  // The AI SDK does not throw during streaming - errors go to onError and
  // the stream ends cleanly. Capture and rethrow after the drain so callers
  // receive a real error instead of a silently truncated stream.
  let streamError;
  const result = await agentInstance.stream({
    prompt: modelMessages,
    ...timeoutConfig,
    onStepFinish: collectStep,
    onError: ({ error }) => {
      streamError = error;
    },
  });

  async function runOnFinish() {
    const onFinishEndpointIds = agent.hooks?.onFinish;
    if (onFinishEndpointIds && onFinishEndpointIds.length > 0) {
      let finalMessages = validatedMessages;
      try {
        const response = await result.response;
        finalMessages = response.messages;
      } catch {
        // Stream errored before completion - hooks still get the input messages.
      }
      const finishPayload = {
        messages: finalMessages,
        steps,
        toolResults: steps.flatMap((s) => s.toolResults ?? []),
        finishReason: usageAccumulator.getFinishReason(),
        isAborted: false,
        ...(context.agentContext ?? {}),
        usage: usageAccumulator.usage,
        locale,
      };
      for (const endpointId of onFinishEndpointIds) {
        try {
          await context.callEndpoint(endpointId, { payload: finishPayload });
        } catch (error) {
          console.warn(`onFinish hook "${endpointId}" failed: ${error.message}`);
        }
      }
    }
    await Promise.all(mcpClients.map(({ client }) => client.close().catch(() => {})));
  }

  // The generator owns cleanup: onFinish hooks and MCP client close run in its
  // finally block, so they fire whether the consumer drains, aborts, or errors.
  async function* streamText() {
    try {
      for await (const chunk of result.textStream) {
        yield chunk;
      }
      if (streamError) {
        throw streamError;
      }
    } finally {
      await runOnFinish();
    }
  }

  if (context.format === 'stream') {
    return { response: streamText() };
  }

  const encoder = new TextEncoder();
  const iterator = streamText();
  // Pull the first chunk before constructing the Response - errors raised
  // before any token (invalid model, provider auth) propagate to the route's
  // error handler as a real error response instead of an empty 200 stream.
  const first = await iterator.next();
  const readable = new ReadableStream({
    start(controller) {
      if (first.done) {
        controller.close();
        return;
      }
      controller.enqueue(encoder.encode(first.value));
    },
    async pull(controller) {
      const { done, value } = await iterator.next();
      if (done) {
        controller.close();
        return;
      }
      controller.enqueue(encoder.encode(value));
    },
    async cancel() {
      await iterator.return();
    },
  });
  const response = new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
  return { response };
}

export default handleAgentTextStream;
