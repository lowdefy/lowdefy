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

// The real AI SDK against a mock model: how a turn the agent's own timeout stops reaches the
// client, the server log and the onFinish hooks. handleAgentChat.test.js mocks the AI SDK, so
// it can't see what the SDK writes when a timeout fires.

import { MockLanguageModelV4 } from 'ai/test';
import { serializer } from '@lowdefy/helpers';
import { expect, test, vi } from 'vitest';

import handleAgentChat from './handleAgentChat.js';

const USAGE = {
  inputTokens: { total: 10, noCache: 10, cacheRead: undefined, cacheWrite: undefined },
  outputTokens: { total: 5, text: 5, reasoning: undefined },
};

// Writes a few words, then sends nothing more until the call is aborted, as a provider that
// hangs mid-reply does.
function stallingModel() {
  let markStalled;
  const stalled = new Promise((resolve) => {
    markStalled = resolve;
  });
  const model = new MockLanguageModelV4({
    doStream: async ({ abortSignal }) => ({
      stream: new ReadableStream({
        start(controller) {
          controller.enqueue({ type: 'stream-start', warnings: [] });
          controller.enqueue({ type: 'text-start', id: 't1' });
          controller.enqueue({ type: 'text-delta', id: 't1', delta: 'The answer is ' });
          markStalled();
          abortSignal?.addEventListener(
            'abort',
            () => {
              try {
                controller.error(abortSignal.reason);
              } catch {
                // already closed
              }
            },
            { once: true }
          );
        },
      }),
    }),
  });
  return { model, stalled };
}

// Writes a short reply and finishes after a pause, so a test can close the response mid-reply.
function slowReplyingModel() {
  let markStarted;
  const started = new Promise((resolve) => {
    markStarted = resolve;
  });
  const model = new MockLanguageModelV4({
    doStream: async () => ({
      stream: new ReadableStream({
        async start(controller) {
          controller.enqueue({ type: 'stream-start', warnings: [] });
          controller.enqueue({ type: 'text-start', id: 't1' });
          controller.enqueue({ type: 'text-delta', id: 't1', delta: 'The answer ' });
          markStarted();
          await new Promise((resolve) => setTimeout(resolve, 100));
          controller.enqueue({ type: 'text-delta', id: 't1', delta: 'is 42.' });
          controller.enqueue({ type: 'text-end', id: 't1' });
          controller.enqueue({
            type: 'finish',
            finishReason: { unified: 'stop', raw: 'stop' },
            usage: USAGE,
          });
          controller.close();
        },
      }),
    }),
  });
  return { model, started };
}

function createContext() {
  const finishPayloads = [];
  let finished;
  const onFinishCalled = new Promise((resolve) => {
    finished = resolve;
  });
  const context = {
    logger: { error: vi.fn(), warn: vi.fn(), debug: vi.fn(), info: vi.fn() },
    // The wire policy prepareAgent builds: only an author's message crosses.
    wireErrorMessage: (error) =>
      error?.name === 'UserError' ? error.message : 'Something went wrong.',
    callEndpoint: vi.fn(async (endpointId, { payload }) => {
      finishPayloads.push(payload);
      finished();
      return { response: serializer.serialize({}) };
    }),
    agentContext: { pageId: 'page-1', conversationId: 'conv-1' },
    agentId: 'agent-1',
  };
  return { context, finishPayloads, onFinishCalled };
}

const USER_MESSAGES = [{ id: 'u1', role: 'user', parts: [{ type: 'text', text: 'Question?' }] }];

function runChat({ model, context, timeout }) {
  return handleAgentChat({
    connection: { provider: () => model },
    properties: {
      agent: {
        id: 'agent-1',
        agentId: 'agent-1',
        tools: [],
        properties: { model: 'mock', maxRetries: 0, timeout },
        hooks: { onFinish: ['save-answer'] },
      },
      messages: USER_MESSAGES,
    },
    context,
  });
}

// The UI message stream chunks the client reads, in order.
async function readChunks(response) {
  const text = await response.text();
  return text
    .split('\n')
    .filter((line) => line.startsWith('data: '))
    .map((line) => line.slice('data: '.length))
    .map((data) => (data === '[DONE]' ? '[DONE]' : JSON.parse(data)));
}

test('a turn the agent total timeout stops ends with an error chunk and an error log', async () => {
  const { model } = stallingModel();
  const { context } = createContext();
  const { response } = await runChat({ model, context, timeout: { totalMs: 200 } });

  const chunks = await readChunks(response);
  const types = chunks.map((chunk) => (chunk === '[DONE]' ? chunk : chunk.type));
  expect(types).toContain('text-delta');
  const errorChunk = chunks.find((chunk) => chunk.type === 'error');
  expect(errorChunk).toEqual({
    type: 'error',
    errorText: 'The answer took too long and was stopped. Try again.',
  });
  // The error comes after the text the model wrote, so the client ends the turn on it.
  expect(types.indexOf('error')).toBeGreaterThan(types.indexOf('text-delta'));

  const timeoutLog = context.logger.error.mock.calls.find(
    ([, message]) => message === 'Agent turn stopped by its timeout.'
  );
  expect(timeoutLog).toBeDefined();
  expect(timeoutLog[0]).toMatchObject({
    agentId: 'agent-1',
    conversationId: 'conv-1',
    stepCount: expect.any(Number),
  });
});

test.each([
  ['stepMs', { stepMs: 200 }],
  ['chunkMs', { chunkMs: 200 }],
  ['a number', 200],
])('a turn stopped by a %s timeout ends with the timeout error', async (_, timeout) => {
  const { model } = stallingModel();
  const { context } = createContext();
  const { response } = await runChat({ model, context, timeout });
  const chunks = await readChunks(response);
  expect(chunks.filter((chunk) => chunk.type === 'error')).toEqual([
    { type: 'error', errorText: 'The answer took too long and was stopped. Try again.' },
  ]);
});

test('onFinish is told a timed-out turn was cut off', async () => {
  const { model } = stallingModel();
  const { context, finishPayloads } = createContext();
  const { response } = await runChat({ model, context, timeout: { totalMs: 200 } });
  await readChunks(response);

  expect(finishPayloads).toHaveLength(1);
  const [payload] = finishPayloads;
  expect(payload.isAborted).toBe(true);
  expect(payload.abortReason).toBe('timeout');
  expect(payload.finishReason).not.toBe('stop');
  expect(payload.finishReason).toBe('error');
  // The fragment is still there for a hook that wants it, marked as cut off by the fields above.
  const reply = payload.messages.findLast((msg) => msg.role === 'assistant');
  expect(reply.parts.find((part) => part.type === 'text').text).toBe('The answer is ');
});

test('a client that goes away mid-reply gets no error chunk, and the turn runs to its end', async () => {
  const { model, started } = slowReplyingModel();
  const { context, finishPayloads, onFinishCalled } = createContext();
  const { response } = await runChat({ model, context, timeout: { totalMs: 5000 } });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let received = '';
  await started;
  const first = await reader.read();
  received += decoder.decode(first.value);
  await reader.cancel();

  await onFinishCalled;
  expect(received).not.toContain('"type":"error"');
  expect(context.logger.error).not.toHaveBeenCalled();
  expect(finishPayloads[0]).toMatchObject({ isAborted: false, finishReason: 'stop' });
  expect(finishPayloads[0]).not.toHaveProperty('abortReason');
  const reply = finishPayloads[0].messages.findLast((msg) => msg.role === 'assistant');
  expect(reply.parts.find((part) => part.type === 'text').text).toBe('The answer is 42.');
});
