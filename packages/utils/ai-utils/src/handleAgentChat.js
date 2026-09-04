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
  convertToModelMessages,
  createAgentUIStream,
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateId,
  generateText,
  pruneMessages,
  TypeValidationError,
  validateUIMessages,
} from 'ai';

import { serializer } from '@lowdefy/helpers';

import createToolLoopAgent from './createToolLoopAgent.js';
import createUsageAccumulator from './createUsageAccumulator.js';
import handleAgentGenerate from './handleAgentGenerate.js';

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

// Drop messages that carry no parts. The AI SDK client pushes the assistant
// message on the stream's `start` chunk, before any content arrives, so a
// request that fails after that point leaves an assistant shell with
// `parts: []` in the client's history. Sent back, that shell fails UIMessage
// validation ("Message must contain at least one part") — and keeps failing on
// every later turn, so one transient error would otherwise kill the
// conversation until a reload. There is nothing in an empty message for the
// model anyway.
function dropEmptyMessages(messages) {
  return messages.filter((msg) => Array.isArray(msg.parts) && msg.parts.length > 0);
}

// What the client is told when a turn fails. TypeValidationError.message
// embeds JSON.stringify(value) — for a UIMessage validation failure that is
// the entire conversation, which the chat block then shows in a toast. The
// full error is logged server-side before this is written to the stream.
function clientErrorText(error) {
  if (TypeValidationError.isInstance(error)) {
    return 'The conversation could not be sent: a message failed validation.';
  }
  return error?.message ?? String(error);
}

// Concatenate the text parts of the first user message — used as the source
// for generateTitle.
function getFirstUserText(messages) {
  const firstUser = messages.find((msg) => msg.role === 'user');
  if (!firstUser) return '';
  return (firstUser.parts ?? [])
    .filter((part) => part.type === 'text')
    .map((part) => part.text)
    .join('');
}

async function handleAgentChat({ connection, properties, context }) {
  // Headless run-to-completion mode (CallAgent routine step) — dispatched here
  // so provider agent plugins delegate unchanged in both modes.
  if (context.mode === 'generate') {
    return handleAgentGenerate({ connection, properties, context });
  }

  const { agent, messages: rawMessages } = properties;
  const messages = dropEmptyMessages(convertDataUrlsToBase64(rawMessages));

  const { agentInstance, mcpClients, model, timeoutConfig, locale } = await createToolLoopAgent({
    connection,
    agent,
    context,
  });

  const onFinishEndpointIds = agent.hooks?.onFinish;
  const hasOnFinishHooks = onFinishEndpointIds && onFinishEndpointIds.length > 0;
  const hasMcpClients = mcpClients.length > 0;

  const pruneConfig = agent.properties.prune;

  const titleEnabled = agent.properties.generateTitle === true;

  const stream = createUIMessageStream({
    onError: clientErrorText,
    execute: async ({ writer }) => {
      const usageAccumulator = createUsageAccumulator();
      const steps = [];
      let agentStream;
      // The AI SDK delivers the full updated UI message list (input + generated
      // assistant reply) to the stream-level onFinish. Capture it so onFinish
      // hooks persist the complete conversation, not just the request input.
      let capturedMessages;

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

      function captureMessages({ messages: finalMessages }) {
        capturedMessages = finalMessages;
      }

      // Generate a short conversation title from the first user message,
      // concurrently with the agent stream. The data-chat-title part fires the
      // block's onTitleGenerated event. Only on the first turn; failures are
      // non-fatal.
      let titlePromise;
      const isFirstTurn = !messages.some((msg) => msg.role === 'assistant');
      if (titleEnabled && isFirstTurn) {
        const firstUserText = getFirstUserText(messages);
        if (firstUserText) {
          titlePromise = generateText({
            model,
            maxOutputTokens: 20,
            prompt: `Generate a concise 3-6 word title for a conversation that begins with this message. Reply with only the title, no quotes:\n\n${firstUserText}`,
          })
            .then(({ text }) => {
              const title = text.trim();
              if (title) {
                writer.write({ type: 'data-chat-title', data: { title } });
              }
            })
            .catch((error) => {
              console.warn(`generateTitle failed: ${error.message}`);
            });
        }
      }

      // One try around validation, the agent run and the read: a UIMessage that
      // fails validation throws from createAgentUIStream / validateUIMessages
      // before any stream exists, and that fault has to be logged and redacted
      // the same way as a fault mid-stream.
      try {
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
            // Without a generator the assistant message reaches onFinish with
            // id: '' — see the createAgentUIStream call below.
            generateMessageId: generateId,
            onFinish: captureMessages,
          });
        } else {
          // createAgentUIStream validates UIMessages, converts to ModelMessages,
          // runs the agent, and returns a UIMessageStream — handling the full
          // UI→model→UI conversion that ToolLoopAgent.stream() does not.
          agentStream = await createAgentUIStream({
            agent: agentInstance,
            uiMessages: messages,
            ...timeoutConfig,
            // The AI SDK only ids the assistant message it builds when the caller
            // supplies a generator: toUIMessageStream derives responseMessageId
            // only if generateMessageId != null, and handleUIMessageStreamFinish
            // then seeds the streaming state with `messageId ?? ''`, with no
            // messageId on the start chunk to override it. Without this every
            // assistant message an onFinish hook persists carries id: '', so a
            // saved transcript has them all sharing one id — and a UI that keys
            // its bubbles by message id (AgentChat does) renders the last reply in
            // every assistant bubble when the conversation is reloaded. The client
            // generates its own id while streaming, so the damage only shows up
            // after a reload.
            generateMessageId: generateId,
            onStepFinish: collectStep,
            onFinish: captureMessages,
          });
        }

        // Read the agent stream to completion before running onFinish hooks.
        // writer.merge() is fire-and-forget (returns void in the AI SDK), so we
        // manually read the stream to ensure hooks fire after the agent finishes.
        const reader = agentStream.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          writer.write(value);
        }
      } catch (error) {
        // The client only sees the (possibly redacted) error text, so the fault
        // is logged server-side before it is written to the stream.
        console.error(`Agent stream failed: ${error.message}`);
        writer.write({ type: 'error', errorText: writer.onError(error) });
      }
      // Ensure the title (if any) is written before the stream closes.
      if (titlePromise) {
        await titlePromise;
      }
      // Call onFinish hooks — awaited so dataParts can be written to stream.
      if (hasOnFinishHooks) {
        const finishPayload = {
          messages: capturedMessages ?? messages,
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
