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

import waitForDevServer from './waitForDevServer.mjs';

const STEP_MS = 250;

// The child's /api/ping: refused until answerAt, then ok. Date.now is faked,
// so the wait's two-minute deadline runs on the same clock.
function stubPing({ answerAt }) {
  global.fetch = jest.fn(async () => {
    if (Date.now() >= answerAt) {
      return { ok: true };
    }
    throw new Error('connect ECONNREFUSED');
  });
}

function createContext() {
  return {
    basePath: '',
    devServer: { exitCode: null, signalCode: null },
    internalPort: 3211,
    markServerReady: jest.fn(),
  };
}

async function advance(ms) {
  for (let elapsed = 0; elapsed < ms; elapsed += STEP_MS) {
    jest.advanceTimersByTime(STEP_MS);
    await new Promise((resolve) => setImmediate(resolve));
  }
}

const originalFetch = global.fetch;

beforeEach(() => {
  jest.useFakeTimers({ doNotFake: ['performance', 'setImmediate'] });
});

afterEach(() => {
  jest.useRealTimers();
  global.fetch = originalFetch;
});

test('waitForDevServer marks the server ready when the child answers within the wait', async () => {
  stubPing({ answerAt: Date.now() + 10000 });
  const context = createContext();

  let answered;
  waitForDevServer(context).then((result) => {
    answered = result;
  });
  await advance(11000);

  expect(answered).toBe(true);
  expect(context.markServerReady).toHaveBeenCalledTimes(1);
});

test('waitForDevServer marks the server ready when the child answers after the two-minute wait', async () => {
  stubPing({ answerAt: Date.now() + 150000 });
  const context = createContext();

  let answered;
  waitForDevServer(context).then((result) => {
    answered = result;
  });
  await advance(121000);

  // The manager warns that the server did not answer, and the record stays starting.
  expect(answered).toBe(false);
  expect(context.markServerReady).not.toHaveBeenCalled();

  await advance(30000);
  expect(context.markServerReady).toHaveBeenCalledTimes(1);
});

test('waitForDevServer never marks a child ready that exits without answering', async () => {
  stubPing({ answerAt: Infinity });
  const context = createContext();

  let answered;
  waitForDevServer(context).then((result) => {
    answered = result;
  });
  await advance(121000);
  expect(answered).toBe(false);

  // A restart replaces the child: the old one exits, and the wait for it ends.
  context.devServer.signalCode = 'SIGTERM';
  await advance(1000);
  const pings = global.fetch.mock.calls.length;
  await advance(60000);

  expect(global.fetch).toHaveBeenCalledTimes(pings);
  expect(context.markServerReady).not.toHaveBeenCalled();
});
