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

import discoverJourneys from './discoverJourneys.js';

let configDirectory;
let context;

beforeEach(() => {
  configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-test-journeys-'));
  context = { directories: { config: configDirectory } };
});

afterEach(() => {
  fs.rmSync(configDirectory, { recursive: true, force: true });
});

function writeJourneyFile(fileName, content) {
  const filePath = path.join(configDirectory, 'tests', 'journeys', fileName);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
  return filePath;
}

test('discoverJourneys returns an empty array when tests/journeys does not exist', () => {
  expect(discoverJourneys({ context })).toEqual([]);
});

test('discoverJourneys returns an empty array when tests/journeys is empty', () => {
  fs.mkdirSync(path.join(configDirectory, 'tests', 'journeys'), { recursive: true });
  expect(discoverJourneys({ context })).toEqual([]);
});

test('discoverJourneys normalises a single-object file to one journey', () => {
  const filePath = writeJourneyFile(
    'form.yaml',
    `name: submits the form
pageId: form
steps:
  - click: submit
`
  );
  expect(discoverJourneys({ context })).toEqual([
    {
      filePath,
      journey: { name: 'submits the form', pageId: 'form', steps: [{ click: 'submit' }] },
    },
  ]);
});

test('discoverJourneys expands an array file to one entry per journey with the same filePath', () => {
  const filePath = writeJourneyFile(
    'controls.yaml',
    `- name: first
  pageId: controls
  steps:
    - click: a
- name: second
  pageId: controls
  steps:
    - click: b
`
  );
  const journeys = discoverJourneys({ context });
  expect(journeys.map((item) => item.journey.name)).toEqual(['first', 'second']);
  expect(journeys.every((item) => item.filePath === filePath)).toBe(true);
});

test('discoverJourneys sorts files by name and ignores non-yaml files', () => {
  writeJourneyFile('b-second.yaml', 'name: b\npageId: p\nsteps: [{ click: x }]\n');
  writeJourneyFile('a-first.yml', 'name: a\npageId: p\nsteps: [{ click: x }]\n');
  writeJourneyFile('c-third.yaml', 'name: c\npageId: p\nsteps: [{ click: x }]\n');
  writeJourneyFile('README.md', '# not a journey');
  expect(discoverJourneys({ context }).map((item) => item.journey.name)).toEqual(['a', 'b', 'c']);
});

test('discoverJourneys reports a file with invalid YAML as an entry with an error instead of throwing', () => {
  const filePath = writeJourneyFile('broken.yaml', 'name: [unclosed\npageId: p\n');
  writeJourneyFile('ok.yaml', 'name: ok\npageId: p\nsteps: [{ click: x }]\n');
  const journeys = discoverJourneys({ context });
  expect(journeys).toHaveLength(2);
  expect(journeys[0].filePath).toEqual(filePath);
  expect(journeys[0].journey).toBeUndefined();
  expect(journeys[0].error).toMatch(/^Invalid YAML: /);
  expect(journeys[1].journey.name).toEqual('ok');
});

test('discoverJourneys reports an empty journey file as empty', () => {
  const filePath = writeJourneyFile('empty.yaml', '# nothing here\n');
  expect(discoverJourneys({ context })).toEqual([
    { filePath, journey: undefined, error: 'Journey file is empty.' },
  ]);
});

test('discoverJourneys ignores the _candidates directory the journey compiler writes', () => {
  writeJourneyFile(
    'form.yaml',
    `name: submits the form
pageId: form
steps:
  - click: submit
`
  );
  const candidates = path.join(configDirectory, 'tests', 'journeys', '_candidates');
  fs.mkdirSync(candidates, { recursive: true });
  fs.writeFileSync(
    path.join(candidates, 'form-1a2b3c4d.yaml'),
    `name: form recorded 1a2b3c4d
pageId: form
steps:
  - click: submit
`
  );
  expect(discoverJourneys({ context }).map(({ journey }) => journey.name)).toEqual([
    'submits the form',
  ]);
});

test('discoverJourneys discovers journeys in nested directories, byte-sorted', () => {
  writeJourneyFile('b.yaml', 'name: b\npageId: home\nsteps: []\n');
  writeJourneyFile(path.join('checkout', 'a.yaml'), 'name: a\npageId: home\nsteps: []\n');
  expect(discoverJourneys({ context }).map((item) => item.journey.name)).toEqual(['b', 'a']);
});

test('discoverJourneys skips the _candidates directory', () => {
  writeJourneyFile('kept.yaml', 'name: kept\npageId: home\nsteps: []\n');
  writeJourneyFile(
    path.join('_candidates', 'draft.yaml'),
    'name: draft\npageId: home\nsteps: []\n'
  );
  expect(discoverJourneys({ context }).map((item) => item.journey.name)).toEqual(['kept']);
});
