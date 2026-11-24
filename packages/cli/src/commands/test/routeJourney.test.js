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
import mayRunInBrowser from './mayRunInBrowser.js';
import routeJourney from './routeJourney.js';

const configDirectory = path.join('/', 'app');
const filePath = path.join(configDirectory, 'tests', 'journeys', 'a.yaml');

const headlessJourney = { name: 'goes next', pageId: 'form', steps: [{ click: 'next' }] };
const titleJourney = {
  name: 'reads the title',
  pageId: 'form',
  steps: [{ expect: { title: { contains: 'home' } } }],
};

function itemOf(journey) {
  return { filePath, journey };
}

function recordsOf({
  journey = headlessJourney,
  configHashes = ['config-1', 'config-2'],
  record = {},
} = {}) {
  return {
    [`tests/journeys/a.yaml#${journey.name}`]: {
      browserOnly: { index: 0, step: { click: 'next' }, reason: 'needs a browser here' },
      hash: hashJourney(journey),
      configHashes,
      ...record,
    },
  };
}

function route({
  item = itemOf(headlessJourney),
  runner = 'mixed',
  records = {},
  configHash = 'config-1',
}) {
  return routeJourney({ item, runner, records, configDirectory, configHash });
}

test('a mixed run sends a journey the classifier passes headless, and one it marks browser-only to the browser', () => {
  expect(route({})).toBe('headless');
  expect(route({ item: itemOf(titleJourney) })).toBe('browser');
});

test('a browser or headless run sends every journey there', () => {
  expect(route({ runner: 'browser' })).toBe('browser');
  expect(route({ runner: 'headless', item: itemOf(titleJourney) })).toBe('headless');
});

test('a mixed run sends a journey recorded as found partway through to the browser', () => {
  // The build as that run started, on a fresh server, or as it ended, on one kept running.
  expect(route({ records: recordsOf() })).toBe('browser');
  expect(route({ records: recordsOf(), configHash: 'config-2' })).toBe('browser');
});

test('a record stops counting once the journey or the config changes', () => {
  const changed = { ...headlessJourney, steps: [{ click: 'save' }] };
  expect(route({ item: itemOf(changed), records: recordsOf() })).toBe('headless');
  expect(route({ records: recordsOf(), configHash: 'config-0' })).toBe('headless');
  // A record taken on the production build, or on a build hashBuild could not read, never counts.
  expect(route({ records: recordsOf({ configHashes: [] }) })).toBe('headless');
  expect(route({ records: recordsOf(), configHash: null })).toBe('headless');
});

test('a record of a pass, or from before records carried hashes, never counts', () => {
  expect(route({ records: recordsOf({ record: { browserOnly: undefined, passed: true } }) })).toBe(
    'headless'
  );
  expect(route({ records: recordsOf({ record: { hash: undefined } }) })).toBe('headless');
  expect(
    route({ records: recordsOf({ record: { configHashes: undefined, configHash: 'config-1' } }) })
  ).toBe('headless');
});

test('a journey no runner can take goes headless', () => {
  expect(route({ item: { filePath, error: 'Could not parse' } })).toBe('headless');
});

test('mayRunInBrowser says whether a run takes the journey run slots before its server starts', () => {
  const entries = (journeys) => journeys.map((journey) => ({ item: itemOf(journey) }));
  const read = (options) =>
    mayRunInBrowser({
      entries: entries([headlessJourney]),
      runner: 'mixed',
      thorough: false,
      records: {},
      configDirectory,
      ...options,
    });
  expect(read({})).toBe(false);
  expect(read({ runner: 'browser' })).toBe(true);
  expect(read({ runner: 'headless', entries: entries([titleJourney]) })).toBe(false);
  expect(read({ thorough: true })).toBe(true);
  expect(read({ entries: entries([headlessJourney, titleJourney]) })).toBe(true);
  // Whatever config it was found on: the build hash is read once the server is up.
  expect(read({ records: recordsOf({ configHashes: ['config-0'] }) })).toBe(true);
  expect(read({ entries: [{ item: { filePath, error: 'Could not parse' } }] })).toBe(false);
});

test('a mixed run never sends a journey with a step only the headless runner takes to the browser', () => {
  const held = {
    name: 'holds a call',
    pageId: 'form',
    steps: [{ hold: { requestId: 'save' } }, { expect: { title: { contains: 'home' } } }],
  };
  expect(route({ item: itemOf(held) })).toBe('headless');
  expect(route({ item: itemOf(held), records: recordsOf({ journey: held }) })).toBe('headless');
  expect(
    mayRunInBrowser({
      entries: [{ item: itemOf(held) }],
      runner: 'mixed',
      thorough: false,
      records: recordsOf({ journey: held }),
      configDirectory,
    })
  ).toBe(false);
});

test('a record from the production build sends nothing to the browser, nor takes the slots', () => {
  expect(route({ records: recordsOf({ configHashes: [] }) })).toBe('headless');
  expect(
    mayRunInBrowser({
      entries: [{ item: itemOf(headlessJourney) }],
      runner: 'mixed',
      thorough: false,
      records: recordsOf({ configHashes: [] }),
      configDirectory,
    })
  ).toBe(false);
});
