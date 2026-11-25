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

import { expect, test, vi } from 'vitest';

import readHeadlessConcurrency from './readHeadlessConcurrency.js';
import readRunConcurrency from './readRunConcurrency.js';

const normal = () => 'normal';
const GIB = 1024 ** 3;
const memory = 64 * GIB;

test('readHeadlessConcurrency defaults to the cores less one', () => {
  const read = readHeadlessConcurrency({
    name: '--concurrency',
    repeat: 1,
    cores: 8,
    memory,
    readPressure: normal,
  });
  expect(read.size).toBe(7);
  expect(read.readLimit()).toBe(7);
});

test('readHeadlessConcurrency keeps the default to one journey per 4 GiB of memory', () => {
  const read = (bytes) =>
    readHeadlessConcurrency({
      name: '--concurrency',
      repeat: 1,
      cores: 10,
      memory: bytes,
      readPressure: normal,
    }).size;
  expect(read(16 * GIB)).toBe(4);
  expect(read(8 * GIB)).toBe(2);
  expect(read(3 * GIB)).toBe(1);
  // A typed concurrency is the run's own choice.
  expect(
    readHeadlessConcurrency({
      concurrency: 8,
      typed: true,
      name: '--concurrency',
      repeat: 1,
      cores: 10,
      memory: 8 * GIB,
      readPressure: normal,
    }).size
  ).toBe(8);
});

test('readHeadlessConcurrency runs one at a time on one or two cores, and reads no pressure', () => {
  [1, 2].forEach((cores) => {
    const readPressure = vi.fn(normal);
    const read = readHeadlessConcurrency({ name: '--concurrency', repeat: 1, cores, readPressure });
    expect(read.size).toBe(1);
    expect(read.readLimit()).toBe(1);
    expect(readPressure).not.toHaveBeenCalled();
  });
});

test('readHeadlessConcurrency takes a typed concurrency above the cores and the browser limit', () => {
  expect(
    readHeadlessConcurrency({
      concurrency: '12',
      typed: true,
      name: '--concurrency',
      repeat: 1,
      cores: 4,
      readPressure: normal,
    }).size
  ).toBe(12);
  expect(
    readHeadlessConcurrency({
      concurrency: 2,
      typed: true,
      name: 'concurrency',
      repeat: 1,
      cores: 16,
      readPressure: normal,
    }).size
  ).toBe(2);
});

test('readHeadlessConcurrency leaves an untyped concurrency (lowdefy.yaml) alone', () => {
  expect(
    readHeadlessConcurrency({
      concurrency: 1,
      typed: false,
      name: '--concurrency',
      repeat: 1,
      cores: 6,
      memory,
      readPressure: normal,
    }).size
  ).toBe(5);
});

test.each([['0'], [0], ['1.5'], ['two'], [''], [true], [-2]])(
  'readHeadlessConcurrency refuses %j',
  (value) => {
    expect(
      readHeadlessConcurrency({
        concurrency: value,
        typed: true,
        name: '--concurrency',
        repeat: 1,
        cores: 4,
      })
    ).toEqual({
      error: `--concurrency must be a whole number of journeys at once, 1 or more. Received ${JSON.stringify(
        value
      )}.`,
    });
  }
);

test('readHeadlessConcurrency runs one at a time under --repeat', () => {
  const read = readHeadlessConcurrency({
    concurrency: '4',
    typed: true,
    name: '--concurrency',
    repeat: 3,
    cores: 8,
    readPressure: normal,
  });
  expect(read.size).toBe(1);
  expect(read.readLimit()).toBe(1);
});

test('readHeadlessConcurrency gives 1 while memory pressure is warn or critical, read at most once a second', () => {
  const readPressure = vi
    .fn()
    .mockReturnValueOnce('normal')
    .mockReturnValueOnce('warn')
    .mockReturnValueOnce('critical')
    .mockReturnValueOnce('normal');
  let clock = 0;
  const read = readHeadlessConcurrency({
    name: '--concurrency',
    repeat: 1,
    cores: 4,
    memory,
    readPressure,
    now: () => clock,
  });
  expect(read.size).toBe(3);
  const limits = [];
  [0, 500, 1000, 2000, 3000].forEach((at) => {
    clock = at;
    limits.push(read.readLimit());
  });
  // The reading at 0 holds at 500; 1000, 2000 and 3000 each read again.
  expect(limits).toEqual([3, 3, 1, 1, 3]);
  expect(readPressure).toHaveBeenCalledTimes(4);
});

test('readRunConcurrency runs a dev server headless run one at a time unless it was given a concurrency', () => {
  const untyped = readRunConcurrency({
    runner: 'headless',
    concurrency: 3,
    typed: false,
    name: '--concurrency',
    repeat: 1,
    cores: 8,
    memory,
    readPressure: normal,
  });
  expect(untyped.headless.size).toBe(1);
  const built = readRunConcurrency({
    runner: 'headless',
    build: true,
    name: '--concurrency',
    repeat: 1,
    cores: 8,
    memory,
    readPressure: normal,
  });
  expect(built.headless.size).toBe(7);
});

test('readRunConcurrency sizes a headless run by its concurrency and runs no browser journeys', () => {
  const read = readRunConcurrency({
    runner: 'headless',
    concurrency: '5',
    typed: true,
    name: '--concurrency',
    repeat: 1,
    cores: 2,
    readPressure: normal,
  });
  expect(read.headless.size).toBe(5);
  expect(read.browser.readLimit()).toBe(1);
});

test('readRunConcurrency gives both parts of a mixed run a typed concurrency', () => {
  const read = readRunConcurrency({
    runner: 'mixed',
    concurrency: '1',
    typed: true,
    name: '--concurrency',
    repeat: 1,
    cores: 6,
    memory,
    env: {},
    readPressure: normal,
  });
  expect(read.browser.readLimit()).toBe(1);
  expect(read.headless.size).toBe(1);
});

test('readRunConcurrency runs an untyped mixed run headless one at a time, browser at the config', () => {
  const read = readRunConcurrency({
    runner: 'mixed',
    concurrency: 2,
    typed: false,
    name: '--concurrency',
    repeat: 1,
    cores: 6,
    memory,
    env: {},
    readPressure: normal,
  });
  expect(read.browser.readLimit()).toBe(2);
  expect(read.headless.size).toBe(1);
});

test('readRunConcurrency runs a browser run no headless journeys side by side', () => {
  const read = readRunConcurrency({
    runner: 'browser',
    name: '--concurrency',
    repeat: 1,
    cores: 6,
    env: { LOWDEFY_JOURNEY_CONCURRENCY: '3' },
    readPressure: normal,
  });
  expect(read.browser.readLimit()).toBe(3);
  expect(read.headless.size).toBe(1);
});

test('readRunConcurrency refuses a browser concurrency above 3 and a headless one below 1', () => {
  expect(
    readRunConcurrency({
      runner: 'mixed',
      concurrency: '4',
      typed: true,
      name: '--concurrency',
      repeat: 1,
      env: {},
    })
  ).toEqual({ error: '--concurrency must be an integer from 1 to 3. Received "4".' });
  expect(
    readRunConcurrency({
      runner: 'headless',
      concurrency: '0',
      typed: true,
      name: '--concurrency',
      repeat: 1,
    }).error
  ).toMatch(/^--concurrency must be a whole number/);
});
