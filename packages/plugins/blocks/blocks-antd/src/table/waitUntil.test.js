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

import waitUntil from './waitUntil.js';

// A hand-run timer queue in place of setTimeout, so each test decides when timers fire.
let timers;
const realSetTimeout = global.setTimeout;
const realClearTimeout = global.clearTimeout;

beforeEach(() => {
  timers = new Map();
  let nextId = 1;
  global.setTimeout = (callback, delay) => {
    const id = nextId;
    nextId += 1;
    timers.set(id, { callback, delay });
    return id;
  };
  global.clearTimeout = (id) => timers.delete(id);
});

afterEach(() => {
  global.setTimeout = realSetTimeout;
  global.clearTimeout = realClearTimeout;
});

function fireTimers() {
  const due = [...timers.entries()];
  timers.clear();
  due.forEach(([, timer]) => timer.callback());
}

function createOnDue() {
  const onDue = () => {
    onDue.calls += 1;
  };
  onDue.calls = 0;
  return onDue;
}

test('waitUntil waits for the remaining time, then calls onDue', () => {
  let time = 0;
  const onDue = createOnDue();
  waitUntil({ until: 120, now: () => time, onDue });
  expect([...timers.values()].map((timer) => timer.delay)).toEqual([120]);
  time = 120;
  fireTimers();
  expect(onDue.calls).toBe(1);
  expect(timers.size).toBe(0);
});

test('waitUntil re-arms when its timer fires before the clock reaches the time', () => {
  // The cold path: the timer fires while performance.now() still reads just under `until`.
  let time = 0;
  const onDue = createOnDue();
  waitUntil({ until: 120, now: () => time, onDue });
  time = 119.6;
  fireTimers();
  expect(onDue.calls).toBe(0);
  expect([...timers.values()].map((timer) => timer.delay)).toEqual([120 - 119.6]);
  time = 120.1;
  fireTimers();
  expect(onDue.calls).toBe(1);
});

test('waitUntil calls onDue at once when the time has passed', () => {
  const onDue = createOnDue();
  waitUntil({ until: 120, now: () => 200, onDue });
  expect(onDue.calls).toBe(1);
  expect(timers.size).toBe(0);
});

test('waitUntil cancels its timer', () => {
  const onDue = createOnDue();
  const cancel = waitUntil({ until: 120, now: () => 0, onDue });
  cancel();
  expect(timers.size).toBe(0);
  expect(onDue.calls).toBe(0);
});
