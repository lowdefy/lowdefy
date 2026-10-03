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
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// `lowdefy journeys harden` from the built CLI over the fixture app: the
// journey asserts the save message and nothing else.

const fixtureUrl = process.env.LOWDEFY_JOURNEY_FIXTURE_URL;
const configDirectory = process.env.LOWDEFY_JOURNEY_FIXTURE_DIRECTORY;
const fixtureTest = fixtureUrl === undefined ? test.skip : test;
const CLI = fileURLToPath(new URL('../../dist/index.js', import.meta.url));

function runCli(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [CLI, ...args], {
      env: { ...process.env, LOWDEFY_DISABLE_TELEMETRY: 'true' },
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (data) => {
      stdout += data;
    });
    child.stderr.on('data', (data) => {
      stderr += data;
    });
    child.on('error', reject);
    child.on('exit', (code) => resolve({ code, stdout, stderr }));
  });
}

function hashJourneyFiles() {
  const directory = path.join(configDirectory, 'tests', 'journeys');
  return fs
    .readdirSync(directory)
    .sort()
    .map((name) => [
      name,
      crypto
        .createHash('sha1')
        .update(fs.readFileSync(path.join(directory, name)))
        .digest('hex'),
    ]);
}

fixtureTest(
  'harden kills the dropped save action and reports the unasserted alert as a survivor with its source line',
  async () => {
    const before = hashJourneyFiles();
    const { code, stdout, stderr } = await runCli([
      'journeys',
      'harden',
      '--config-directory',
      configDirectory,
      '--url',
      fixtureUrl,
      '--operators',
      'drop-action,drop-block',
      '--json',
      '--log-level',
      'error',
    ]);
    expect(stderr).toBe('');
    expect(code).toBe(0);
    const report = JSON.parse(stdout);
    const byDescribe = Object.fromEntries(
      report.mutants.map((mutant) => [mutant.describe, mutant])
    );
    const alert = byDescribe['drop-block Alert "unasserted_alert" from home'];
    expect(alert.status).toBe('survived');
    expect(alert.source).toMatch(/^pages\/home\.yaml:\d+$/);
    expect(alert.ranBy).toEqual([
      {
        file: 'tests/journeys/save.yaml',
        name: 'saves an item and sees the message',
        verdict: 'survived',
        failure: null,
        misses: [],
      },
    ]);
    const save = byDescribe['drop-action Request "save" (1 of 2) from save_button.onClick'];
    expect(save.status).toBe('killed');
    expect(save.ranBy[0].failure.index).toBe(2);
    expect(report.journeys).toEqual([
      {
        file: 'tests/journeys/save.yaml',
        name: 'saves an item and sees the message',
        killed: report.killed,
        total: report.total,
        unique: report.killed,
      },
    ]);
    expect(report.operators).toEqual(['drop-action', 'drop-block']);
    const written = JSON.parse(
      fs.readFileSync(path.join(configDirectory, '.lowdefy', 'test', 'mutation.json'), 'utf8')
    );
    expect(written).toEqual(report);
    expect(hashJourneyFiles()).toEqual(before);
  }
);
