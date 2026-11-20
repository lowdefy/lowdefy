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

import { execFile, spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify, stripVTControlCharacters } from 'node:util';
import { beforeAll, expect, test } from 'vitest';

// The headless parity proof for journey files: apps/journey-fixture's journeys run with
// `lowdefy test` in the browser (the fixture's dev server) and with `lowdefy test --headless
// --build` on a production build, and every journey the headless run took gives the same result
// as in the browser. A journey the headless run lists as browser-only is not compared. The
// inline fixture journeys get the same check in server-dev's journey fixture client.

const execFileAsync = promisify(execFile);
const fixtureUrl = process.env.LOWDEFY_JOURNEY_FIXTURE_URL;
const configDirectory = process.env.LOWDEFY_JOURNEY_FIXTURE_DIRECTORY;
const fixtureTest = fixtureUrl === undefined ? test.skip : test;
const repositoryRoot = path.resolve(fileURLToPath(new URL('../../../..', import.meta.url)));
// A server copy of its own, so this file and headless.test.mjs never build into one at once.
const serverDirectory = path.join(repositoryRoot, '_server', 'cli-parity-journey-fixture');
const CLI = fileURLToPath(new URL('../../dist/index.js', import.meta.url));
const JOURNEYS = ['tests/journeys/save.yaml', 'tests/journeys/_headless/save.yaml'];

function runCli(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [CLI, 'test', '--config-directory', configDirectory, ...args],
      {
        cwd: configDirectory,
        env: { ...process.env, LOWDEFY_DISABLE_TELEMETRY: 'true' },
      }
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

// Each journey's result in a browser run's output, by name: true for PASS, false for FAIL. The
// logger may prefix a line with its time and colour it.
function readBrowserResults(output) {
  const plain = stripVTControlCharacters(output);
  return Object.fromEntries(
    plain
      .split('\n')
      .map((line) => line.match(/(PASS|FAIL) {2,3}(.+?)(?: {2,3}\(.*)?\s*$/))
      .filter((match) => match !== null)
      .map((match) => [match[2].trim(), match[1] === 'PASS'])
  );
}

beforeAll(async () => {
  if (configDirectory === undefined) return;
  await execFileAsync(
    process.execPath,
    [
      path.join(repositoryRoot, 'scripts', 'build.mjs'),
      '--skip-build',
      '--no-client-build',
      '--log-level',
      'error',
      '--config-directory',
      configDirectory,
      '--server-directory',
      serverDirectory,
    ],
    { cwd: repositoryRoot, maxBuffer: 64 * 1024 * 1024 }
  );
});

fixtureTest(
  'every journey file a headless run takes gives the result it gives in the browser',
  async () => {
    const browser = await runCli(['--url', fixtureUrl, ...JOURNEYS]);
    const browserResults = readBrowserResults(browser.output);
    expect(browser.code, browser.output).toBe(0);
    const headless = await runCli([
      '--headless',
      '--build',
      '--server-directory',
      serverDirectory,
      ...JOURNEYS,
    ]);
    const { journeys } = JSON.parse(
      fs.readFileSync(path.join(configDirectory, '.lowdefy', 'test', 'headless-run.json'), 'utf8')
    );
    const compared = Object.entries(journeys).filter(
      ([, result]) => result.browserOnly === undefined
    );
    const browserOnly = Object.keys(journeys).filter(
      (key) => journeys[key].browserOnly !== undefined
    );
    // Both journey files ran in the browser; the headless run took one and left the other.
    expect(Object.keys(browserResults).sort()).toEqual([
      'saves an item and sees the message',
      'saves an item headless and sees it in state',
    ]);
    expect(compared).toHaveLength(1);
    expect(browserOnly).toEqual(['tests/journeys/save.yaml#saves an item and sees the message']);
    compared.forEach(([key, result]) => {
      const name = key.slice(key.indexOf('#') + 1);
      expect({ name, passed: result.passed }).toEqual({ name, passed: browserResults[name] });
    });
    expect(headless.code, headless.output).toBe(0);
  }
);
