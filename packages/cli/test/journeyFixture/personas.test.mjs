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

// A journey with a list of users, run by the built CLI over the fixture app:
// once per user, each in its own data session, reported as "<name> [<user>]".
// Each run posts its own user, which the dev server looks up in the data set:
// admin and member pass, and "ghost", a name the data set does not have, is
// refused for that run alone. The journey written here is removed
// afterwards, so the fixture's tests/journeys stays as the other fixture
// tests expect it.

const fixtureUrl = process.env.LOWDEFY_JOURNEY_FIXTURE_URL;
const configDirectory = process.env.LOWDEFY_JOURNEY_FIXTURE_DIRECTORY;
const fixtureTest = fixtureUrl === undefined ? test.skip : test;
const CLI = fileURLToPath(new URL('../../dist/index.js', import.meta.url));

const PERSONAS = `name: sees the save button
pageId: home
data: personas
user: [admin, member, ghost]
steps:
  - expect: { visible: save_button }
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

beforeAll(() => {
  if (configDirectory === undefined) return;
  fs.mkdirSync(journeysPath('personas'), { recursive: true });
  fs.writeFileSync(journeysPath('personas', 'personas.yaml'), PERSONAS);
});

afterAll(() => {
  if (configDirectory === undefined) return;
  fs.rmSync(journeysPath('personas'), { recursive: true, force: true });
});

fixtureTest('test runs a journey once as each listed user and reports each run', async () => {
  const { code, output } = await runTest(['tests/journeys/personas']);
  expect(output).toMatch(/PASS {2}sees the save button \[admin\] {2}\(/);
  expect(output).toMatch(/PASS {2}sees the save button \[member\] {2}\(/);
  expect(output).toContain('FAIL  sees the save button [ghost]');
  expect(output).toContain('declares no user');
  expect(output).toContain('2 passed, 1 failed of 3 journeys');
  expect(code).toBe(1);
});

fixtureTest('test --filter runs one persona of the journey', async () => {
  const { code, output } = await runTest(['tests/journeys/personas', '--filter', '[member]']);
  expect(output).toMatch(/PASS {2}sees the save button \[member\] {2}\(/);
  expect(output).not.toContain('[admin]');
  expect(output).not.toContain('[ghost]');
  expect(output).toContain('1 passed, 0 failed of 1 journeys');
  expect(code).toBe(0);
});
