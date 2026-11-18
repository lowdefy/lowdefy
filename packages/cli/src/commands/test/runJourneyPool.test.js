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

import { expect, test } from 'vitest';

import runJourneyPool from './runJourneyPool.js';

function entry({ name, data = 'base', serial, file = `${name}.yaml` }) {
  return {
    item: { filePath: file, journey: { name, pageId: 'form', data, serial, steps: [] } },
    usage: { tier: null },
  };
}

// A run function whose journeys finish when the test says so, recording what was in flight
// whenever one started.
function controlledRun() {
  const pending = new Map();
  const started = [];
  const inFlightAtStart = [];
  let inFlight = 0;
  let maxInFlight = 0;
  async function run({ item }) {
    const name = item.journey.name;
    inFlight += 1;
    maxInFlight = Math.max(maxInFlight, inFlight);
    started.push(name);
    inFlightAtStart.push({ name, inFlight });
    const result = await new Promise((resolve) => pending.set(name, resolve));
    inFlight -= 1;
    return result;
  }
  async function finish(name, { passed = true } = {}) {
    while (!pending.has(name)) {
      await new Promise((resolve) => setImmediate(resolve));
    }
    const resolve = pending.get(name);
    pending.delete(name);
    resolve({ name, passed, class: passed ? 'PASS' : 'FAIL' });
    await new Promise((resolve) => setImmediate(resolve));
  }
  return {
    run,
    finish,
    started,
    inFlightAtStart,
    get maxInFlight() {
      return maxInFlight;
    },
  };
}

test('runJourneyPool never has more than the limit in flight', async () => {
  const runner = controlledRun();
  const entries = ['a', 'b', 'c', 'd', 'e'].map((name) => entry({ name }));
  const pool = runJourneyPool({ entries, readLimit: () => 2, run: runner.run });
  await runner.finish('a');
  await runner.finish('c');
  await runner.finish('b');
  await runner.finish('e');
  await runner.finish('d');
  await pool;
  expect(runner.maxInFlight).toBe(2);
  expect(runner.started).toEqual(['a', 'b', 'c', 'd', 'e']);
});

test('runJourneyPool returns results in selection order whatever order they finish in', async () => {
  const runner = controlledRun();
  const entries = ['a', 'b', 'c'].map((name) => entry({ name }));
  const pool = runJourneyPool({ entries, readLimit: () => 3, run: runner.run });
  await runner.finish('c');
  await runner.finish('a');
  await runner.finish('b');
  const results = await pool;
  expect(results.map((result) => result.name)).toEqual(['a', 'b', 'c']);
});

test('runJourneyPool runs journeys with no data, serial ones and a repeated file#name alone, after the rest', async () => {
  const runner = controlledRun();
  const entries = [
    entry({ name: 'no data', data: null }),
    entry({ name: 'a' }),
    entry({ name: 'serial', serial: true }),
    entry({ name: 'b' }),
    entry({ name: 'a', file: 'a.yaml' }),
  ];
  const pool = runJourneyPool({ entries, readLimit: () => 3, run: runner.run });
  await runner.finish('a');
  await runner.finish('b');
  await runner.finish('no data');
  await runner.finish('serial');
  await runner.finish('a');
  const results = await pool;
  expect(runner.started).toEqual(['a', 'b', 'no data', 'serial', 'a']);
  expect(runner.inFlightAtStart.slice(2)).toEqual([
    { name: 'no data', inFlight: 1 },
    { name: 'serial', inFlight: 1 },
    { name: 'a', inFlight: 1 },
  ]);
  expect(results.map((result) => result.name)).toEqual(['no data', 'a', 'serial', 'b', 'a']);
});

test('runJourneyPool starts no second journey once the limit drops to 1 mid-run', async () => {
  const runner = controlledRun();
  const entries = ['a', 'b', 'c', 'd'].map((name) => entry({ name }));
  let limit = 2;
  const pool = runJourneyPool({ entries, readLimit: () => limit, run: runner.run });
  await new Promise((resolve) => setImmediate(resolve));
  expect(runner.started).toEqual(['a', 'b']);
  limit = 1;
  await runner.finish('a');
  // b is still in flight, so c waits.
  expect(runner.started).toEqual(['a', 'b']);
  await runner.finish('b');
  expect(runner.started).toEqual(['a', 'b', 'c']);
  await runner.finish('c');
  await runner.finish('d');
  await pool;
  expect(runner.inFlightAtStart.slice(2)).toEqual([
    { name: 'c', inFlight: 1 },
    { name: 'd', inFlight: 1 },
  ]);
});

test('runJourneyPool fails the item whose run throws and runs the rest', async () => {
  const entries = ['a', 'b', 'c'].map((name) => entry({ name }));
  const results = await runJourneyPool({
    entries,
    readLimit: () => 2,
    run: async ({ item }) => {
      if (item.journey.name === 'b') {
        throw new Error('socket closed');
      }
      return { name: item.journey.name, passed: true, class: 'PASS' };
    },
  });
  expect(results.map((result) => [result.name, result.class])).toEqual([
    ['a', 'PASS'],
    ['b', 'FAIL'],
    ['c', 'PASS'],
  ]);
  expect(results[1]).toMatchObject({
    passed: false,
    filePath: 'b.yaml',
    message: 'The journey run failed with an error: socket closed',
    failures: [
      { run: 1, step: null, message: 'The journey run failed with an error: socket closed' },
    ],
    usage: { tier: null },
  });
});

test('runJourneyPool calls onFinished as each journey finishes and onReported in run order', async () => {
  const runner = controlledRun();
  const entries = [
    entry({ name: 'alone', data: null }),
    entry({ name: 'a' }),
    entry({ name: 'b' }),
  ];
  const finished = [];
  const reported = [];
  const pool = runJourneyPool({
    entries,
    readLimit: () => 2,
    run: runner.run,
    onFinished: ({ result, done, total }) => finished.push([result.name, done, total]),
    onReported: ({ result }) => reported.push(result.name),
  });
  await runner.finish('b');
  // b finished, but a is before it in run order.
  expect(reported).toEqual([]);
  await runner.finish('a');
  // The alone journey, first in the selection, did not hold the others back.
  expect(reported).toEqual(['a', 'b']);
  await runner.finish('alone');
  await pool;
  expect(finished).toEqual([
    ['b', 1, 3],
    ['a', 2, 3],
    ['alone', 3, 3],
  ]);
  expect(reported).toEqual(['a', 'b', 'alone']);
});

test('runJourneyPool waits for the journeys in flight when a callback throws, starts no more, then throws', async () => {
  const runner = controlledRun();
  const entries = ['a', 'b', 'c', 'alone'].map((name) =>
    entry({ name, data: name === 'alone' ? null : 'base' })
  );
  let settled = false;
  const pool = runJourneyPool({
    entries,
    readLimit: () => 2,
    run: runner.run,
    onReported: ({ result }) => {
      if (result.name === 'a') throw new Error('format failed');
    },
  }).finally(() => {
    settled = true;
  });
  const rejected = expect(pool).rejects.toThrow('format failed');
  await runner.finish('a');
  // b is still in flight, so the pool has not ended.
  expect(settled).toBe(false);
  await runner.finish('b');
  await rejected;
  expect(runner.started).toEqual(['a', 'b']);
});
