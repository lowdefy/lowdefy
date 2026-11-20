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
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { beforeAll, expect, test } from 'vitest';

// `lowdefy test --headless --build` from the built CLI over a production build of
// apps/journey-fixture: no dev server and no browser. The build is the one @lowdefy/test-utils'
// and @lowdefy/journey-headless' fixture suites make, in the same server copy.

const execFileAsync = promisify(execFile);
const repositoryRoot = path.resolve(fileURLToPath(new URL('../../../..', import.meta.url)));
const configDirectory = path.join(repositoryRoot, 'apps', 'journey-fixture');
const serverDirectory = path.join(repositoryRoot, '_server', 'test-utils-journey-fixture');
const CLI = fileURLToPath(new URL('../../dist/index.js', import.meta.url));
const browserJourney = path.join(configDirectory, 'tests', 'journeys', 'save.yaml');
const headlessJourney = path.join(configDirectory, 'tests', 'journeys', '_headless', 'save.yaml');

function runCli(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [CLI, ...args], {
      cwd: configDirectory,
      env: { ...process.env, LOWDEFY_DISABLE_TELEMETRY: 'true' },
    });
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

function runHeadless({ server = serverDirectory } = {}) {
  return runCli([
    'test',
    '--headless',
    '--build',
    '--config-directory',
    configDirectory,
    '--server-directory',
    server,
    browserJourney,
    headlessJourney,
  ]);
}

// A production build, as `lowdefy build --no-client-build` makes one (scripts/build.mjs). The
// monorepo is not rebuilt: run `pnpm build` first.
beforeAll(async () => {
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

test('--headless --build runs the headless journey and lists the browser journey as browser-only', async () => {
  const { code, output } = await runHeadless();
  expect(output).toMatch(
    /PASS {2}saves an item headless and sees it in state {2}\(5 steps, \d+ms\)/
  );
  expect(output).toContain(
    'BROWSER-ONLY  saves an item and sees the message  step 3 (expect: { text }): expect "text" reads the page in a browser'
  );
  expect(output).toContain('1 passed, 0 failed of 1 journeys, 1 browser-only not run');
  expect(code).toBe(0);
  const written = JSON.parse(
    fs.readFileSync(path.join(configDirectory, '.lowdefy', 'test', 'headless-run.json'), 'utf8')
  );
  expect(written).toEqual({
    version: 1,
    mode: 'build',
    journeys: {
      'tests/journeys/_headless/save.yaml#saves an item headless and sees it in state': {
        passed: true,
      },
      'tests/journeys/save.yaml#saves an item and sees the message': {
        browserOnly: {
          index: 3,
          step: { expect: { text: { blockId: 'save_success', contains: 'Item saved' } } },
          reason: 'expect "text" reads the page in a browser',
        },
      },
    },
  });
});

// The case table the config tests docs page shows (its sample matches this file), with its rows
// and steps read from tests/shared through _ref.
test('--headless --build runs a case table journey once per row', async () => {
  const { code, output } = await runCli([
    'test',
    '--headless',
    '--build',
    '--config-directory',
    configDirectory,
    '--server-directory',
    serverDirectory,
    path.join(configDirectory, 'tests', 'journeys', '_headless', 'cases.yaml'),
  ]);
  ['form', 'import', 'api'].forEach((row) => {
    expect(output).toMatch(
      new RegExp(`PASS {2}logs an activity from each source \\[${row}\\] {2}\\(4 steps, \\d+ms\\)`)
    );
  });
  expect(output).toContain('3 passed, 0 failed of 3 journeys');
  expect(code).toBe(0);
});

// pages/plugin_block.yaml's onMount calls a method on a block of the app's own plugin, which no
// headless stand-in models: the journey is browser-only on open, not failed.
test('--headless --build lists a journey whose open calls a plugin block method as browser-only', async () => {
  const { code, output } = await runCli([
    'test',
    '--headless',
    '--build',
    '--config-directory',
    configDirectory,
    '--server-directory',
    serverDirectory,
    path.join(configDirectory, 'tests', 'journeys', '_headless', 'plugin_block.yaml'),
  ]);
  expect(output).toContain(
    `BROWSER-ONLY  runs the plugin block's chain on mount  on open: Block "mount_chain" is of type FixtureActionChain, which has no headless stand-in for CallMethod run: the step runs in a browser.`
  );
  expect(output).not.toContain('FAIL');
  expect(output).toContain('0 passed, 0 failed of 0 journeys, 1 browser-only not run');
  expect(code).toBe(0);
  const written = JSON.parse(
    fs.readFileSync(path.join(configDirectory, '.lowdefy', 'test', 'headless-run.json'), 'utf8')
  );
  expect(written.journeys).toEqual({
    "tests/journeys/_headless/plugin_block.yaml#runs the plugin block's chain on mount": {
      browserOnly: {
        phase: 'open',
        reason:
          'Block "mount_chain" is of type FixtureActionChain, which has no headless stand-in for CallMethod run: the step runs in a browser.',
      },
    },
  });
});

// pages/live_feed.yaml subscribes to a websocket on mount: headless, the subscribe succeeds at once
// and no message arrives, so the journey passes with no app error and no subscribe timeout (10 s)
// waited out.
test('--headless --build passes a journey whose page subscribes to a websocket on mount', async () => {
  const { code, output } = await runCli([
    'test',
    '--headless',
    '--build',
    '--config-directory',
    configDirectory,
    '--server-directory',
    serverDirectory,
    path.join(configDirectory, 'tests', 'journeys', '_headless', 'live_feed.yaml'),
  ]);
  const passed = output.match(
    /PASS {2}opens a page that subscribes to a live feed {2}\(1 steps?, (\d+)ms\)/
  );
  expect(passed).not.toBeNull();
  expect(Number(passed[1])).toBeLessThan(5000);
  expect(output).not.toContain('client-error');
  expect(output).toContain('1 passed, 0 failed of 1 journeys');
  expect(code).toBe(0);
});

test('--headless --build with no build exits non-zero with the test harness message', async () => {
  const missing = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-no-build-'));
  try {
    const { code, output } = await runHeadless({ server: missing });
    expect(output).toContain(`No Lowdefy build found at "${path.join(missing, 'build')}".`);
    expect(code).toBe(1);
  } finally {
    fs.rmSync(missing, { recursive: true, force: true });
  }
});

test('--headless --build on a build older than the config exits non-zero with the test harness message', async () => {
  const refMap = path.join(serverDirectory, 'build', 'refMap.json');
  const { atime, mtime } = fs.statSync(refMap);
  fs.utimesSync(refMap, new Date(0), new Date(0));
  try {
    const { code, output } = await runHeadless();
    expect(output).toContain(
      `The Lowdefy build at "${path.join(serverDirectory, 'build')}" is older than config file`
    );
    expect(code).toBe(1);
  } finally {
    fs.utimesSync(refMap, atime, mtime);
  }
});

const fixtureUrl = process.env.LOWDEFY_JOURNEY_FIXTURE_URL;
const devServerTest = fixtureUrl === undefined ? test.skip : test;

devServerTest(
  '--headless runs the headless journey on the dev server and lists the browser journey',
  async () => {
    const { code, output } = await runCli([
      'test',
      '--headless',
      '--config-directory',
      process.env.LOWDEFY_JOURNEY_FIXTURE_DIRECTORY,
      '--url',
      fixtureUrl,
      browserJourney,
      headlessJourney,
    ]);
    expect(output).toMatch(
      /PASS {2}saves an item headless and sees it in state {2}\(5 steps, \d+ms\)/
    );
    expect(output).toContain(
      'BROWSER-ONLY  saves an item and sees the message  step 3 (expect: { text }): expect "text" reads the page in a browser'
    );
    expect(output).toContain('1 passed, 0 failed of 1 journeys, 1 browser-only not run');
    expect(code).toBe(0);
    const written = JSON.parse(
      fs.readFileSync(path.join(configDirectory, '.lowdefy', 'test', 'headless-run.json'), 'utf8')
    );
    expect(written.mode).toBe('dev');
  }
);

// The plugin block's journey that the headless runs list as browser-only passes in a browser,
// where the block's component registers its run method, and the dev server's headless run answers
// browserOnly on open for it.
devServerTest(
  'the plugin block journey passes in the browser and is browser-only on open headless',
  async () => {
    const journey = {
      pageId: 'plugin_block',
      user: 'none',
      steps: [{ expect: { state: { path: 'chain_ran', equals: true } } }],
    };
    const post = async (body) => {
      const response = await fetch(`${fixtureUrl}/lowdefy-docs/journey`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      return response.json();
    };
    const browser = await post(journey);
    expect(browser.failure).toBeUndefined();
    expect(browser.passed).toBe(true);
    const headless = await post({ ...journey, headless: true });
    expect(headless.passed).toBeUndefined();
    expect(headless.browserOnly).toEqual({
      phase: 'open',
      reason:
        'Block "mount_chain" is of type FixtureActionChain, which has no headless stand-in for CallMethod run: the step runs in a browser.',
    });
  }
);

// The live feed journey passes in the browser, where the page's subscription opens on the dev
// server's websocket, and headless, where it succeeds with no socket.
devServerTest('the live feed journey passes in the browser and headless', async () => {
  const journey = {
    pageId: 'live_feed',
    user: 'none',
    steps: [{ expect: { state: { path: 'subscribed', equals: true } } }],
  };
  const post = async (body) => {
    const response = await fetch(`${fixtureUrl}/lowdefy-docs/journey`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    return response.json();
  };
  const browser = await post(journey);
  expect(browser.failure).toBeUndefined();
  expect(browser.passed).toBe(true);
  const headless = await post({ ...journey, headless: true });
  expect(headless.failure).toBeUndefined();
  expect(headless.browserOnly).toBeUndefined();
  expect(headless.passed).toBe(true);
});
