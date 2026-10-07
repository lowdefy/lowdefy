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

const runJourney = jest.fn();
jest.unstable_mockModule('../../test/runJourney.js', () => ({ default: runJourney }));
jest.unstable_mockModule('../../test/fetchBuildId.js', () => ({
  default: async () => 'build-1',
}));

const { default: runMutantPair } = await import('./runMutantPair.js');

const footer = {
  id: 'footer',
  operator: 'drop-block',
  artifact: 'pages/a-home.json',
  key: 'k_home',
  arg: null,
  anchor: { type: 'block', pageId: 'a-home', blockId: 'footer', parentBlockId: 'a-home' },
  copies: ['tickets'],
  copyTargets: [
    {
      artifact: 'pages/tickets.json',
      key: 'k_tickets',
      anchor: { type: 'block', pageId: 'tickets', blockId: 'footer', parentBlockId: 'tickets' },
    },
  ],
};

function baseline(rendered) {
  return {
    key: 'tests/journeys/a.yaml#a',
    item: { name: 'a' },
    exercised: { pages: Object.keys(rendered), requests: [], endpoints: [], events: [], rendered },
  };
}

beforeEach(() => {
  runJourney.mockReset();
  runJourney.mockResolvedValue({
    passed: true,
    durationMs: 10,
    mutant: { applied: 1, misses: [] },
  });
});

test('runMutantPair runs a shared layout mutant on the copy the journey rendered', async () => {
  await runMutantPair({
    pair: { mutant: footer, baseline: baseline({ tickets: ['footer'] }) },
    url: 'http://localhost:3999',
    buildId: 'build-1',
  });
  expect(runJourney.mock.calls[0][0].mutant).toEqual({
    buildId: 'build-1',
    artifact: 'pages/tickets.json',
    key: 'k_tickets',
    arg: null,
    operator: 'drop-block',
  });
});

test('runMutantPair runs on the kept copy when the journey reached no copy', async () => {
  await runMutantPair({
    pair: { mutant: footer, baseline: baseline({ settings: ['form'] }) },
    url: 'http://localhost:3999',
    buildId: 'build-1',
  });
  expect(runJourney.mock.calls[0][0].mutant).toMatchObject({
    artifact: 'pages/a-home.json',
    key: 'k_home',
  });
});
