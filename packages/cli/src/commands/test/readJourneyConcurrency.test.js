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

import readJourneyConcurrency from './readJourneyConcurrency.js';

const normal = () => 'normal';

test('readJourneyConcurrency defaults to 1 and reads no memory pressure', () => {
  const readPressure = vi.fn(normal);
  const { readLimit } = readJourneyConcurrency({
    name: '--concurrency',
    repeat: 1,
    env: {},
    readPressure,
  });
  expect(readLimit()).toBe(1);
  expect(readPressure).not.toHaveBeenCalled();
});

test('readJourneyConcurrency takes the option before the environment', () => {
  const { readLimit } = readJourneyConcurrency({
    concurrency: '3',
    name: '--concurrency',
    repeat: 1,
    env: { LOWDEFY_JOURNEY_CONCURRENCY: '2' },
    readPressure: normal,
  });
  expect(readLimit()).toBe(3);
});

test('readJourneyConcurrency takes LOWDEFY_JOURNEY_CONCURRENCY with no option', () => {
  const { readLimit } = readJourneyConcurrency({
    name: 'concurrency',
    repeat: 1,
    env: { LOWDEFY_JOURNEY_CONCURRENCY: '2' },
    readPressure: normal,
  });
  expect(readLimit()).toBe(2);
});

test('readJourneyConcurrency takes a number from the MCP tool', () => {
  const { readLimit } = readJourneyConcurrency({
    concurrency: 2,
    name: 'concurrency',
    repeat: 1,
    env: {},
    readPressure: normal,
  });
  expect(readLimit()).toBe(2);
});

test.each([['0'], ['4'], ['1.5'], ['two'], [''], [true]])(
  'readJourneyConcurrency refuses %j for the option',
  (value) => {
    expect(
      readJourneyConcurrency({ concurrency: value, name: '--concurrency', repeat: 1, env: {} })
    ).toEqual({
      error: `--concurrency must be an integer from 1 to 3. Received ${JSON.stringify(value)}.`,
    });
  }
);

test('readJourneyConcurrency reads an empty LOWDEFY_JOURNEY_CONCURRENCY as unset', () => {
  ['', '  '].forEach((value) => {
    const read = readJourneyConcurrency({
      name: '--concurrency',
      repeat: 1,
      env: { LOWDEFY_JOURNEY_CONCURRENCY: value },
      readPressure: normal,
    });
    expect(read.error).toBeUndefined();
    expect(read.readLimit()).toBe(1);
  });
  const typed = readJourneyConcurrency({
    concurrency: 2,
    name: '--concurrency',
    repeat: 1,
    env: { LOWDEFY_JOURNEY_CONCURRENCY: '' },
    readPressure: normal,
  });
  expect(typed.readLimit()).toBe(2);
});

test('readJourneyConcurrency refuses an out-of-range LOWDEFY_JOURNEY_CONCURRENCY by name', () => {
  expect(
    readJourneyConcurrency({
      name: '--concurrency',
      repeat: 1,
      env: { LOWDEFY_JOURNEY_CONCURRENCY: '8' },
    })
  ).toEqual({ error: 'LOWDEFY_JOURNEY_CONCURRENCY must be an integer from 1 to 3. Received "8".' });
});

test('readJourneyConcurrency gives 1 while memory pressure is warn or critical, read on each call', () => {
  const readPressure = vi
    .fn()
    .mockReturnValueOnce('normal')
    .mockReturnValueOnce('warn')
    .mockReturnValueOnce('critical')
    .mockReturnValueOnce('normal');
  const { readLimit } = readJourneyConcurrency({
    concurrency: 2,
    name: 'concurrency',
    repeat: 1,
    env: {},
    readPressure,
  });
  expect([readLimit(), readLimit(), readLimit(), readLimit()]).toEqual([2, 1, 1, 2]);
});

test('readJourneyConcurrency gives 1 under --repeat 3', () => {
  const { readLimit } = readJourneyConcurrency({
    concurrency: '3',
    name: '--concurrency',
    repeat: 3,
    env: {},
    readPressure: normal,
  });
  expect(readLimit()).toBe(1);
});
