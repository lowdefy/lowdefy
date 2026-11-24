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
import { afterAll, beforeAll, beforeEach, expect, test } from 'vitest';

// `lowdefy test`'s default and --thorough runs from the built CLI on the fixture's dev server: each
// journey once, headless when it can and in the browser when it can't. The journey written here
// takes a screenshot, which the classifier marks browser-only before the run; the second journey of
// _headless/plugin_block.yaml clicks a button that calls a plugin block method no headless stand-in
// declares, which the headless run finds partway through; _headless/save.yaml runs headless.

const fixtureUrl = process.env.LOWDEFY_JOURNEY_FIXTURE_URL;
const configDirectory = process.env.LOWDEFY_JOURNEY_FIXTURE_DIRECTORY;
const fixtureTest = fixtureUrl === undefined ? test.skip : test;
const CLI = fileURLToPath(new URL('../../dist/index.js', import.meta.url));
const repositoryRoot = path.resolve(fileURLToPath(new URL('../../../..', import.meta.url)));
// The fixture dev server's build (scripts/lib/startJourneyFixture.mjs), whose hash the run reads.
const devDirectory = path.join(repositoryRoot, '_server', 'dev-journey-fixture');

const FOUND = "stops the plugin block's chain";

// Written for these tests and removed afterwards, so the fixture's tests/journeys stays as the
// other fixture tests expect it.
const SCREENSHOT = `name: screenshots the home page
pageId: home
steps:
  - expect: { visible: home_title }
  - screenshot: home
`;

function journeysPath(...segments) {
  return path.join(configDirectory, 'tests', 'journeys', ...segments);
}

function runTest(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [
        CLI,
        'test',
        '--config-directory',
        configDirectory,
        '--dev-directory',
        devDirectory,
        '--url',
        fixtureUrl,
        ...args,
        path.join('tests', 'journeys', '_mixed', 'screenshot.yaml'),
        path.join('tests', 'journeys', '_headless', 'plugin_block.yaml'),
        path.join('tests', 'journeys', '_headless', 'save.yaml'),
      ],
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

function headlessRunPath() {
  return path.join(configDirectory, '.lowdefy', 'test', 'headless-run.json');
}

function lineOf({ output, name }) {
  return output.split('\n').find((line) => line.includes(`  ${name}  `));
}

beforeAll(() => {
  if (configDirectory === undefined) return;
  fs.mkdirSync(journeysPath('_mixed'), { recursive: true });
  fs.writeFileSync(journeysPath('_mixed', 'screenshot.yaml'), SCREENSHOT);
});

afterAll(() => {
  if (configDirectory === undefined) return;
  fs.rmSync(journeysPath('_mixed'), { recursive: true, force: true });
});

beforeEach(() => {
  if (configDirectory === undefined) return;
  fs.rmSync(headlessRunPath(), { force: true });
});

fixtureTest(
  'a default run reports a journey found partway through, and the next run takes it to the browser',
  async () => {
    const first = await runTest([]);
    expect(lineOf({ output: first.output, name: 'screenshots the home page' })).toMatch(
      /PASS {2}screenshots the home page {2}\(2 steps, \d+ms\) {2}\[browser\]/
    );
    expect(
      lineOf({ output: first.output, name: "runs the plugin block's chain on mount" })
    ).toMatch(
      /PASS {2}runs the plugin block's chain on mount {2}\(1 steps, \d+ms\) {2}\[headless\]/
    );
    expect(
      lineOf({ output: first.output, name: 'saves an item headless and sees it in state' })
    ).toMatch(/\[headless\]/);
    expect(lineOf({ output: first.output, name: FOUND })).toMatch(
      new RegExp(`BROWSER-ONLY {2}${FOUND} {2}step 0 \\(click "stop_chain_button"\\): `)
    );
    expect(first.output).toContain('3 passed, 0 failed of 3 journeys, 1 browser-only not run');
    expect(first.code).toBe(0);
    const recorded = JSON.parse(fs.readFileSync(headlessRunPath(), 'utf8')).journeys[
      `tests/journeys/_headless/plugin_block.yaml#${FOUND}`
    ];
    expect(recorded.browserOnly.index).toBe(0);
    expect(recorded.configHashes.length).toBeGreaterThan(0);

    const second = await runTest([]);
    expect(lineOf({ output: second.output, name: FOUND })).toMatch(
      new RegExp(`PASS {2}${FOUND} {2}\\(2 steps, \\d+ms\\) {2}\\[browser\\]`)
    );
    expect(second.output).not.toContain('BROWSER-ONLY');
    expect(second.output).toContain('4 passed, 0 failed of 4 journeys');
    expect(second.code).toBe(0);
  }
);

fixtureTest(
  'a thorough run takes a journey found partway through to the browser in the same run',
  async () => {
    const { code, output } = await runTest(['--thorough']);
    expect(output).toMatch(
      new RegExp(
        `BROWSER-ONLY {2}${FOUND} {2}step 0 \\(click "stop_chain_button"\\): .*; running it in the browser`
      )
    );
    expect(output).toMatch(
      new RegExp(`PASS {2}${FOUND} {2}\\(2 steps, \\d+ms\\) {2}\\[browser\\]`)
    );
    expect(output).toContain('4 passed, 0 failed of 4 journeys');
    expect(code).toBe(0);
  }
);
