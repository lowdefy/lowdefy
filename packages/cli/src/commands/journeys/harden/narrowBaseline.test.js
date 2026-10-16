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

import hashJourney from '../../test/hashJourney.js';
import narrowBaseline from './narrowBaseline.js';

let directories;

function item(journey, file = `${journey.name}.yaml`) {
  return { journey, filePath: path.join(directories.config, 'tests', 'journeys', file) };
}

function record(journeys, buildId = 'b1') {
  const entries = {};
  journeys.forEach(({ journey, pages }) => {
    entries[`tests/journeys/${journey.name}.yaml#${journey.name}`] = {
      hash: hashJourney(journey),
      passed: true,
      exercised: { pages },
    };
  });
  const file = path.join(directories.config, '.lowdefy', 'test', 'exercised.json');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify({ version: 1, buildId, journeys: entries }));
}

const orders = { name: 'orders', pageId: 'orders', steps: [{ click: 'a' }] };
const lapsing = { name: 'lapsing', pageId: 'lapsing', steps: [] };
const viaGoto = { name: 'via-goto', pageId: 'home', steps: [{ goto: 'lapsing' }] };
const viaGotoObject = {
  name: 'via-goto-obj',
  pageId: 'home',
  steps: [{ goto: { pageId: 'lapsing' } }],
};
const dynamicGoto = { name: 'dynamic', pageId: 'home', steps: [{ goto: { _state: 'x' } }] };
const viaLink = { name: 'via-link', pageId: 'home', steps: [{ click: 'link' }] };

beforeEach(() => {
  directories = { config: fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-narrow-')) };
});

afterEach(() => {
  fs.rmSync(directories.config, { recursive: true, force: true });
});

function narrow(items, pages = ['lapsing'], buildId = 'b1') {
  return narrowBaseline({ items: items.map((j) => item(j)), pages, directories, buildId });
}

test('leaves out journeys whose last run touched none of the pages', () => {
  record([
    { journey: orders, pages: ['orders'] },
    { journey: lapsing, pages: ['lapsing'] },
    { journey: viaLink, pages: ['home', 'lapsing'] },
  ]);
  const result = narrow([orders, lapsing, viaLink]);
  expect(result.items.map(({ journey }) => journey.name)).toEqual(['lapsing', 'via-link']);
  expect(result.skipped).toBe(1);
});

test('keeps a journey whose pageId or goto step names a page, even if the record says otherwise', () => {
  record([
    { journey: lapsing, pages: [] },
    { journey: viaGoto, pages: ['home'] },
    { journey: viaGotoObject, pages: ['home'] },
    { journey: dynamicGoto, pages: ['home'] },
  ]);
  const result = narrow([lapsing, viaGoto, viaGotoObject, dynamicGoto]);
  expect(result.skipped).toBe(0);
});

test('keeps a journey with no record or a changed journey', () => {
  record([{ journey: orders, pages: ['orders'] }]);
  const changed = { ...orders, steps: [{ click: 'b' }] };
  expect(narrow([changed, viaLink]).skipped).toBe(0);
});

test('runs the full baseline when there is no exercised record', () => {
  expect(narrow([orders, lapsing]).skipped).toBe(0);
});

test('runs the full baseline when the record is from another build or the build is unknown', () => {
  record([{ journey: orders, pages: ['orders'] }], 'old');
  expect(narrow([orders]).skipped).toBe(0);
  record([{ journey: orders, pages: ['orders'] }]);
  expect(narrow([orders], ['lapsing'], null).skipped).toBe(0);
});

test('runs the full baseline without --page', () => {
  record([{ journey: orders, pages: ['orders'] }]);
  expect(narrow([orders], null).skipped).toBe(0);
  expect(narrow([orders], []).skipped).toBe(0);
});
