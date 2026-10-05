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
// The page shows its panel to admin only, so the admin run passes and the
// member run fails. The journey written here is removed afterwards, so the
// fixture's tests/journeys stays as the other fixture tests expect it.

const fixtureUrl = process.env.LOWDEFY_JOURNEY_FIXTURE_URL;
const configDirectory = process.env.LOWDEFY_JOURNEY_FIXTURE_DIRECTORY;
const fixtureTest = fixtureUrl === undefined ? test.skip : test;
const CLI = fileURLToPath(new URL('../../dist/index.js', import.meta.url));

const PERSONAS = `name: sees the admin panel
pageId: personas
data: personas
user: [admin, member]
steps:
  - expect: { visible: personas_title }
  - expect: { visible: admin_panel }
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
  expect(output).toMatch(/PASS {2}sees the admin panel \[admin\] {2}\(/);
  expect(output).toContain('FAIL  sees the admin panel [member]');
  expect(output).toContain('1 passed, 1 failed of 2 journeys');
  expect(code).toBe(1);
});

fixtureTest('test --filter runs one persona of the journey', async () => {
  const { code, output } = await runTest(['tests/journeys/personas', '--filter', '[admin]']);
  expect(output).toMatch(/PASS {2}sees the admin panel \[admin\] {2}\(/);
  expect(output).not.toContain('[member]');
  expect(output).toContain('1 passed, 0 failed of 1 journeys');
  expect(code).toBe(0);
});
