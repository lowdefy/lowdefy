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

import pruneCandidateDirectory from './pruneCandidateDirectory.js';
import writeCandidateManifest from './writeCandidateManifest.js';

const DAY = 24 * 60 * 60 * 1000;
let configDirectory;

function candidatesDirectory() {
  return path.join(configDirectory, 'tests', 'journeys', '_candidates', 'explorer');
}

// A run's candidate folder as compileWalks and finishRun leave it: a finding
// candidate, a coverage candidate and the manifest of both, ageDays old.
function writeRun({ run, ageDays }) {
  const directory = path.join(candidatesDirectory(), run);
  const finding = path.join(directory, 'findings', 'tickets-save-1a2b3c4d.yaml');
  const coverage = path.join(directory, 'tickets-walk.yaml');
  fs.mkdirSync(path.dirname(finding), { recursive: true });
  fs.writeFileSync(finding, 'name: finding\npageId: tickets\nsteps: []\n');
  fs.writeFileSync(coverage, 'name: coverage\npageId: tickets\nsteps: []\n');
  writeCandidateManifest({ directory, files: [finding, coverage] });
  setAge({ run, ageDays });
  return { directory, finding, coverage };
}

function setAge({ run, ageDays }) {
  const time = new Date(Date.now() - ageDays * DAY);
  fs.utimesSync(path.join(candidatesDirectory(), run), time, time);
}

beforeEach(() => {
  configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-candidates-prune-'));
});

afterEach(() => {
  fs.rmSync(configDirectory, { recursive: true, force: true });
});

test('an unedited run folder older than 14 days is pruned, and a recent one is kept', async () => {
  writeRun({ run: '20260901T100000Z-aaaaaa', ageDays: 20 });
  writeRun({ run: '20261003T100000Z-bbbbbb', ageDays: 2 });
  const result = await pruneCandidateDirectory({ configDirectory });
  expect(result).toEqual({
    pruned: ['tests/journeys/_candidates/explorer/20260901T100000Z-aaaaaa'],
    keptEdited: [],
  });
  expect(fs.readdirSync(candidatesDirectory())).toEqual(['20261003T100000Z-bbbbbb']);
});

test('an old run folder with an edited candidate is kept and reported', async () => {
  const { finding } = writeRun({ run: '20260901T100000Z-aaaaaa', ageDays: 20 });
  fs.writeFileSync(finding, 'name: finding\npageId: tickets\nsteps:\n  - click: save\n');
  setAge({ run: '20260901T100000Z-aaaaaa', ageDays: 20 });
  const result = await pruneCandidateDirectory({ configDirectory });
  expect(result).toEqual({
    pruned: [],
    keptEdited: ['tests/journeys/_candidates/explorer/20260901T100000Z-aaaaaa'],
  });
  expect(fs.existsSync(finding)).toBe(true);
});

test('an old run folder with a file the run did not write is kept', async () => {
  const { directory } = writeRun({ run: '20260901T100000Z-aaaaaa', ageDays: 20 });
  fs.writeFileSync(path.join(directory, 'notes.yaml'), 'name: mine\n');
  setAge({ run: '20260901T100000Z-aaaaaa', ageDays: 20 });
  const result = await pruneCandidateDirectory({ configDirectory });
  expect(result.keptEdited).toEqual([
    'tests/journeys/_candidates/explorer/20260901T100000Z-aaaaaa',
  ]);
});

test('an old run folder whose candidate was moved out is pruned', async () => {
  const { coverage } = writeRun({ run: '20260901T100000Z-aaaaaa', ageDays: 20 });
  fs.rmSync(coverage);
  setAge({ run: '20260901T100000Z-aaaaaa', ageDays: 20 });
  const result = await pruneCandidateDirectory({ configDirectory });
  expect(result.pruned).toEqual(['tests/journeys/_candidates/explorer/20260901T100000Z-aaaaaa']);
});

test('an old run folder with candidates and no manifest is kept, and an empty one is pruned', async () => {
  const unrecorded = path.join(candidatesDirectory(), '20260801T100000Z-cccccc');
  fs.mkdirSync(unrecorded, { recursive: true });
  fs.writeFileSync(path.join(unrecorded, 'walk.yaml'), 'name: walk\n');
  const empty = path.join(candidatesDirectory(), '20260802T100000Z-dddddd');
  fs.mkdirSync(empty, { recursive: true });
  setAge({ run: '20260801T100000Z-cccccc', ageDays: 30 });
  setAge({ run: '20260802T100000Z-dddddd', ageDays: 30 });
  const result = await pruneCandidateDirectory({ configDirectory });
  expect(result).toEqual({
    pruned: ['tests/journeys/_candidates/explorer/20260802T100000Z-dddddd'],
    keptEdited: ['tests/journeys/_candidates/explorer/20260801T100000Z-cccccc'],
  });
});

test('a missing candidates directory prunes nothing', async () => {
  expect(await pruneCandidateDirectory({ configDirectory })).toEqual({
    pruned: [],
    keptEdited: [],
  });
});
