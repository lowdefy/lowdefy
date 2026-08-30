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

import { Hono } from 'hono';
import { jest } from '@jest/globals';

const mockSubscribe = jest.fn();
const mockUnsubscribe = jest.fn();
jest.unstable_mockModule('../../../lib/docs/devEventBus.js', () => ({
  bootedAt: '2026-05-06T07:08:09.000Z',
  subscribe: mockSubscribe,
}));

const { default: docsEventsHandler } = await import('./events.js');

function createApp() {
  const app = new Hono();
  app.get('/lowdefy-docs/events', docsEventsHandler);
  return app;
}

// Reads SSE frames off the response body one at a time.
function createFrameReader(response) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  const nextFrame = async function nextFrame() {
    while (!buffer.includes('\n\n')) {
      const { value, done } = await reader.read();
      if (done) throw new Error('Stream closed before a full frame arrived.');
      buffer += decoder.decode(value, { stream: true });
    }
    const end = buffer.indexOf('\n\n');
    const frame = buffer.slice(0, end);
    buffer = buffer.slice(end + 2);
    const lines = frame.split('\n');
    return {
      event: lines
        .find((line) => line.startsWith('event:'))
        ?.slice('event:'.length)
        .trim(),
      data: lines
        .find((line) => line.startsWith('data:'))
        ?.slice('data:'.length)
        .trim(),
    };
  };
  // Cancelling the body is what a dropped connection does to the stream.
  nextFrame.close = () => reader.cancel();
  return nextFrame;
}

beforeEach(() => {
  mockSubscribe.mockReturnValue(mockUnsubscribe);
});

test('GET /lowdefy-docs/events opens an SSE stream whose first frame is the restart event', async () => {
  const res = await createApp().request('/lowdefy-docs/events');

  expect(res.status).toBe(200);
  expect(res.headers.get('content-type')).toContain('text/event-stream');

  const nextFrame = createFrameReader(res);
  const frame = await nextFrame();
  expect(frame.event).toBe('restart');
  const data = JSON.parse(frame.data);
  expect(data).toMatchObject({ type: 'restart', bootedAt: '2026-05-06T07:08:09.000Z' });
  expect(new Date(data.timestamp).toISOString()).toEqual(data.timestamp);
  await nextFrame.close();
});

test('a published event is written as an SSE frame named by its type', async () => {
  const res = await createApp().request('/lowdefy-docs/events');
  const nextFrame = createFrameReader(res);
  await nextFrame();

  expect(mockSubscribe).toHaveBeenCalledTimes(1);
  const [send] = mockSubscribe.mock.calls[0];
  const event = {
    type: 'build',
    timestamp: '2026-05-06T07:10:00.000Z',
    status: 'error',
    errorCount: 1,
    stale: true,
  };
  await send(event);

  const frame = await nextFrame();
  expect(frame.event).toBe('build');
  expect(JSON.parse(frame.data)).toEqual(event);
  await nextFrame.close();
});

test('a dropped connection unsubscribes from the bus', async () => {
  const res = await createApp().request('/lowdefy-docs/events');
  const nextFrame = createFrameReader(res);
  await nextFrame();
  expect(mockSubscribe).toHaveBeenCalledTimes(1);
  expect(mockUnsubscribe).not.toHaveBeenCalled();

  await nextFrame.close();

  expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
});
