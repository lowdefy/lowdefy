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

import { afterEach, expect, test, vi } from 'vitest';

import testContext from '../../test/testContext.js';

// The Wait action as @lowdefy/actions-core writes it: the engine owns the timer.
function Wait({ methods: { wait }, params }) {
  return wait({ ms: params.ms });
}

// Pending until the test releases it, so a run of an event can be held at a step that works.
function createHold() {
  const releases = [];
  function Hold() {
    return new Promise((resolve) => {
      releases.push(resolve);
    });
  }
  return { Hold, releases };
}

async function createButtonContext({ actions, onClick }) {
  const context = await testContext({
    lowdefy: { _internal: { actions } },
    pageConfig: {
      id: 'root',
      type: 'Box',
      blocks: [{ id: 'button', type: 'Button', events: { onClick } }],
    },
  });
  return context._internal.RootSlots.map.button;
}

afterEach(() => {
  vi.useRealTimers();
});

test('wait marks its event as waiting until the time the wait ends, and clears the mark after', async () => {
  const button = await createButtonContext({
    actions: { Wait },
    onClick: [{ id: 'pause', type: 'Wait', params: { ms: 60000 } }],
  });
  const event = button.Events.events.onClick;
  expect(event.waitingUntil).toBe(null);

  vi.useFakeTimers();
  const started = Date.now();
  const run = button.triggerEvent({ name: 'onClick' });
  expect(event.loading).toBe(true);
  expect(event.waitingUntil).toBe(started + 60000);

  await vi.advanceTimersByTimeAsync(59999);
  expect(event.waitingUntil).toBe(started + 60000);

  await vi.advanceTimersByTimeAsync(1);
  const res = await run;
  expect(res.success).toBe(true);
  expect(res.responses.pause).toEqual({ type: 'Wait', index: 0, response: undefined });
  expect(event.loading).toBe(false);
  expect(event.waitingUntil).toBe(null);
});

test('wait clears the mark before the next action of the event runs', async () => {
  const { Hold, releases } = createHold();
  const button = await createButtonContext({
    actions: { Hold, Wait },
    onClick: [
      { id: 'pause', type: 'Wait', params: { ms: 500 } },
      { id: 'work', type: 'Hold' },
    ],
  });
  const event = button.Events.events.onClick;

  vi.useFakeTimers();
  const run = button.triggerEvent({ name: 'onClick' });
  await vi.advanceTimersByTimeAsync(500);
  expect(releases.length).toBe(1);
  expect(event.loading).toBe(true);
  expect(event.waitingUntil).toBe(null);

  releases[0]();
  await run;
});

test('wait in an async action does not mark the event, since the chain works beside it', async () => {
  const { Hold, releases } = createHold();
  const button = await createButtonContext({
    actions: { Hold, Wait },
    onClick: [
      { id: 'pause', type: 'Wait', async: true, params: { ms: 60000 } },
      { id: 'work', type: 'Hold' },
    ],
  });
  const event = button.Events.events.onClick;

  vi.useFakeTimers();
  const run = button.triggerEvent({ name: 'onClick' });
  await vi.advanceTimersByTimeAsync(0);
  expect(releases.length).toBe(1);
  expect(event.loading).toBe(true);
  expect(event.waitingUntil).toBe(null);

  releases[0]();
  await run;
  await vi.advanceTimersByTimeAsync(60000);
  expect(event.waitingUntil).toBe(null);
});

test('a new run of an event clears the mark of a run that is still waiting', async () => {
  const { Hold, releases } = createHold();
  const button = await createButtonContext({
    actions: { Hold, Wait },
    onClick: [
      { id: 'work', type: 'Hold' },
      { id: 'pause', type: 'Wait', params: { ms: 60000 } },
    ],
  });
  const event = button.Events.events.onClick;

  vi.useFakeTimers();
  const started = Date.now();
  const first = button.triggerEvent({ name: 'onClick' });
  releases[0]();
  await vi.advanceTimersByTimeAsync(0);
  expect(event.waitingUntil).toBe(started + 60000);

  // The second run is held at its first action while the first run still sleeps.
  const second = button.triggerEvent({ name: 'onClick' });
  expect(event.loading).toBe(true);
  expect(event.waitingUntil).toBe(null);

  releases[1]();
  await vi.advanceTimersByTimeAsync(60000);
  await Promise.all([first, second]);
  expect(event.waitingUntil).toBe(null);
});
