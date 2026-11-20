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

import { vi, beforeEach, expect, test } from 'vitest';

const mockRunJourney = vi.fn();
vi.doMock('../../test/runJourney.js', () => ({ default: mockRunJourney }));

const { default: runBaseline } = await import('./runBaseline.js');

function item(name, steps) {
  return {
    filePath: `/app/tests/journeys/${name}.yaml`,
    journey: { name, pageId: 'home', data: 'explore', steps },
  };
}

const headless = item('saves headless', [
  { click: 'save_button' },
  { expect: { state: { path: 'saved', equals: true } } },
]);
const browser = item('saves in a browser', [
  { click: 'save_button' },
  { expect: { text: { blockId: 'save_success', contains: 'Saved' } } },
]);

beforeEach(() => {
  mockRunJourney.mockReset();
  mockRunJourney.mockImplementation(async ({ item: run }) => ({
    name: run.journey.name,
    passed: true,
    exercised: { pages: ['home'] },
    durationMs: 10,
  }));
});

test('runBaseline runs a journey that needs no browser headless, and the rest in the browser', async () => {
  const { baselines } = await runBaseline({
    items: [headless, browser],
    url: 'http://localhost:3300',
    configDirectory: '/app',
    headless: true,
  });
  expect(
    mockRunJourney.mock.calls.map(([args]) => [args.item.journey.name, args.headless])
  ).toEqual([
    ['saves headless', true],
    ['saves in a browser', false],
  ]);
  expect(baselines.map(({ name, headless: ranHeadless }) => [name, ranHeadless])).toEqual([
    ['saves headless', true],
    ['saves in a browser', false],
  ]);
});

test('runBaseline runs a journey the headless runner finds needs a browser in the browser', async () => {
  mockRunJourney.mockImplementationOnce(async () => ({
    name: 'saves headless',
    passed: false,
    browserOnly: {
      index: 0,
      step: { click: 'save_button' },
      reason: 'DownloadFile needs the browser.',
    },
  }));
  const { baselines } = await runBaseline({
    items: [headless],
    url: 'http://localhost:3300',
    configDirectory: '/app',
    headless: true,
  });
  expect(mockRunJourney.mock.calls.map(([args]) => args.headless)).toEqual([true, undefined]);
  expect(baselines[0].headless).toBe(false);
});

test('runBaseline runs every journey in the browser without headless', async () => {
  await runBaseline({ items: [headless], url: 'http://localhost:3300', configDirectory: '/app' });
  expect(mockRunJourney.mock.calls[0][0].headless).toBe(false);
});

test('runBaseline runs a journey whose steps are not valid in the browser, which reports it', async () => {
  const invalid = item('steps not valid', [null, { expect: null }]);
  mockRunJourney.mockImplementationOnce(async () => ({
    name: 'steps not valid',
    passed: false,
    message: 'Step 0 is not valid.',
  }));
  const { failed } = await runBaseline({
    items: [invalid],
    url: 'http://localhost:3300',
    configDirectory: '/app',
    headless: true,
  });
  expect(mockRunJourney.mock.calls[0][0].headless).toBe(false);
  expect(failed.map(({ name }) => name)).toEqual(['steps not valid']);
});
