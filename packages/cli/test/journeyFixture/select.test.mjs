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

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// `lowdefy test` selections from the built CLI over the fixture app: the full
// run reads sub-folders and skips "_" folders, and a folder, its glob and a tag
// pick the same journey. The journeys written here are removed afterwards, so
// the fixture's tests/journeys stays as the other fixture tests expect it.

const fixtureUrl = process.env.LOWDEFY_JOURNEY_FIXTURE_URL;
const configDirectory = process.env.LOWDEFY_JOURNEY_FIXTURE_DIRECTORY;
const fixtureTest = fixtureUrl === undefined ? test.skip : test;
const CLI = fileURLToPath(new URL('../../dist/index.js', import.meta.url));

const REVIEWED = `- name: saves a reviewed item
  pageId: home
  user: none
  tags: [review]
  steps:
    - fill: { blockId: name_input, value: Reviewed item }
    - click: save_button
    - wait: { request: save_item }
    - expect: { text: { blockId: save_success, contains: Item saved } }
`;

// Invalid on purpose: a run that reads it fails at once.
const DRAFT = `name: draft that must not run
pageId: home
steps: []
`;

function journeysPath(...segments) {
  return path.join(configDirectory, 'tests', 'journeys', ...segments);
}

function runTest(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [CLI, 'test', '--config-directory', configDirectory, '--url', fixtureUrl, ...args],
      { cwd: configDirectory, env: { ...process.env, LOWDEFY_DISABLE_TELEMETRY: 'true' } }
    );
    let output = '';
    child.stdout.on('data', (data) => {
      output += data;
    });
    child.stderr.on('data', (data) => {
      output += data;
    });
    child.on('error', reject);
    child.on('exit', (code) => resolve({ code, output }));
  });
}

function passedNames(output) {
  return [...output.matchAll(/PASS {2}(.+?) {2}\(/g)].map((match) => match[1]);
}

beforeAll(() => {
  if (configDirectory === undefined) return;
  fs.mkdirSync(journeysPath('review'), { recursive: true });
  fs.writeFileSync(journeysPath('review', 'reviewed.yaml'), REVIEWED);
  fs.mkdirSync(journeysPath('_drafts'), { recursive: true });
  fs.writeFileSync(journeysPath('_drafts', 'draft.yaml'), DRAFT);
});

afterAll(() => {
  if (configDirectory === undefined) return;
  fs.rmSync(journeysPath('review'), { recursive: true, force: true });
  fs.rmSync(journeysPath('_drafts'), { recursive: true, force: true });
});

fixtureTest('test with no paths runs the sub-folder journey and skips the "_" folder', async () => {
  const { code, output } = await runTest([]);
  expect(output).not.toContain('draft that must not run');
  expect(code).toBe(0);
  expect(passedNames(output).sort()).toEqual([
    'saves a reviewed item',
    'saves an item and sees the message',
  ]);
});

fixtureTest('test runs the same journey for a folder, its globs and its tag', async () => {
  for (const args of [
    ['tests/journeys/review'],
    ['tests/journeys/review/**'],
    ['tests/journeys/*/*.yaml', '--filter', 'reviewed'],
    ['--tag', 'review'],
    ['--tag', 'smoke', '--tag', 'review'],
  ]) {
    const { code, output } = await runTest(args);
    expect({ args, code, passed: passedNames(output) }).toEqual({
      args,
      code: 0,
      passed: ['saves a reviewed item'],
    });
  }
});

fixtureTest('test refuses a glob that matches nothing', async () => {
  const { code, output } = await runTest(['tests/journeys/missing/*.yaml']);
  expect(code).toBe(1);
  expect(output).toContain('Journey path "tests/journeys/missing/*.yaml" matches no files.');
});
