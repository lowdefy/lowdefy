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

function record(journeys, configHash = 'h1') {
  const entries = {};
  journeys.forEach(({ journey, pages }) => {
    entries[`tests/journeys/${journey.name}.yaml#${journey.name}`] = {
      hash: hashJourney(journey),
      configHash,
      passed: true,
      exercised: { pages },
    };
  });
  const file = path.join(directories.config, '.lowdefy', 'test', 'exercised.json');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify({ version: 1, buildId: 'timestamp', journeys: entries }));
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

function narrow(items, pages = ['lapsing'], configHash = 'h1') {
  return narrowBaseline({ items: items.map((j) => item(j)), pages, directories, configHash });
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

test('keeps a journey with no record or a changed journey, and counts why', () => {
  record([{ journey: orders, pages: ['orders'] }]);
  const changed = { ...orders, steps: [{ click: 'b' }] };
  const result = narrow([changed, viaLink]);
  expect(result.skipped).toBe(0);
  expect(result.reasons).toEqual({
    noRecord: 1,
    journeyChanged: 1,
    otherConfig: 0,
    noConfigHash: 0,
  });
});

test('runs the full baseline when there is no exercised record', () => {
  const result = narrow([orders, lapsing]);
  expect(result.skipped).toBe(0);
  expect(result.reasons.noRecord).toBe(1);
});

test('keeps a journey measured on a different config, whatever the build timestamp', () => {
  record([{ journey: orders, pages: ['orders'] }], 'old');
  const result = narrow([orders]);
  expect(result.skipped).toBe(0);
  expect(result.reasons.otherConfig).toBe(1);
});

test('narrows on the same config even though the build timestamp differs between servers', () => {
  record([{ journey: orders, pages: ['orders'] }]);
  expect(narrow([orders]).skipped).toBe(1);
});

test('keeps every journey when the config hash is unknown or the record has none', () => {
  record([{ journey: orders, pages: ['orders'] }]);
  const unknown = narrow([orders], ['lapsing'], null);
  expect(unknown.skipped).toBe(0);
  expect(unknown.reasons.noConfigHash).toBe(1);
  record([{ journey: orders, pages: ['orders'] }], null);
  expect(narrow([orders]).reasons.noConfigHash).toBe(1);
});

test('keeps only the stale entries of a record merged from runs on different configs', () => {
  record([{ journey: orders, pages: ['orders'] }], 'old');
  const file = path.join(directories.config, '.lowdefy', 'test', 'exercised.json');
  const content = JSON.parse(fs.readFileSync(file, 'utf8'));
  content.journeys['tests/journeys/viaLink.yaml#via-link'] = {
    hash: hashJourney(viaLink),
    configHash: 'h1',
    passed: true,
    exercised: { pages: ['home'] },
  };
  fs.writeFileSync(file, JSON.stringify(content));
  const result = narrowBaseline({
    items: [item(orders), item(viaLink, 'viaLink.yaml')],
    pages: ['lapsing'],
    directories,
    configHash: 'h1',
  });
  expect(result.items.map(({ journey }) => journey.name)).toEqual(['orders']);
  expect(result.skipped).toBe(1);
});

test('runs the full baseline without --page', () => {
  record([{ journey: orders, pages: ['orders'] }]);
  expect(narrow([orders], null).skipped).toBe(0);
  expect(narrow([orders], []).skipped).toBe(0);
  expect(narrow([orders], []).applicable).toBe(false);
});
