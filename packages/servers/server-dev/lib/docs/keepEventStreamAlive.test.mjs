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

import keepEventStreamAlive from './keepEventStreamAlive.js';

const encoder = new TextEncoder();
const answer = 'event: message\ndata: {"jsonrpc":"2.0","id":1,"result":{}}\n\n';

// An event stream that says nothing for a while, then answers and ends.
function slowAnswer({ delayMs }) {
  const body = new ReadableStream({
    start(controller) {
      setTimeout(() => {
        controller.enqueue(encoder.encode(answer));
        controller.close();
      }, delayMs);
    },
  });
  return new Response(body, { headers: { 'content-type': 'text/event-stream' } });
}

test('keepEventStreamAlive sends comments while a tool call is silent, then the answer', async () => {
  // The tool call answers only once the client has read two comments, so the
  // test does not depend on how promptly timers fire.
  let answerNow;
  const body = new ReadableStream({
    start(controller) {
      answerNow = () => {
        controller.enqueue(encoder.encode(answer));
        controller.close();
      };
    },
  });
  const response = keepEventStreamAlive({
    response: new Response(body, { headers: { 'content-type': 'text/event-stream' } }),
    intervalMs: 10,
  });
  expect(response.headers.get('content-type')).toEqual('text/event-stream');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const read = async () => decoder.decode((await reader.read()).value);
  expect(await read()).toEqual(': keep-alive\n\n');
  expect(await read()).toEqual(': keep-alive\n\n');
  answerNow();
  let rest = '';
  let chunk = await reader.read();
  while (!chunk.done) {
    rest += decoder.decode(chunk.value);
    chunk = await reader.read();
  }
  expect(rest.endsWith(answer)).toBe(true);
});

test('keepEventStreamAlive stops its comments when the stream ends', async () => {
  const response = keepEventStreamAlive({ response: slowAnswer({ delayMs: 0 }), intervalMs: 10 });
  const text = await response.text();
  await new Promise((resolve) => setTimeout(resolve, 50));
  expect(text).toEqual(answer);
});

test('keepEventStreamAlive leaves a JSON answer alone', () => {
  const response = new Response('{}', { headers: { 'content-type': 'application/json' } });
  expect(keepEventStreamAlive({ response })).toBe(response);
});
