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

import createJourneyBatcher from './createJourneyBatcher.js';

function testWindow() {
  const listeners = {};
  return {
    addEventListener: (name, handler) => {
      listeners[name] = handler;
    },
    clearTimeout: (id) => clearTimeout(id),
    fire: (name) => listeners[name](),
    setTimeout: (fn, ms) => setTimeout(fn, ms),
  };
}

const event = (n) => ({ block_id: `b${n}`, event_name: 'onClick' });

test('createJourneyBatcher flushes when the batch reaches maxEvents', () => {
  const send = jest.fn();
  const window = testWindow();
  const batcher = createJourneyBatcher({ maxEvents: 3, send, window });

  batcher.add(event(1));
  batcher.add(event(2));
  expect(send).not.toHaveBeenCalled();
  batcher.add(event(3));
  expect(send).toHaveBeenCalledTimes(1);
  expect(send.mock.calls[0][0]).toHaveLength(3);
});

test('createJourneyBatcher flushes after flushMs when the batch never fills', async () => {
  const send = jest.fn();
  const window = testWindow();
  const batcher = createJourneyBatcher({ flushMs: 20, send, window });

  batcher.add(event(1));
  expect(send).not.toHaveBeenCalled();
  await new Promise((resolve) => setTimeout(resolve, 40));
  expect(send).toHaveBeenCalledTimes(1);
});

test('createJourneyBatcher flushes on pagehide', () => {
  const send = jest.fn();
  const window = testWindow();
  const batcher = createJourneyBatcher({ send, window });

  batcher.add(event(1));
  window.fire('pagehide');
  expect(send).toHaveBeenCalledTimes(1);
  window.fire('pagehide');
  expect(send).toHaveBeenCalledTimes(1);
});

test('createJourneyBatcher chunks a flush to maxBytes so sendBeacon is never handed an oversized body', () => {
  const send = jest.fn();
  const window = testWindow();
  const batcher = createJourneyBatcher({ maxBytes: 120, maxEvents: 100, send, window });

  for (let index = 0; index < 6; index += 1) {
    batcher.add({ block_id: `block_${index}`, note: 'x'.repeat(40) });
  }
  batcher.flush();

  expect(send.mock.calls.length).toBeGreaterThan(1);
  send.mock.calls.forEach(([chunk]) => {
    expect(JSON.stringify(chunk).length).toBeLessThanOrEqual(160);
  });
  expect(send.mock.calls.flatMap(([chunk]) => chunk)).toHaveLength(6);
});
