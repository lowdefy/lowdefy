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

import path from 'path';
import { expect, test } from 'vitest';

import hashJourney from './hashJourney.js';
import rememberedBrowserOnly from './rememberedBrowserOnly.js';

const configDirectory = path.join('/', 'app');
const filePath = path.join(configDirectory, 'tests', 'journeys', 'a.yaml');
const journey = { name: 'goes next', pageId: 'form', steps: [{ click: 'a' }, { click: 'next' }] };
const browserOnly = { index: 1, step: { click: 'next' }, reason: 'needs a browser here' };
const records = {
  'tests/journeys/a.yaml#goes next': {
    browserOnly,
    hash: hashJourney(journey),
    configHashes: ['build-1'],
  },
};

function remembered({ item = { filePath, journey }, configHash = 'build-1' } = {}) {
  return rememberedBrowserOnly({ item, records, configDirectory, configHash });
}

test('gives the browser-only result a record holds for the same journey and build', () => {
  expect(remembered()).toEqual({
    name: 'goes next',
    filePath,
    journey,
    passed: false,
    stepCount: 2,
    durationMs: 0,
    browserOnly,
    remembered: true,
  });
});

test('runs the journey when the build, the journey or the build hash is unknown or changed', () => {
  expect(remembered({ configHash: 'build-2' })).toBeUndefined();
  expect(remembered({ configHash: null })).toBeUndefined();
  expect(
    remembered({ item: { filePath, journey: { ...journey, steps: [{ click: 'b' }] } } })
  ).toBeUndefined();
});

test('runs a journey no runner can take, which is refused as before', () => {
  expect(remembered({ item: { filePath, error: 'Could not parse' } })).toBeUndefined();
});
