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

const readConfigText = jest.fn(async () => ({
  texts: new Set(['Save']),
  isConfigText: (text) => text === 'Save',
}));
jest.unstable_mockModule('../configText/readConfigText.js', () => ({ default: readConfigText }));

const { default: readTierConfigText } = await import('./readTierConfigText.js');
const { default: sequenceId } = await import('../evidence/sequenceId.js');

const context = { directories: {} };
const steps = [{ click: { blockId: 'grid', text: 'Sample customer' } }];

function entry({ stored, deprecated }) {
  return {
    journey: {
      name: 'opens a customer',
      pageId: 'tickets',
      steps,
      deprecated,
      evidence: { production: { sequence: stored } },
    },
  };
}

beforeEach(() => {
  readConfigText.mockClear();
});

test('readTierConfigText reads no config text when every journey matches its stored id or has none', async () => {
  const journeys = [
    entry({ stored: sequenceId({ pageId: 'tickets', steps }) }),
    { journey: { name: 'new', pageId: 'tickets', steps } },
  ];
  expect(await readTierConfigText({ context, journeys })).toBeUndefined();
  expect(readConfigText).not.toHaveBeenCalled();
});

test('readTierConfigText reads the config text rule when a journey id differs from its stored one', async () => {
  const journeys = [entry({ stored: 'v1-00000000' })];
  const isConfigText = await readTierConfigText({ context, journeys });
  expect(isConfigText('Save')).toBe(true);
  expect(isConfigText('Sample customer')).toBe(false);
  expect(readConfigText).toHaveBeenCalledTimes(1);
});

test('readTierConfigText ignores deprecated journeys, which are never ranked', async () => {
  const journeys = [entry({ stored: 'v1-00000000', deprecated: true })];
  expect(await readTierConfigText({ context, journeys })).toBeUndefined();
  expect(readConfigText).not.toHaveBeenCalled();
});
