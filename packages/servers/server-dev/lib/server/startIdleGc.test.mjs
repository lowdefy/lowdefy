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

import startIdleGc from './startIdleGc.js';

const STARTED = Symbol.for('lowdefy.server-dev.idleGc');
const START = Date.parse('2026-10-03T10:00:00.000Z');

let clock;
let record;
let gc;

function start(options = {}) {
  startIdleGc({
    configDirectory: '/apps/tenant',
    gc,
    readInstance: () => record,
    now: () => clock,
    ...options,
  });
}

function tick(ms) {
  clock += ms;
  jest.advanceTimersByTime(ms);
}

beforeEach(() => {
  // performance is not redefinable on this Node, and nothing here reads it.
  jest.useFakeTimers({ doNotFake: ['performance'] });
  delete globalThis[STARTED];
  clock = START;
  gc = jest.fn();
  record = {
    lastActivityAt: new Date(START).toISOString(),
    activeRequests: 0,
    building: false,
  };
});

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
  delete globalThis[STARTED];
});

test('startIdleGc collects once the server has been quiet for 10 s', () => {
  start();

  tick(5000);
  expect(gc).not.toHaveBeenCalled();
  tick(5000);
  expect(gc).toHaveBeenCalledTimes(1);
  tick(60_000);
  expect(gc).toHaveBeenCalledTimes(1);
});

test('startIdleGc does not collect while a request is in flight', () => {
  record.activeRequests = 1;
  start();

  tick(60_000);

  expect(gc).not.toHaveBeenCalled();
});

test('startIdleGc does not collect while a build runs', () => {
  record.building = true;
  start();

  tick(60_000);

  expect(gc).not.toHaveBeenCalled();
});

test('startIdleGc collects again only after activity resumes', () => {
  start();
  tick(10_000);
  expect(gc).toHaveBeenCalledTimes(1);

  record = { ...record, lastActivityAt: new Date(clock).toISOString() };
  tick(5000);
  expect(gc).toHaveBeenCalledTimes(1);
  tick(5000);

  expect(gc).toHaveBeenCalledTimes(2);
});

test('startIdleGc does nothing when the instance record has no activity', () => {
  record = null;
  start();

  tick(60_000);

  expect(gc).not.toHaveBeenCalled();
});

test('startIdleGc does nothing when the child was started without gc exposed', () => {
  // The gc default is globalThis.gc, which every later test file in a jest worker has once
  // createIdleGc.test.mjs has set --expose-gc in it.
  const exposedGc = globalThis.gc;
  delete globalThis.gc;
  gc = undefined;
  try {
    start();

    expect(globalThis[STARTED]).toBeUndefined();
    expect(jest.getTimerCount()).toBe(0);
  } finally {
    if (exposedGc !== undefined) {
      globalThis.gc = exposedGc;
    }
  }
});

test('startIdleGc starts one interval however often the app entry is evaluated', () => {
  start();
  start();

  expect(jest.getTimerCount()).toBe(1);
  tick(10_000);
  expect(gc).toHaveBeenCalledTimes(1);
});
