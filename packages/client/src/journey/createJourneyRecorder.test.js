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

import createJourneyRecorder from './createJourneyRecorder.js';

function testWindow() {
  const store = {};
  const sendBeacon = jest.fn(() => true);
  return {
    addEventListener: () => undefined,
    Blob: class Blob {},
    clearTimeout: (id) => clearTimeout(id),
    crypto: { randomUUID: () => 'uuid-1' },
    fetch: jest.fn(),
    location: { href: 'https://app.test/orders' },
    navigator: { sendBeacon },
    sessionStorage: {
      getItem: (key) => store[key] ?? null,
      setItem: (key, value) => {
        store[key] = value;
      },
    },
    setTimeout: (fn, ms) => setTimeout(fn, ms),
  };
}

const context = { pageId: 'orders', requests: {}, state: { a: 'x' } };
const record = {
  blockId: 'button',
  bounced: false,
  endTimestamp: new Date('2026-09-04T10:00:00.000Z'),
  event: { value: 'typed' },
  eventName: 'onClick',
  responses: {},
  success: true,
};

function sentEvents(window) {
  return window.navigator.sendBeacon.mock.calls.flatMap(([, blob]) => JSON.parse(blob.body).events);
}

// The sender builds a Blob; capture what went into it.
function captureWindow() {
  const window = testWindow();
  window.Blob = class Blob {
    constructor([body]) {
      this.body = body;
    }
  };
  return window;
}

test('createJourneyRecorder beacons the batch to /api/journey under the app basePath once it fills', () => {
  const window = captureWindow();
  const recordJourneyEvent = createJourneyRecorder({
    basePath: '/my-app',
    config: { sample_rate: 1 },
    window,
  });

  for (let index = 0; index < 20; index += 1) {
    recordJourneyEvent({ actions: [], context, record, stateBefore: {} });
  }

  expect(window.navigator.sendBeacon).toHaveBeenCalledTimes(1);
  expect(window.navigator.sendBeacon.mock.calls[0][0]).toBe('/my-app/api/journey');
  const events = sentEvents(window);
  expect(events).toHaveLength(20);
  expect(events[0]).toMatchObject({
    block_id: 'button',
    event_name: 'onClick',
    page_id: 'orders',
    session_id: 'uuid-1',
    success: true,
    url_after: 'https://app.test/orders',
  });
});

test('createJourneyRecorder returns undefined when journeys are disabled', () => {
  expect(
    createJourneyRecorder({ config: { enabled: false }, window: testWindow() })
  ).toBeUndefined();
});

test('createJourneyRecorder returns undefined for the e2e stage', () => {
  expect(
    createJourneyRecorder({ config: { sample_rate: 1 }, stage: 'e2e', window: testWindow() })
  ).toBeUndefined();
});

test('createJourneyRecorder returns undefined when the session is not sampled', () => {
  const random = jest.spyOn(Math, 'random').mockReturnValue(0.9);
  expect(
    createJourneyRecorder({ config: { sample_rate: 0.05 }, window: testWindow() })
  ).toBeUndefined();
  random.mockRestore();
});

test('createJourneyRecorder records every session in dev whatever the configured rate', () => {
  const random = jest.spyOn(Math, 'random').mockReturnValue(0.99);
  expect(
    createJourneyRecorder({ config: { sample_rate: 0 }, stage: 'dev', window: testWindow() })
  ).toBeInstanceOf(Function);
  random.mockRestore();
});

test('createJourneyRecorder reuses the stored session id and its verdict for the tab', () => {
  const window = testWindow();
  createJourneyRecorder({ config: { sample_rate: 1 }, window });
  expect(JSON.parse(window.sessionStorage.getItem('lowdefy_journey_session'))).toEqual({
    sampled: true,
    session_id: 'uuid-1',
  });

  const random = jest.spyOn(Math, 'random').mockReturnValue(0.99);
  expect(createJourneyRecorder({ config: { sample_rate: 0.01 }, window })).toBeInstanceOf(Function);
  random.mockRestore();
});

test('createJourneyRecorder drops a bounced event and gives each context its own page_instance', () => {
  const window = captureWindow();
  const recordJourneyEvent = createJourneyRecorder({ config: { sample_rate: 1 }, window });
  const otherContext = { pageId: 'orders', requests: {}, state: {} };

  recordJourneyEvent({
    actions: [],
    context,
    record: { ...record, bounced: true },
    stateBefore: {},
  });
  for (let index = 0; index < 10; index += 1) {
    recordJourneyEvent({ actions: [], context, record, stateBefore: {} });
  }
  for (let index = 0; index < 10; index += 1) {
    recordJourneyEvent({ actions: [], context: otherContext, record, stateBefore: {} });
  }

  const events = sentEvents(window);
  expect(events).toHaveLength(20);
  expect(new Set(events.map(({ page_instance }) => page_instance))).toEqual(
    new Set(['uuid-1:1', 'uuid-1:2'])
  );
});

test('createJourneyRecorder omits payload and values outside dev, and carries them in dev', () => {
  const prodWindow = captureWindow();
  const prodRecorder = createJourneyRecorder({ config: { sample_rate: 1 }, window: prodWindow });
  for (let index = 0; index < 20; index += 1) {
    prodRecorder({ actions: [], context, record, stateBefore: {} });
  }
  const prodEvent = sentEvents(prodWindow)[0];
  expect(prodEvent.payload).toBeUndefined();
  expect(prodEvent.state_writes).toEqual([{ path: 'a', type: 'string' }]);

  const devWindow = captureWindow();
  const devRecorder = createJourneyRecorder({ config: {}, stage: 'dev', window: devWindow });
  for (let index = 0; index < 20; index += 1) {
    devRecorder({ actions: [], context, record, stateBefore: {} });
  }
  const devEvent = sentEvents(devWindow)[0];
  expect(devEvent.payload).toEqual({ value: 'typed' });
  expect(devEvent.state_writes).toEqual([{ path: 'a', type: 'string', value: 'x' }]);
});
