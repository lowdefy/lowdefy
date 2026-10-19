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

import { jest } from '@jest/globals';
import { readUIMessageStream } from 'ai';

import createAgentTransport from './createAgentTransport.js';

function sse(chunks) {
  const encoder = new TextEncoder();
  // One event per network read, as a phone receives a stream.
  const body = new ReadableStream({
    start(controller) {
      chunks.forEach((chunk) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`))
      );
      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    },
  });
  return new Response(body, { headers: { 'content-type': 'text/event-stream' } });
}

function setup({ answer = [], sharedState = null, sharedStateReadOnly = false, ...rest } = {}) {
  const streamFetch = jest.fn(async () => sse(answer));
  const onRequest = jest.fn();
  const transport = createAgentTransport({
    agentId: 'support/assistant',
    conversationId: 'acme_1 2',
    onRequest,
    pageId: 'atlas',
    sharedStateRef: { current: sharedState },
    sharedStateReadOnlyRef: { current: sharedStateReadOnly },
    streamFetch,
    ...rest,
  });
  return { onRequest, streamFetch, transport };
}

const userMessage = { id: 'u1', role: 'user', parts: [{ type: 'text', text: 'Hi' }] };

async function send(transport) {
  return transport.sendMessages({
    abortSignal: undefined,
    chatId: 'acme_1 2',
    messageId: undefined,
    messages: [userMessage],
    trigger: 'submit-message',
  });
}

async function collect(stream) {
  const states = [];
  for await (const message of readUIMessageStream({ stream })) {
    states.push(structuredClone(message));
  }
  return states;
}

test('the transport posts to the agent route with the module agent id as one segment', async () => {
  const { streamFetch, transport } = setup();
  await collect(await send(transport));
  const [path, init] = streamFetch.mock.calls[0];
  expect(path).toEqual('/api/agent/atlas/support%2Fassistant?conversationId=acme_1%202');
  expect(init.method).toEqual('POST');
  expect(init.credentials).toEqual('omit');
  expect(JSON.parse(init.body).messages).toEqual([userMessage]);
});

test('the transport sends the url query, path params and shared state of the moment', async () => {
  const sharedStateRef = { current: { space: 'ACME' } };
  const { streamFetch, transport } = setup({
    pathParams: { ref: 'ACME-1' },
    sharedStateRef,
    urlQuery: { tab: 'questions' },
  });
  await collect(await send(transport));
  sharedStateRef.current = { space: 'OPS' };
  await collect(await send(transport));
  const bodies = streamFetch.mock.calls.map(([, init]) => JSON.parse(init.body));
  expect(bodies[0]).toMatchObject({
    pathParams: { ref: 'ACME-1' },
    sharedState: { space: 'ACME' },
    urlQuery: { tab: 'questions' },
  });
  expect(bodies[0].sharedStateReadOnly).toBeUndefined();
  expect(bodies[1].sharedState).toEqual({ space: 'OPS' });
});

test('the transport marks read-only shared state and leaves out what is not set', async () => {
  const { streamFetch, transport } = setup({
    sharedState: { now: 'today' },
    sharedStateReadOnly: true,
  });
  await collect(await send(transport));
  const body = JSON.parse(streamFetch.mock.calls[0][1].body);
  expect(body.sharedStateReadOnly).toBe(true);
  expect(body.urlQuery).toBeUndefined();
  expect(body.pathParams).toBeUndefined();
});

test('the transport tells onRequest of each request with the messages it sends', async () => {
  const { onRequest, transport } = setup();
  await collect(await send(transport));
  expect(onRequest).toHaveBeenCalledWith({ messages: [userMessage], trigger: 'submit-message' });
});

test('the streamed answer parses into a message whose text, reasoning and tool call grow as events arrive', async () => {
  const { transport } = setup({
    answer: [
      { type: 'start', messageId: 'a1' },
      { type: 'start-step' },
      { type: 'reasoning-start', id: 'r1' },
      { type: 'reasoning-delta', id: 'r1', delta: 'Look it up.' },
      { type: 'reasoning-end', id: 'r1' },
      { type: 'tool-input-start', toolCallId: 'c1', toolName: 'search' },
      { type: 'tool-input-delta', toolCallId: 'c1', inputTextDelta: '{"q":"pay' },
      { type: 'tool-input-delta', toolCallId: 'c1', inputTextDelta: 'roll"}' },
      {
        type: 'tool-input-available',
        toolCallId: 'c1',
        toolName: 'search',
        input: { q: 'payroll' },
      },
      { type: 'tool-output-available', toolCallId: 'c1', output: { hits: 2 } },
      { type: 'finish-step' },
      { type: 'start-step' },
      { type: 'text-start', id: 't1' },
      { type: 'text-delta', id: 't1', delta: 'Two ' },
      { type: 'text-delta', id: 't1', delta: 'hits.' },
      { type: 'text-end', id: 't1' },
      { type: 'finish-step' },
      { type: 'finish' },
    ],
  });
  const states = await collect(await send(transport));
  // The tool's input is read as it streams, partial JSON and all.
  const streamedInputs = states
    .map((state) => state.parts.find((part) => part.type === 'tool-search'))
    .filter((part) => part?.state === 'input-streaming')
    .map((part) => part.input);
  expect(streamedInputs).toContainEqual({ q: 'pay' });
  expect(states.some((state) => state.parts.some((part) => part.text === 'Two '))).toBe(true);
  const last = states[states.length - 1];
  expect(last.id).toEqual('a1');
  expect(last.parts).toEqual([
    { type: 'step-start' },
    expect.objectContaining({ type: 'reasoning', text: 'Look it up.', state: 'done' }),
    expect.objectContaining({
      type: 'tool-search',
      toolCallId: 'c1',
      state: 'output-available',
      input: { q: 'payroll' },
      output: { hits: 2 },
    }),
    { type: 'step-start' },
    expect.objectContaining({ type: 'text', text: 'Two hits.', state: 'done' }),
  ]);
});

test('the transport raises the server error of a refused chat', async () => {
  const { streamFetch, transport } = setup();
  streamFetch.mockImplementation(
    async () => new Response('Authentication required.', { status: 401 })
  );
  await expect(send(transport)).rejects.toThrow('Authentication required.');
});
