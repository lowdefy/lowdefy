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
// A title check needs a browser; save.yaml's text check runs headless (LDF-1147).
const browserJourney = path.join(configDirectory, 'tests', 'journeys', '_browser', 'title.yaml');
const textJourney = path.join(configDirectory, 'tests', 'journeys', 'save.yaml');
const headlessJourney = path.join(configDirectory, 'tests', 'journeys', '_headless', 'save.yaml');

// Outside CI unless `env` sets CI, also when the suite runs in CI.
function runCli(args, env = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [CLI, ...args], {
      cwd: configDirectory,
      env: { ...process.env, CI: '', LOWDEFY_DISABLE_TELEMETRY: 'true', ...env },
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

// The production build's id, which a --build run takes its headless-run.json records on.
function buildId() {
  return JSON.parse(fs.readFileSync(path.join(serverDirectory, 'build', 'appMeta.json'), 'utf8'))
    .buildId;
}

function headlessRunPath() {
  return path.join(configDirectory, '.lowdefy', 'test', 'headless-run.json');
}

function runHeadless({ server = serverDirectory, mode = ['--headless'], env } = {}) {
  return runCli(
    [
      'test',
      ...mode,
      '--build',
      '--config-directory',
      configDirectory,
      '--server-directory',
      server,
      browserJourney,
      textJourney,
      headlessJourney,
    ],
    env
  );
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

test('--headless --build runs the headless journeys and lists the browser journey as browser-only', async () => {
  // headless-run.json keeps the records of journeys a run did not take: start from none.
  fs.rmSync(headlessRunPath(), { force: true });
  const { code, output } = await runHeadless();
  expect(output).toMatch(
    /PASS {2}saves an item headless and sees it in state {2}\(5 steps, \d+ms\)/
  );
  expect(output).toMatch(/PASS {2}saves an item and sees the message {2}\(4 steps, \d+ms\)/);
  expect(output).toContain(
    'BROWSER-ONLY  reads the page title  step 0 (expect: { title }): expect "title" reads the page in a browser'
  );
  expect(output).toContain('2 passed, 0 failed of 2 journeys, 1 browser-only not run');
  expect(code).toBe(0);
  const written = JSON.parse(fs.readFileSync(headlessRunPath(), 'utf8'));
  // The production build's records carry no config hash, so a dev run never reads them.
  // Taken on the production build, by its build id.
  const hashes = {
    hash: expect.stringMatching(/^[0-9a-f]{40}$/),
    configHashes: [buildId()],
  };
  expect(written).toEqual({
    version: 1,
    mode: 'build',
    journeys: {
      'tests/journeys/_headless/save.yaml#saves an item headless and sees it in state': {
        passed: true,
        ...hashes,
      },
      'tests/journeys/_browser/title.yaml#reads the page title': {
        browserOnly: {
          index: 0,
          step: { expect: { title: { contains: 'home' } } },
          reason: 'expect "title" reads the page in a browser',
        },
        ...hashes,
      },
      'tests/journeys/save.yaml#saves an item and sees the message': { passed: true, ...hashes },
    },
  });
});

test('in CI --build with no mode flag fails on the browser journey, and --headless --build exits 0', async () => {
  fs.rmSync(headlessRunPath(), { force: true });
  const plain = await runHeadless({ mode: [], env: { CI: 'true' } });
  expect(plain.output).toContain('2 passed, 0 failed of 2 journeys, 1 browser-only not run');
  expect(plain.output).toContain(
    "1 journey needs a browser and did not run. In CI, lowdefy test without --headless, --thorough or --browser fails when it skips a browser journey. To fix this, run them in the browser on the dev server with lowdefy test --thorough, without --build, or pass --headless to say on purpose that browser journeys don't run here."
  );
  expect(plain.code).toBe(1);

  const headless = await runHeadless({ env: { CI: 'true' } });
  expect(headless.output).toContain('2 passed, 0 failed of 2 journeys, 1 browser-only not run');
  expect(headless.output).not.toContain('In CI');
  expect(headless.code).toBe(0);
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

// pages/plugin_block.yaml's onMount calls `run` on a block of the app's own plugin, which no
// headless stand-in models. The block's meta declares that `run` fires onRun, so the mount
// journey passes headless; its `stop` method is undeclared, so the journey that calls it is
// browser-only at that click, not failed.
test("--headless --build runs a plugin block's declared method and lists an undeclared one as browser-only", async () => {
  fs.rmSync(headlessRunPath(), { force: true });
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
  expect(output).toContain("PASS  runs the plugin block's chain on mount");
  expect(output).toContain(
    `BROWSER-ONLY  stops the plugin block's chain  step 0 (click "stop_chain_button"): Block "mount_chain" is of type FixtureActionChain, which has no headless stand-in for CallMethod stop: the step runs in a browser.`
  );
  expect(output).not.toContain('FAIL');
  expect(output).toContain('1 passed, 0 failed of 1 journeys, 1 browser-only not run');
  expect(code).toBe(0);
  const written = JSON.parse(fs.readFileSync(headlessRunPath(), 'utf8'));
  // Taken on the production build, by its build id.
  const hashes = {
    hash: expect.stringMatching(/^[0-9a-f]{40}$/),
    configHashes: [buildId()],
  };
  expect(written.journeys).toEqual({
    "tests/journeys/_headless/plugin_block.yaml#runs the plugin block's chain on mount": {
      passed: true,
      ...hashes,
    },
    "tests/journeys/_headless/plugin_block.yaml#stops the plugin block's chain": {
      browserOnly: {
        index: 0,
        step: { click: 'stop_chain_button' },
        reason:
          'Block "mount_chain" is of type FixtureActionChain, which has no headless stand-in for CallMethod stop: the step runs in a browser.',
      },
      ...hashes,
    },
  });

  // The same build: the browser-only journey is listed, not run up to its step again.
  const again = await runCli([
    'test',
    '--build',
    '--config-directory',
    configDirectory,
    '--server-directory',
    serverDirectory,
    path.join(configDirectory, 'tests', 'journeys', '_headless', 'plugin_block.yaml'),
  ]);
  expect(again.output).toContain(
    `BROWSER-ONLY  stops the plugin block's chain  step 0 (click "stop_chain_button"): Block "mount_chain" is of type FixtureActionChain, which has no headless stand-in for CallMethod stop: the step runs in a browser; found by an earlier run, not run again`
  );
  expect(again.output).toContain(
    'Run them in the browser: lowdefy test --thorough tests/journeys/_headless/plugin_block.yaml'
  );
  expect(again.code).toBe(0);
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
      textJourney,
      headlessJourney,
    ]);
    expect(output).toMatch(
      /PASS {2}saves an item headless and sees it in state {2}\(5 steps, \d+ms\)/
    );
    expect(output).toMatch(/PASS {2}saves an item and sees the message {2}\(4 steps, \d+ms\)/);
    expect(output).toContain(
      'BROWSER-ONLY  reads the page title  step 0 (expect: { title }): expect "title" reads the page in a browser'
    );
    expect(output).toContain('2 passed, 0 failed of 2 journeys, 1 browser-only not run');
    expect(code).toBe(0);
    const written = JSON.parse(
      fs.readFileSync(path.join(configDirectory, '.lowdefy', 'test', 'headless-run.json'), 'utf8')
    );
    expect(written.mode).toBe('dev');
  }
);

// The plugin block's journeys pass in a browser, where the block's component registers its
// methods. On the dev server's headless run the mount journey passes too, since the block's meta
// declares that `run` fires onRun, and the stop journey is browser-only at its click, since
// `stop` is undeclared.
devServerTest(
  'the plugin block journeys pass in the browser, and headless where the meta declares the method',
  async () => {
    const mount = {
      pageId: 'plugin_block',
      user: 'none',
      steps: [{ expect: { state: { path: 'chain_ran', equals: true } } }],
    };
    const stop = {
      pageId: 'plugin_block',
      user: 'none',
      steps: [
        { click: 'stop_chain_button' },
        { expect: { state: { path: 'chain_stopped', equals: true } } },
      ],
    };
    const post = async (body) => {
      const response = await fetch(`${fixtureUrl}/lowdefy-docs/journey`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      return response.json();
    };
    for (const journey of [mount, stop]) {
      const browser = await post(journey);
      expect(browser.failure).toBeUndefined();
      expect(browser.passed).toBe(true);
    }
    const headlessMount = await post({ ...mount, headless: true });
    expect(headlessMount.browserOnly).toBeUndefined();
    expect(headlessMount.passed).toBe(true);
    const headlessStop = await post({ ...stop, headless: true });
    expect(headlessStop.passed).toBeUndefined();
    expect(headlessStop.browserOnly).toEqual({
      index: 0,
      step: { click: 'stop_chain_button' },
      reason:
        'Block "mount_chain" is of type FixtureActionChain, which has no headless stand-in for CallMethod stop: the step runs in a browser.',
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
