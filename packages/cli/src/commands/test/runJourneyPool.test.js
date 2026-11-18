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
  const options = [];
  async function run({ item }, runOptions) {
    const name = item.journey.name;
    inFlight += 1;
    maxInFlight = Math.max(maxInFlight, inFlight);
    started.push(name);
    inFlightAtStart.push({ name, inFlight });
    options.push({ name, ...runOptions });
    const result = await new Promise((resolve) => pending.set(name, resolve));
    inFlight -= 1;
    return result;
  }
  async function finish(name, { passed = true, ...fields } = {}) {
    while (!pending.has(name)) {
      await new Promise((resolve) => setImmediate(resolve));
    }
    const resolve = pending.get(name);
    pending.delete(name);
    resolve({ name, passed, class: passed ? 'PASS' : 'FAIL', ...fields });
    await new Promise((resolve) => setImmediate(resolve));
  }
  return {
    run,
    finish,
    started,
    inFlightAtStart,
    options,
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

function pageOpenTimeout() {
  return {
    passed: false,
    message: 'The page did not open in 30000ms.',
    recorded: { run: 'run-1', passed: false },
  };
}

test('runJourneyPool reruns a contended failure alone, reports it PASS with the first failure kept, and drops the limit', async () => {
  const runner = controlledRun();
  const entries = ['a', 'b', 'c', 'd'].map((name) => entry({ name }));
  const pool = runJourneyPool({ entries, readLimit: () => 2, run: runner.run });
  await runner.finish('a', pageOpenTimeout());
  await runner.finish('b');
  // a reran alone, with b finished and nothing else started.
  expect(runner.started).toEqual(['a', 'b', 'a']);
  await runner.finish('a');
  await runner.finish('c');
  await runner.finish('d');
  const results = await pool;
  expect(results[0]).toEqual({
    name: 'a',
    passed: true,
    class: 'PASS',
    contended: true,
    contendedFailure: { message: 'The page did not open in 30000ms.' },
    recorded: { run: 'run-1', passed: false },
  });
  // The limit dropped from 2 to 1, so c and d ran one at a time.
  expect(runner.inFlightAtStart.slice(3)).toEqual([
    { name: 'c', inFlight: 1 },
    { name: 'd', inFlight: 1 },
  ]);
});

test("runJourneyPool keeps the first attempt's step failure on a contended PASS", async () => {
  const runner = controlledRun();
  const entries = ['a', 'b'].map((name) => entry({ name }));
  const failure = { index: 2, step: { click: 'save' }, message: 'save is disabled' };
  const pool = runJourneyPool({ entries, readLimit: () => 2, run: runner.run });
  await runner.finish('a', { passed: false, failure, message: 'save is disabled' });
  await runner.finish('b');
  await runner.finish('a');
  const results = await pool;
  expect(results[0].contendedFailure).toEqual({ failure, message: 'save is disabled' });
});

test("runJourneyPool reports a contended failure that fails alone as the alone run's FAIL and keeps the limit", async () => {
  const runner = controlledRun();
  const entries = ['a', 'b', 'c', 'd'].map((name) => entry({ name }));
  const pool = runJourneyPool({ entries, readLimit: () => 2, run: runner.run });
  await runner.finish('a', pageOpenTimeout());
  await runner.finish('b');
  await runner.finish('a', { passed: false, message: 'refund is hidden' });
  await runner.finish('c');
  await runner.finish('d');
  const results = await pool;
  expect(results[0]).toEqual({
    name: 'a',
    passed: false,
    class: 'FAIL',
    message: 'refund is hidden',
    recorded: { run: 'run-1', passed: false },
  });
  expect(results[0].contended).toBeUndefined();
  // The limit stayed at 2.
  expect(runner.maxInFlight).toBe(2);
  expect(runner.inFlightAtStart.find(({ name }) => name === 'd').inFlight).toBe(2);
});

test('runJourneyPool reports a failure with nothing else in flight at once, with no rerun', async () => {
  const runner = controlledRun();
  const entries = [entry({ name: 'a' }), entry({ name: 'alone', data: null })];
  const pool = runJourneyPool({ entries, readLimit: () => 2, run: runner.run });
  await runner.finish('a');
  await runner.finish('alone', { passed: false, message: 'refund is hidden' });
  const results = await pool;
  expect(runner.started).toEqual(['a', 'alone']);
  expect(results[1]).toEqual({
    name: 'alone',
    passed: false,
    class: 'FAIL',
    message: 'refund is hidden',
  });
});

test('runJourneyPool does not rerun a failure that ran before any other journey started', async () => {
  const runner = controlledRun();
  const entries = ['a', 'b'].map((name) => entry({ name }));
  let limit = 1;
  const pool = runJourneyPool({ entries, readLimit: () => limit, run: runner.run });
  await new Promise((resolve) => setImmediate(resolve));
  limit = 2;
  await runner.finish('a', { passed: false, message: 'refund is hidden' });
  await runner.finish('b');
  const results = await pool;
  expect(runner.started).toEqual(['a', 'b']);
  expect(results[0].class).toBe('FAIL');
});

test('runJourneyPool never reruns refused, stale or browser-only results', async () => {
  const runner = controlledRun();
  const entries = ['refused', 'stale', 'browser', 'b'].map((name) => entry({ name }));
  const pool = runJourneyPool({ entries, readLimit: () => 3, run: runner.run });
  await runner.finish('refused', { passed: false, refused: true, message: 'invalid file' });
  await runner.finish('stale', { passed: false, stale: true, message: 'another build' });
  await runner.finish('browser', { passed: false, browserOnly: 'needs a browser' });
  await runner.finish('b');
  const results = await pool;
  expect(runner.started).toEqual(['refused', 'stale', 'browser', 'b']);
  expect(results.map((result) => result.contended)).toEqual([
    undefined,
    undefined,
    undefined,
    undefined,
  ]);
});

test('runJourneyPool waits for the journeys in flight before a rerun, and starts none meanwhile', async () => {
  const runner = controlledRun();
  const entries = ['a', 'b', 'c', 'd'].map((name) => entry({ name }));
  const pool = runJourneyPool({ entries, readLimit: () => 3, run: runner.run });
  await new Promise((resolve) => setImmediate(resolve));
  expect(runner.started).toEqual(['a', 'b', 'c']);
  await runner.finish('a', pageOpenTimeout());
  // b and c are in flight: a waits, and d does not start in a's place.
  expect(runner.started).toEqual(['a', 'b', 'c']);
  await runner.finish('b');
  expect(runner.started).toEqual(['a', 'b', 'c']);
  await runner.finish('c');
  expect(runner.started).toEqual(['a', 'b', 'c', 'a']);
  expect(runner.inFlightAtStart[3]).toEqual({ name: 'a', inFlight: 1 });
  await runner.finish('a');
  await runner.finish('d');
  await pool;
});

test('runJourneyPool passes rerun: true on the rerun only, so it records nothing', async () => {
  const runner = controlledRun();
  const entries = ['a', 'b'].map((name) => entry({ name }));
  const pool = runJourneyPool({ entries, readLimit: () => 2, run: runner.run });
  await runner.finish('a', pageOpenTimeout());
  await runner.finish('b');
  await runner.finish('a');
  await pool;
  expect(runner.options).toEqual([
    { name: 'a', rerun: false },
    { name: 'b', rerun: false },
    { name: 'a', rerun: true },
  ]);
});

test('runJourneyPool reruns two contended failures one after the other, and two alone passes bring a limit of 3 to 1', async () => {
  const runner = controlledRun();
  const entries = ['a', 'b', 'c', 'd', 'e'].map((name) => entry({ name }));
  const pool = runJourneyPool({ entries, readLimit: () => 3, run: runner.run });
  await runner.finish('a', pageOpenTimeout());
  await runner.finish('b', pageOpenTimeout());
  await runner.finish('c');
  // a reruns alone first; b waits for it.
  expect(runner.started).toEqual(['a', 'b', 'c', 'a']);
  await runner.finish('a');
  expect(runner.started).toEqual(['a', 'b', 'c', 'a', 'b']);
  expect(runner.inFlightAtStart[4]).toEqual({ name: 'b', inFlight: 1 });
  await runner.finish('b');
  await runner.finish('d');
  await runner.finish('e');
  const results = await pool;
  expect(results.map((result) => [result.name, result.class, result.contended])).toEqual([
    ['a', 'PASS', true],
    ['b', 'PASS', true],
    ['c', 'PASS', undefined],
    ['d', 'PASS', undefined],
    ['e', 'PASS', undefined],
  ]);
  // The limit is now 1: d and e ran one at a time.
  expect(runner.inFlightAtStart.slice(5)).toEqual([
    { name: 'd', inFlight: 1 },
    { name: 'e', inFlight: 1 },
  ]);
});

test('runJourneyPool does not rerun a contended failure once memory pressure has brought the limit to 1', async () => {
  const runner = controlledRun();
  const entries = ['a', 'b'].map((name) => entry({ name }));
  let limit = 2;
  const pool = runJourneyPool({ entries, readLimit: () => limit, run: runner.run });
  await new Promise((resolve) => setImmediate(resolve));
  limit = 1;
  await runner.finish('a', pageOpenTimeout());
  await runner.finish('b');
  const results = await pool;
  expect(runner.started).toEqual(['a', 'b']);
  expect(results[0]).toEqual({ name: 'a', class: 'FAIL', ...pageOpenTimeout() });
});

test('runJourneyPool reruns a contended thrown run like any other failure', async () => {
  let calls = 0;
  const entries = ['a', 'b'].map((name) => entry({ name }));
  const results = await runJourneyPool({
    entries,
    readLimit: () => 2,
    run: async ({ item }) => {
      await new Promise((resolve) => setImmediate(resolve));
      if (item.journey.name === 'a' && calls++ === 0) {
        throw new Error('socket closed');
      }
      return { name: item.journey.name, passed: true, class: 'PASS' };
    },
  });
  expect(results[0]).toMatchObject({
    name: 'a',
    class: 'PASS',
    contended: true,
    contendedFailure: { message: 'The journey run failed with an error: socket closed' },
  });
});

test('runJourneyPool never reruns at a limit of 1', async () => {
  const runner = controlledRun();
  const entries = ['a', 'b'].map((name) => entry({ name }));
  const pool = runJourneyPool({ entries, readLimit: () => 1, run: runner.run });
  await runner.finish('a', pageOpenTimeout());
  await runner.finish('b');
  const results = await pool;
  expect(runner.started).toEqual(['a', 'b']);
  expect(results[0].passed).toBe(false);
});

test('runJourneyPool runs no rerun when a callback throws while the rerun waits, and reports the first failure', async () => {
  const runner = controlledRun();
  const entries = ['a', 'b', 'c', 'd'].map((name) => entry({ name }));
  const finished = [];
  const pool = runJourneyPool({
    entries,
    readLimit: () => 3,
    run: runner.run,
    onFinished: ({ result }) => {
      finished.push([result.name, result.class, result.contended]);
      if (result.name === 'b') throw new Error('progress failed');
    },
  });
  const rejected = expect(pool).rejects.toThrow('progress failed');
  await runner.finish('a', pageOpenTimeout());
  // a waits for b and c; b's callback throws meanwhile.
  await runner.finish('b');
  await runner.finish('c');
  await rejected;
  expect(runner.started).toEqual(['a', 'b', 'c']);
  expect(finished).toEqual([
    ['b', 'PASS', undefined],
    ['c', 'PASS', undefined],
    ['a', 'FAIL', undefined],
  ]);
});
