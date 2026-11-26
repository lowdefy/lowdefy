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

import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mockRunHeadlessRepeated = vi.fn();
const mockWorkers = { run: vi.fn(), close: vi.fn(), size: null, workerData: null };

vi.mock('./runHeadlessRepeated.js', async (importOriginal) => {
  const original = await importOriginal();
  return { ...original, default: (args) => mockRunHeadlessRepeated(args) };
});

vi.mock('./createHeadlessWorkers.js', () => ({
  default: ({ size, workerData }) => {
    mockWorkers.size = size;
    mockWorkers.workerData = workerData;
    return { run: mockWorkers.run, close: mockWorkers.close };
  },
}));

const { default: runHeadlessTests } = await import('./runHeadlessTests.js');

let directory;
let logs;
let context;

function passed({ item }) {
  return {
    name: item.journey.name,
    filePath: item.filePath,
    journey: item.journey,
    passed: true,
    class: 'PASS',
    stepCount: 1,
    durationMs: 3,
    repeat: 1,
    runs: 1,
    passedRuns: 1,
    failures: [],
  };
}

function entry(name, { data = 'base' } = {}) {
  return {
    item: {
      filePath: path.join(directory, 'tests', 'journeys', `${name}.yaml`),
      journey: { name, pageId: 'home', data, steps: [{ click: 'save' }] },
    },
  };
}

function after(ms, value) {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

beforeEach(() => {
  directory = fs.mkdtempSync(path.join(os.tmpdir(), 'run-headless-tests-'));
  logs = { info: [], error: [], warn: [] };
  context = {
    directories: {
      config: directory,
      server: path.join(directory, '.lowdefy', 'server'),
      test: path.join(directory, '.lowdefy', 'test'),
    },
    logger: {
      info: (line) => logs.info.push(line),
      error: (line) => logs.error.push(line),
      warn: (line) => logs.warn.push(line),
    },
  };
  mockRunHeadlessRepeated.mockReset();
  mockWorkers.run.mockReset();
  mockWorkers.close.mockReset();
  mockWorkers.close.mockResolvedValue();
});

afterEach(() => {
  fs.rmSync(directory, { recursive: true, force: true });
});

const app = { buildId: 'build-1' };

test('runs one journey in this thread and the rest in worker threads, reported in selection order', async () => {
  // This thread's journey is slow, so the workers' journeys finish first.
  mockRunHeadlessRepeated.mockImplementation(async ({ item }) => after(40, passed({ item })));
  mockWorkers.run.mockImplementation(async ({ item }) => after(5, passed({ item })));
  const ran = await runHeadlessTests({
    app,
    concurrency: { size: 3, readLimit: () => 3 },
    context,
    selected: [entry('first'), entry('second'), entry('third'), entry('fourth')],
    skipped: 0,
    records: {},
    repeat: 1,
    secrets: { API_KEY: 'test-key' },
  });
  expect(ran).toEqual({ failed: 0 });
  // The workers take the run's directories and test secrets, and up to size less this thread.
  expect(mockWorkers.size).toBe(2);
  expect(mockWorkers.workerData).toEqual({
    buildId: 'build-1',
    directories: { config: context.directories.config, server: context.directories.server },
    secrets: { API_KEY: 'test-key' },
  });
  expect(mockRunHeadlessRepeated.mock.calls.map(([args]) => args.item.journey.name)).toEqual([
    'first',
  ]);
  expect(mockWorkers.run.mock.calls.map(([args]) => args.item.journey.name)).toEqual([
    'second',
    'third',
    'fourth',
  ]);
  expect(logs.info.filter((line) => line.startsWith('PASS'))).toEqual([
    expect.stringMatching(/^PASS {2}first/),
    expect.stringMatching(/^PASS {2}second/),
    expect.stringMatching(/^PASS {2}third/),
    expect.stringMatching(/^PASS {2}fourth/),
  ]);
  const written = JSON.parse(
    fs.readFileSync(path.join(context.directories.test, 'headless-run.json'), 'utf8')
  );
  expect(Object.keys(written.journeys)).toEqual([
    'tests/journeys/first.yaml#first',
    'tests/journeys/second.yaml#second',
    'tests/journeys/third.yaml#third',
    'tests/journeys/fourth.yaml#fourth',
  ]);
  expect(mockWorkers.close).toHaveBeenCalledTimes(1);
});

test('a run of one at a time runs every journey in this thread', async () => {
  mockRunHeadlessRepeated.mockImplementation(async ({ item }) => passed({ item }));
  await runHeadlessTests({
    app,
    concurrency: { size: 1, readLimit: () => 1 },
    context,
    selected: [entry('first'), entry('second')],
    skipped: 0,
    records: {},
    repeat: 1,
  });
  expect(mockRunHeadlessRepeated).toHaveBeenCalledTimes(2);
  expect(mockWorkers.run).not.toHaveBeenCalled();
});

test('a journey with no data set runs alone, after the others, in this thread', async () => {
  const inFlight = { now: 0, atAlone: null };
  async function track({ item }, ms) {
    inFlight.now += 1;
    if (item.journey.name === 'no data') inFlight.atAlone = inFlight.now;
    const result = await after(ms, passed({ item }));
    inFlight.now -= 1;
    return result;
  }
  mockRunHeadlessRepeated.mockImplementation((args) => track(args, 10));
  mockWorkers.run.mockImplementation((args) => track(args, 10));
  await runHeadlessTests({
    app,
    concurrency: { size: 4, readLimit: () => 4 },
    context,
    selected: [entry('no data', { data: null }), entry('a'), entry('b')],
    skipped: 0,
    records: {},
    repeat: 1,
  });
  expect(inFlight.atAlone).toBe(1);
  expect(mockRunHeadlessRepeated.mock.calls.map(([args]) => args.item.journey.name)).toEqual([
    'a',
    'no data',
  ]);
});

test('a journey a worker thread threw on fails alone, and the run goes on', async () => {
  mockRunHeadlessRepeated.mockImplementation(async ({ item }) => after(20, passed({ item })));
  mockWorkers.run.mockRejectedValue(new Error('The worker thread running this journey stopped'));
  const ran = await runHeadlessTests({
    app,
    concurrency: { size: 2, readLimit: () => 2 },
    context,
    selected: [entry('first'), entry('second')],
    skipped: 0,
    records: {},
    repeat: 1,
  });
  // second failed beside first, so it ran again alone, in this thread, and passed.
  expect(ran).toEqual({ failed: 0 });
  expect(mockRunHeadlessRepeated.mock.calls.map(([args]) => args.item.journey.name)).toEqual([
    'first',
    'second',
  ]);
});

test('closes the worker threads when reporting throws', async () => {
  mockRunHeadlessRepeated.mockImplementation(async ({ item }) => passed({ item }));
  mockWorkers.run.mockImplementation(async ({ item }) => passed({ item }));
  context.logger.info = () => {
    throw new Error('stdout closed');
  };
  await expect(
    runHeadlessTests({
      app,
      concurrency: { size: 2, readLimit: () => 2 },
      context,
      selected: [entry('first'), entry('second')],
      skipped: 0,
      records: {},
      repeat: 1,
    })
  ).rejects.toThrow('stdout closed');
  expect(mockWorkers.close).toHaveBeenCalledTimes(1);
});

test('when a worker thread cannot open the build, the rest of the run goes one at a time here', async () => {
  const inFlight = { now: 0, max: 0 };
  mockRunHeadlessRepeated.mockImplementation(async ({ item }) => {
    inFlight.now += 1;
    inFlight.max = Math.max(inFlight.max, inFlight.now);
    const result = await after(5, passed({ item }));
    inFlight.now -= 1;
    return result;
  });
  const refused = new Error('The build is older than the config.');
  refused.refused = true;
  mockWorkers.run.mockRejectedValue(refused);
  const ran = await runHeadlessTests({
    app,
    concurrency: { size: 3, readLimit: () => 3 },
    context,
    selected: [entry('first'), entry('second'), entry('third'), entry('fourth')],
    skipped: 0,
    records: {},
    repeat: 1,
  });
  expect(ran).toEqual({ failed: 0 });
  expect(logs.warn).toEqual([
    'A worker thread could not open the build, so the rest of the run goes one journey at a time: The build is older than the config.',
  ]);
  expect(mockRunHeadlessRepeated).toHaveBeenCalledTimes(4);
  expect(inFlight.max).toBe(1);
  expect(logs.info.filter((line) => line.startsWith('PASS'))).toHaveLength(4);
  expect(logs.info.some((line) => line.includes('alone rerun'))).toBe(false);
});
