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

import { vi, afterEach, beforeEach, expect, onTestFinished, test } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import YAML from 'yaml';

import flowLines from '../journeys/evidence/flowLines.js';
import sequenceId from '../journeys/evidence/sequenceId.js';

const mockPost = vi.fn();
const mockGet = vi.fn();
// The dev server as these tests see it: mockGet(url) and mockPost(url, body) answer
// { status, data }, or reject as a network failure would.
vi.stubGlobal('fetch', async (url, init = {}) => {
  const { status = 200, data } =
    init.method === 'POST' ? await mockPost(url, JSON.parse(init.body)) : await mockGet(url);
  return Response.json(data ?? null, { status });
});

// The config text set the tier ranking reads: "Save" is config text, a grid
// cell's data value is not.
const mockReadConfigText = vi.fn(async () => ({
  texts: new Set(['Save']),
  isConfigText: (text) => text === 'Save',
}));
vi.doMock('../journeys/configText/readConfigText.js', () => ({
  default: mockReadConfigText,
}));

const mockStop = vi.fn();
const mockStartDevServer = vi.fn();
vi.doMock('./startDevServer.js', () => ({
  default: mockStartDevServer,
}));

// The slot files live in LOWDEFY_HOME, shared by the machine; acquireJourneyRunSlots has its own tests.
const mockReleaseSlots = vi.fn();
const mockAcquireJourneyRunSlots = vi.fn();
vi.doMock('./acquireJourneyRunSlots.js', () => ({
  default: mockAcquireJourneyRunSlots,
}));

// The headless run's harness and runner, loaded only by --build.
const mockOpenTestApp = vi.fn();
vi.doMock('@lowdefy/test-utils', () => ({ openTestApp: mockOpenTestApp }));
const mockCreateBuildHost = vi.fn();
const mockRunHeadlessJourney = vi.fn();
const mockHostClose = vi.fn();
vi.doMock('@lowdefy/journey-headless', () => ({
  createBuildHost: mockCreateBuildHost,
  runHeadlessJourney: mockRunHeadlessJourney,
}));

// The machine's memory pressure would hold a --concurrency run at one on a busy machine.
const mockReadMemoryPressure = vi.fn(() => 'normal');
vi.doMock('../hub/readMemoryPressure.js', () => ({ default: mockReadMemoryPressure }));

let configDirectory;
let context;
let logs;
const originalExitCode = process.exitCode;

function writeJourneyFile(fileName, content) {
  const filePath = path.join(configDirectory, 'tests', 'journeys', fileName);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function journeyYaml({ name, steps = '  - click: submit\n' }) {
  return `name: ${name}\npageId: form\nsteps:\n${steps}`;
}

beforeEach(() => {
  process.exitCode = undefined;
  configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-test-command-'));
  logs = { info: [], warn: [], error: [] };
  context = {
    directories: {
      config: configDirectory,
      dev: path.join(configDirectory, '.lowdefy', 'dev'),
      build: path.join(configDirectory, '.lowdefy', 'server', 'build'),
      journeys: path.join(configDirectory, 'tests', 'journeys'),
      test: path.join(configDirectory, '.lowdefy', 'test'),
      traces: path.join(configDirectory, '.lowdefy', 'traces'),
    },
    options: { port: 3000 },
    logger: {
      info: (line) => logs.info.push(line),
      warn: (line) => logs.warn.push(line),
      error: (line) => logs.error.push(line),
      debug: vi.fn(),
    },
    sendTelemetry: vi.fn(),
  };
  mockReadConfigText.mockClear();
  mockStop.mockResolvedValue();
  mockStartDevServer.mockResolvedValue({ url: 'http://localhost:3228', stop: mockStop });
  mockReleaseSlots.mockReset();
  mockAcquireJourneyRunSlots.mockReset();
  mockAcquireJourneyRunSlots.mockResolvedValue({ release: mockReleaseSlots });
  mockPost.mockResolvedValue({ data: { passed: true, steps: [] } });
  mockGet.mockResolvedValue({ data: { buildId: 'build-1' } });
  mockOpenTestApp.mockReset();
  mockOpenTestApp.mockResolvedValue({ buildId: 'build-id-1', close: vi.fn() });
  mockHostClose.mockReset();
  mockCreateBuildHost.mockReset();
  mockCreateBuildHost.mockResolvedValue({ close: mockHostClose });
  mockRunHeadlessJourney.mockReset();
  mockRunHeadlessJourney.mockResolvedValue({ pageId: 'form', passed: true, steps: [] });
});

afterEach(() => {
  process.exitCode = originalExitCode;
  fs.rmSync(configDirectory, { recursive: true, force: true });
});

test('test exits 0 with a note when no journeys exist and does not boot a server', async () => {
  const { default: test } = await import('./test.js');
  await test({ context });
  expect(mockStartDevServer).not.toHaveBeenCalled();
  expect(mockPost).not.toHaveBeenCalled();
  expect(logs.warn).toEqual(['No tests found. Add journeys to tests/journeys/.']);
  expect(process.exitCode).toBeUndefined();
  expect(context.sendTelemetry).toHaveBeenCalled();
});

test('test boots a dev server, runs every journey and exits 0 when all pass', async () => {
  const { default: test } = await import('./test.js');
  writeJourneyFile('a.yaml', journeyYaml({ name: 'first journey' }));
  writeJourneyFile('b.yaml', journeyYaml({ name: 'second journey' }));
  await test({ context });
  expect(mockStartDevServer).toHaveBeenCalledWith({ context });
  expect(mockPost).toHaveBeenCalledTimes(2);
  expect(mockPost.mock.calls[0][0]).toEqual('http://localhost:3228/lowdefy-docs/journey');
  expect(mockStop).toHaveBeenCalledTimes(1);
  expect(logs.info.filter((line) => line.startsWith('PASS'))).toHaveLength(2);
  expect(logs.info[logs.info.length - 1]).toEqual('2 passed, 0 failed of 2 journeys');
  expect(process.exitCode).toBeUndefined();
});

test('test exits 1 and prints the failing step, expected and actual when a journey fails', async () => {
  const { default: test } = await import('./test.js');
  context.options.browser = true;
  writeJourneyFile('a.yaml', journeyYaml({ name: 'passing journey' }));
  writeJourneyFile(
    'b.yaml',
    journeyYaml({
      name: 'failing journey',
      steps: '  - click: submit\n  - expect: { state: { path: title, equals: done } }\n',
    })
  );
  mockPost.mockResolvedValueOnce({ data: { passed: true, steps: [] } }).mockResolvedValueOnce({
    data: {
      passed: false,
      steps: [],
      failure: {
        index: 1,
        step: { expect: { state: { path: 'title', equals: 'done' } } },
        expected: 'done',
        actual: 'draft',
        message: 'Expected state at "title" to equal "done".',
      },
    },
  });
  await test({ context });
  expect(process.exitCode).toEqual(1);
  expect(logs.error).toEqual([
    'FAIL  failing journey',
    `      file: ${path.join(configDirectory, 'tests', 'journeys', 'b.yaml')}`,
    '      step 1: { expect: { state: { path: title, equals: done } } }',
    '      expected: done',
    '      actual:   draft',
    '      Expected state at "title" to equal "done".',
    '1 passed, 1 failed of 2 journeys',
  ]);
  expect(mockStop).toHaveBeenCalledTimes(1);
});

test('test --filter narrows the journeys case-insensitively', async () => {
  const { default: test } = await import('./test.js');
  writeJourneyFile('a.yaml', journeyYaml({ name: 'Member creates a control' }));
  writeJourneyFile('b.yaml', journeyYaml({ name: 'admin deletes a control' }));
  writeJourneyFile('c.yaml', journeyYaml({ name: 'guest views the list' }));
  context.options.filter = 'CONTROL';
  await test({ context });
  expect(mockPost).toHaveBeenCalledTimes(2);
  expect(logs.info).toContain('2 passed, 0 failed of 2 journeys');
  expect(process.exitCode).toBeUndefined();
});

test('test exits 1 when an explicit --filter matches no journey', async () => {
  const { default: test } = await import('./test.js');
  writeJourneyFile('a.yaml', journeyYaml({ name: 'first journey' }));
  context.options.filter = 'nothing';
  await test({ context });
  expect(mockStartDevServer).not.toHaveBeenCalled();
  expect(logs.error).toEqual(['No tests matched --filter "nothing".']);
  expect(process.exitCode).toEqual(1);
});

test('test exits 1 when a named --journeys-directory holds no journeys', async () => {
  const { default: test } = await import('./test.js');
  writeJourneyFile('a.yaml', journeyYaml({ name: 'default journey' }));
  const directory = path.join(configDirectory, 'tests', 'auth-journeys');
  context.options.journeysDirectory = directory;
  context.directories.journeys = directory;
  await test({ context });
  expect(mockStartDevServer).not.toHaveBeenCalled();
  expect(mockPost).not.toHaveBeenCalled();
  expect(logs.error).toEqual([`No journeys found in ${directory}.`]);
  expect(process.exitCode).toEqual(1);
});

test('test --url targets a running server and does not boot or stop one', async () => {
  const { default: test } = await import('./test.js');
  writeJourneyFile('a.yaml', journeyYaml({ name: 'first journey' }));
  context.options.url = 'http://localhost:3000/';
  await test({ context });
  expect(mockStartDevServer).not.toHaveBeenCalled();
  expect(mockStop).not.toHaveBeenCalled();
  expect(mockPost.mock.calls[0][0]).toEqual('http://localhost:3000/lowdefy-docs/journey');
  expect(logs.info[0]).toEqual('Running tests against http://localhost:3000/.');
});

test('test reports a malformed journey file as a failure and still runs the others', async () => {
  const { default: test } = await import('./test.js');
  context.options.browser = true;
  writeJourneyFile('a.yaml', 'name: no steps here\npageId: form\n');
  writeJourneyFile('b.yaml', journeyYaml({ name: 'valid journey' }));
  await test({ context });
  expect(mockPost).toHaveBeenCalledTimes(1);
  expect(logs.error[0]).toEqual('FAIL  no steps here');
  expect(logs.error[2]).toEqual(
    '      Invalid journey file: Journey should have required property "steps".'
  );
  expect(logs.info.some((line) => /^PASS {2}valid journey {2}\(1 steps, \d+ms\)$/.test(line))).toBe(
    true
  );
  expect(logs.error[logs.error.length - 1]).toEqual('1 passed, 1 failed of 2 journeys');
  expect(process.exitCode).toEqual(1);
});

test('test stops the dev server when a journey run throws', async () => {
  const { default: test } = await import('./test.js');
  writeJourneyFile('a.yaml', journeyYaml({ name: 'first journey' }));
  mockPost.mockImplementation(() => {
    throw new TypeError('unexpected');
  });
  await test({ context });
  // runJourney turns a rejected post into a failed result, so the run completes and stops the server.
  expect(mockStop).toHaveBeenCalledTimes(1);
  expect(process.exitCode).toEqual(1);
});

test('test logs the captured server output and rethrows when the dev server fails to boot', async () => {
  const { default: test } = await import('./test.js');
  writeJourneyFile('a.yaml', journeyYaml({ name: 'first journey' }));
  const bootError = new Error('Development server was not ready within 120000ms.');
  bootError.serverOutput = ['line one', 'line two'];
  mockStartDevServer.mockRejectedValue(bootError);
  await expect(test({ context })).rejects.toThrow(
    'Development server was not ready within 120000ms.'
  );
  expect(logs.error).toEqual(['line one', 'line two']);
  expect(mockPost).not.toHaveBeenCalled();
});

const stepFailure = {
  index: 0,
  step: { click: 'submit' },
  expected: 'submit to be clickable',
  actual: 'hidden',
  message: 'submit is hidden',
};

test('test --repeat 3 classifies a journey that passes every run as PASS', async () => {
  const { default: test } = await import('./test.js');
  context.options.browser = true;
  writeJourneyFile('a.yaml', journeyYaml({ name: 'steady journey' }));
  context.options.repeat = '3';
  await test({ context });
  expect(mockPost).toHaveBeenCalledTimes(3);
  expect(
    logs.info.some((line) =>
      /^PASS {3}steady journey {3}\(1 steps, 3\/3, [\d.]+s each\)$/.test(line)
    )
  ).toBe(true);
  expect(process.exitCode).toBeUndefined();
});

test('test --repeat 3 classifies a journey that passes some runs as FLAKY and exits 1', async () => {
  const { default: test } = await import('./test.js');
  context.options.browser = true;
  writeJourneyFile('a.yaml', journeyYaml({ name: 'shaky journey' }));
  context.options.repeat = '3';
  mockPost
    .mockResolvedValueOnce({ data: { passed: true } })
    .mockResolvedValueOnce({ data: { passed: false, failure: stepFailure } })
    .mockResolvedValueOnce({ data: { passed: true } });
  await test({ context });
  expect(logs.error[0]).toEqual(
    'FLAKY  shaky journey   (2/3 passed) run 2 failed at step 0 (click "submit"): submit is hidden'
  );
  expect(logs.error[logs.error.length - 1]).toEqual('0 passed, 1 flaky, 0 failed of 1 journeys');
  expect(process.exitCode).toEqual(1);
});

test('test --repeat 3 classifies a journey that fails every run as FAIL with the finding line', async () => {
  const { default: test } = await import('./test.js');
  context.options.browser = true;
  writeJourneyFile('a.yaml', journeyYaml({ name: 'broken journey' }));
  context.options.repeat = '3';
  mockPost.mockResolvedValue({ data: { passed: false, failure: stepFailure } });
  await test({ context });
  expect(mockPost).toHaveBeenCalledTimes(3);
  expect(logs.error[0]).toEqual(
    'FAIL   broken journey   (0/3) step 0 (click "submit"): submit is hidden — fails every run: a finding, not a test to fix by retrying'
  );
  expect(process.exitCode).toEqual(1);
});

test('test --repeat runs a refused journey once and does not repeat it', async () => {
  const { default: test } = await import('./test.js');
  writeJourneyFile('a.yaml', 'name: no steps here\npageId: form\n');
  context.options.repeat = '3';
  await test({ context });
  expect(mockPost).not.toHaveBeenCalled();
  expect(logs.error[0]).toEqual('FAIL  no steps here');
  expect(process.exitCode).toEqual(1);
});

test.each([['0'], ['11'], ['2.5'], ['many']])('test refuses --repeat %s', async (value) => {
  const { default: test } = await import('./test.js');
  writeJourneyFile('a.yaml', journeyYaml({ name: 'first journey' }));
  context.options.repeat = value;
  await test({ context });
  expect(mockStartDevServer).not.toHaveBeenCalled();
  expect(logs.error).toEqual([
    `--repeat must be an integer from 1 to 10. Received ${JSON.stringify(value)}.`,
  ]);
  expect(process.exitCode).toEqual(1);
});

test('test runs journeys from a path under tests/journeys/_candidates, with --filter on top', async () => {
  const { default: test } = await import('./test.js');
  writeJourneyFile('a.yaml', journeyYaml({ name: 'committed journey' }));
  writeJourneyFile(path.join('_candidates', 'mined', 'b.yaml'), journeyYaml({ name: 'mined one' }));
  writeJourneyFile(path.join('_candidates', 'mined', 'c.yaml'), journeyYaml({ name: 'mined two' }));
  context.options.paths = [path.join(configDirectory, 'tests', 'journeys', '_candidates')];
  context.options.filter = 'two';
  await test({ context });
  expect(mockPost).toHaveBeenCalledTimes(1);
  expect(logs.info.some((line) => line.startsWith('PASS  mined two'))).toBe(true);
});

test('test refuses a path outside the config directory', async () => {
  const { default: test } = await import('./test.js');
  const outside = path.join(os.tmpdir(), 'outside.yaml');
  context.options.paths = [outside];
  await test({ context });
  expect(mockStartDevServer).not.toHaveBeenCalled();
  expect(logs.error).toEqual([
    `Journey path "${outside}" is outside the config directory ${configDirectory}.`,
  ]);
  expect(process.exitCode).toEqual(1);
});

test("test writes each journey's newest exercised path to .lowdefy/test/exercised.json", async () => {
  const { default: test } = await import('./test.js');
  writeJourneyFile('a.yaml', journeyYaml({ name: 'first journey' }));
  const exercised = { pages: ['form'], appEvents: true, requests: [], endpoints: [] };
  mockPost.mockResolvedValue({ data: { passed: true, exercised } });
  await test({ context });
  const written = JSON.parse(
    fs.readFileSync(path.join(configDirectory, '.lowdefy', 'test', 'exercised.json'), 'utf8')
  );
  expect(written).toEqual({
    version: 1,
    buildId: 'build-1',
    journeys: {
      ['tests/journeys/a.yaml#first journey']: {
        hash: expect.stringMatching(/^[0-9a-f]{40}$/),
        configHash: null,
        passed: true,
        exercised,
      },
    },
  });
});

test('test --lint lints without a server, exits 1 on an error and 0 on warnings only', async () => {
  const { default: test } = await import('./test.js');
  writeJourneyFile(
    'a.yaml',
    journeyYaml({
      name: 'waits a fixed time',
      steps: '  - wait: { ms: 100 }\n  - expect: { visible: done }\n',
    })
  );
  context.options = { lint: true };
  await test({ context });
  expect(mockStartDevServer).not.toHaveBeenCalled();
  expect(mockPost).not.toHaveBeenCalled();
  expect(process.exitCode).toBe(1);
  expect(logs.error).toContain(
    'L3  waits a fixed time  step 0 (wait: { ms }) waits a fixed time: wait for a request or a state, or expect the outcome, instead.'
  );
  expect(logs.warn).toContain(
    'L4  waits a fixed time  not checked for writes: run lowdefy test once so lint can see what it calls.'
  );

  process.exitCode = undefined;
  logs = { info: [], warn: [], error: [] };
  writeJourneyFile(
    'a.yaml',
    journeyYaml({ name: 'asserts', steps: '  - click: save\n  - expect: { visible: done }\n' })
  );
  await test({ context });
  expect(process.exitCode).toBeUndefined();
  expect(logs.info).toContain('Linted 1 journeys: 0 errors, 2 warnings.');
  expect(logs.warn).toContain(
    'L5  asserts  has no user: name a user from its data set (or a list of them), or write user: none for signed out.'
  );
});

function writeConfigFile(relativePath, content) {
  const filePath = path.join(configDirectory, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

test('test --lint reads data set users without a server', async () => {
  const { default: test } = await import('./test.js');
  writeConfigFile('tests/data/tickets.yaml', 'users:\n  member:\n    roles: [member]\n');
  writeJourneyFile(
    'a.yaml',
    'name: names a stranger\npageId: form\ndata: tickets\nuser: stranger\nsteps:\n  - expect: { visible: done }\n'
  );
  context.options = { lint: true };
  await test({ context });
  expect(mockStartDevServer).not.toHaveBeenCalled();
  expect(logs.warn).toContain(
    'L5  names a stranger  names user "stranger", which data set "tickets" does not have. Its users: member.'
  );
  expect(process.exitCode).toBeUndefined();
});

test('a full-suite run records every journey into one run on its first repetition only', async () => {
  const { default: test } = await import('./test.js');
  context.options.browser = true;
  writeJourneyFile('a.yaml', journeyYaml({ name: 'first journey' }));
  writeJourneyFile('b.yaml', journeyYaml({ name: 'second journey' }));
  context.options.repeat = '2';
  await test({ context });
  const bodies = mockPost.mock.calls.map(([, body]) => body);
  expect(bodies).toHaveLength(4);
  const recordings = bodies.map((body) => body.recording);
  expect(recordings[0]).toEqual({
    run: expect.stringMatching(/^\d{8}T\d{6}Z-[a-z0-9]{6}$/),
    journey: 'tests/journeys/a.yaml#first journey',
  });
  expect(recordings[1]).toBeUndefined();
  expect(recordings[2]).toEqual({
    run: recordings[0].run,
    journey: 'tests/journeys/b.yaml#second journey',
  });
  expect(recordings[3]).toBeUndefined();
  const date = `${recordings[0].run.slice(0, 4)}-${recordings[0].run.slice(
    4,
    6
  )}-${recordings[0].run.slice(6, 8)}`;
  expect(logs.info).toContain(
    `Recorded this run to ${path.join(
      configDirectory,
      '.lowdefy',
      'traces',
      'journey',
      date,
      `${recordings[0].run}.jsonl`
    )}.`
  );
  const testRun = JSON.parse(
    fs.readFileSync(path.join(configDirectory, '.lowdefy', 'test', 'run.json'), 'utf8')
  );
  expect(testRun.run).toBe(recordings[0].run);
  expect(Object.keys(testRun.journeys)).toEqual([
    'tests/journeys/a.yaml#first journey',
    'tests/journeys/b.yaml#second journey',
  ]);
});

test('a --filter run and a run of named paths record nothing', async () => {
  const { default: test } = await import('./test.js');
  writeJourneyFile('a.yaml', journeyYaml({ name: 'first journey' }));
  context.options.filter = 'first';
  await test({ context });
  delete context.options.filter;
  context.options.paths = [path.join(configDirectory, 'tests', 'journeys', 'a.yaml')];
  await test({ context });
  const bodies = mockPost.mock.calls.map(([, body]) => body);
  expect(bodies).toHaveLength(2);
  bodies.forEach((body) => expect(body).not.toHaveProperty('recording'));
  expect(logs.info.some((line) => line.startsWith('Recorded this run'))).toBe(false);
});

function taggedJourneyYaml({ name, tags }) {
  return `name: ${name}\npageId: form\ntags: [${tags.join(', ')}]\nsteps:\n  - click: submit\n`;
}

test('test with no paths runs journeys in sub-folders and none under a "_" folder', async () => {
  const { default: test } = await import('./test.js');
  context.options.browser = true;
  writeJourneyFile('a.yaml', journeyYaml({ name: 'top journey' }));
  writeJourneyFile(path.join('review', 'b.yaml'), journeyYaml({ name: 'review journey' }));
  writeJourneyFile(path.join('review', 'deep', 'c.yaml'), journeyYaml({ name: 'deep journey' }));
  writeJourneyFile(path.join('_candidates', 'dev', 'd.yaml'), journeyYaml({ name: 'candidate' }));
  writeJourneyFile(path.join('review', '_drafts', 'e.yaml'), journeyYaml({ name: 'draft' }));
  await test({ context });
  expect(
    logs.info.filter((line) => line.startsWith('PASS')).map((line) => line.split('  ')[1])
  ).toEqual(['top journey', 'review journey', 'deep journey']);
  expect(logs.info.some((line) => line.startsWith('Recorded this run'))).toBe(true);
});

test('test runs the same journeys for a folder and a quoted ** glob of it', async () => {
  const { default: test } = await import('./test.js');
  writeJourneyFile('a.yaml', journeyYaml({ name: 'top journey' }));
  writeJourneyFile(path.join('review', 'b.yaml'), journeyYaml({ name: 'review journey' }));
  writeJourneyFile(path.join('review', 'deep', 'c.yaml'), journeyYaml({ name: 'deep journey' }));
  const cwd = vi.spyOn(process, 'cwd').mockReturnValue(configDirectory);
  try {
    context.options.paths = ['tests/journeys/review'];
    await test({ context });
    const fromFolder = mockPost.mock.calls.length;
    context.options.paths = ['tests/journeys/review/**'];
    await test({ context });
    expect(fromFolder).toBe(2);
    expect(mockPost.mock.calls.length).toBe(4);
    const passed = logs.info
      .filter((line) => line.startsWith('PASS'))
      .map((line) => line.split('  ')[1]);
    expect(passed).toEqual(['review journey', 'deep journey', 'review journey', 'deep journey']);
  } finally {
    cwd.mockRestore();
  }
});

test('test refuses a glob that matches nothing before booting a server', async () => {
  const { default: test } = await import('./test.js');
  writeJourneyFile('a.yaml', journeyYaml({ name: 'top journey' }));
  const cwd = vi.spyOn(process, 'cwd').mockReturnValue(configDirectory);
  try {
    context.options.paths = ['tests/journeys/review/*.yaml'];
    await test({ context });
  } finally {
    cwd.mockRestore();
  }
  expect(mockStartDevServer).not.toHaveBeenCalled();
  expect(logs.error).toEqual(['Journey path "tests/journeys/review/*.yaml" matches no files.']);
  expect(process.exitCode).toEqual(1);
});

test('test --tag runs the journeys carrying any of the tags, and records nothing', async () => {
  const { default: test } = await import('./test.js');
  writeJourneyFile('a.yaml', taggedJourneyYaml({ name: 'smoke journey', tags: ['smoke'] }));
  writeJourneyFile('b.yaml', taggedJourneyYaml({ name: 'review journey', tags: ['review'] }));
  writeJourneyFile('c.yaml', journeyYaml({ name: 'untagged journey' }));
  context.options.tag = ['smoke', 'review'];
  await test({ context });
  expect(mockPost).toHaveBeenCalledTimes(2);
  expect(logs.info).toContain('2 passed, 0 failed of 2 journeys');
  mockPost.mock.calls.forEach(([, body]) => expect(body).not.toHaveProperty('recording'));
});

test('test combines paths, --tag and repeated --filter with AND, each filter an OR', async () => {
  const { default: test } = await import('./test.js');
  writeJourneyFile(
    path.join('review', 'a.yaml'),
    taggedJourneyYaml({ name: 'approves an order', tags: ['smoke'] })
  );
  writeJourneyFile(
    path.join('review', 'b.yaml'),
    taggedJourneyYaml({ name: 'rejects an order', tags: ['smoke'] })
  );
  writeJourneyFile(
    path.join('review', 'c.yaml'),
    taggedJourneyYaml({ name: 'edits an order', tags: ['slow'] })
  );
  writeJourneyFile('d.yaml', taggedJourneyYaml({ name: 'approves a refund', tags: ['smoke'] }));
  context.options.paths = [path.join(configDirectory, 'tests', 'journeys', 'review')];
  context.options.tag = ['smoke'];
  context.options.filter = ['APPROVES', 'edits'];
  await test({ context });
  expect(mockPost).toHaveBeenCalledTimes(1);
  expect(logs.info.some((line) => line.startsWith('PASS  approves an order'))).toBe(true);
});

test('test names the paths, tags and filters when nothing matched', async () => {
  const { default: test } = await import('./test.js');
  writeJourneyFile(path.join('review', 'a.yaml'), journeyYaml({ name: 'first journey' }));
  const review = path.join(configDirectory, 'tests', 'journeys', 'review');
  context.options.paths = [review];
  context.options.tag = ['smoke', 'nightly'];
  context.options.filter = ['first'];
  await test({ context });
  expect(mockStartDevServer).not.toHaveBeenCalled();
  expect(logs.error).toEqual([
    `No tests matched --tag "smoke" or "nightly" and --filter "first" in ${review}.`,
  ]);
  expect(process.exitCode).toEqual(1);
});

test('test refuses a --tag outside the tag grammar before booting a server', async () => {
  const { default: test } = await import('./test.js');
  writeJourneyFile('a.yaml', journeyYaml({ name: 'first journey' }));
  context.options.tag = ['Smoke'];
  await test({ context });
  expect(mockStartDevServer).not.toHaveBeenCalled();
  expect(logs.error).toEqual([
    'Tag "Smoke" should be lowercase letters, digits, "-" and "_", start with a letter or digit, and be at most 64 characters.',
  ]);
  expect(process.exitCode).toEqual(1);
});

test('test fails a journey whose tags break the grammar without posting it', async () => {
  const { default: test } = await import('./test.js');
  writeJourneyFile('a.yaml', taggedJourneyYaml({ name: 'bad tags', tags: ['Smoke'] }));
  await test({ context });
  expect(mockPost).not.toHaveBeenCalled();
  expect(logs.error.join('\n')).toContain('Journey "tags": Tag "Smoke" should be');
  expect(process.exitCode).toEqual(1);
});

function personaJourneyYaml({
  name = 'edits a ticket',
  user = '[admin, member]',
  data = 'tickets',
}) {
  const dataLine = data === null ? '' : `data: ${data}\n`;
  return `name: ${name}\npageId: form\n${dataLine}user: ${user}\nsteps:\n  - click: submit\n`;
}

test('test runs a journey with a list of users once per user, each named for its user', async () => {
  const { default: test } = await import('./test.js');
  context.options.browser = true;
  writeJourneyFile('a.yaml', personaJourneyYaml({}));
  const exercised = { pages: ['form'], appEvents: true, requests: [], endpoints: [] };
  mockPost.mockResolvedValue({ data: { passed: true, exercised } });
  await test({ context });
  const bodies = mockPost.mock.calls.map(([, body]) => body);
  expect(bodies.map((body) => body.user)).toEqual(['admin', 'member']);
  expect(bodies.map((body) => body.data)).toEqual(['tickets', 'tickets']);
  expect(bodies.map((body) => body.recording.journey)).toEqual([
    'tests/journeys/a.yaml#edits a ticket [admin]',
    'tests/journeys/a.yaml#edits a ticket [member]',
  ]);
  expect(logs.info.filter((line) => line.startsWith('PASS'))).toEqual([
    expect.stringContaining('PASS  edits a ticket [admin]'),
    expect.stringContaining('PASS  edits a ticket [member]'),
  ]);
  expect(logs.info).toContain('2 passed, 0 failed of 2 journeys');
  const written = JSON.parse(
    fs.readFileSync(path.join(configDirectory, '.lowdefy', 'test', 'exercised.json'), 'utf8')
  );
  expect(Object.keys(written.journeys)).toEqual([
    'tests/journeys/a.yaml#edits a ticket [admin]',
    'tests/journeys/a.yaml#edits a ticket [member]',
  ]);
  const testRun = JSON.parse(
    fs.readFileSync(path.join(configDirectory, '.lowdefy', 'test', 'run.json'), 'utf8')
  );
  expect(Object.keys(testRun.journeys)).toEqual([
    'tests/journeys/a.yaml#edits a ticket [admin]',
    'tests/journeys/a.yaml#edits a ticket [member]',
  ]);
});

test('test reports each persona run of a journey on its own', async () => {
  const { default: test } = await import('./test.js');
  context.options.browser = true;
  writeJourneyFile('a.yaml', personaJourneyYaml({}));
  mockPost.mockImplementation((url, body) =>
    Promise.resolve({
      data:
        body.user === 'member'
          ? {
              passed: false,
              failure: { index: 0, step: { click: 'submit' }, message: 'submit is hidden' },
            }
          : { passed: true },
    })
  );
  await test({ context });
  expect(logs.info).toContainEqual(expect.stringContaining('PASS  edits a ticket [admin]'));
  expect(logs.error).toContain('FAIL  edits a ticket [member]');
  expect(logs.error).toContain('1 passed, 1 failed of 2 journeys');
  expect(process.exitCode).toBe(1);
});

test('test --filter picks one persona run of a journey by its user', async () => {
  const { default: test } = await import('./test.js');
  writeJourneyFile('a.yaml', personaJourneyYaml({}));
  context.options.filter = '[member]';
  await test({ context });
  expect(mockPost).toHaveBeenCalledTimes(1);
  expect(mockPost.mock.calls[0][1].user).toBe('member');
  expect(mockPost.mock.calls[0][1].recording).toBeUndefined();
});

test('test posts a persona run as its user with its as: steps unchanged', async () => {
  const { default: test } = await import('./test.js');
  writeJourneyFile(
    'a.yaml',
    'name: reviews a ticket\npageId: form\ndata: tickets\nuser: [admin, member]\nsteps:\n  - click: submit\n  - as: reviewer\n  - expect: { visible: submit }\n'
  );
  await test({ context });
  const bodies = mockPost.mock.calls.map(([, body]) => body);
  expect(bodies.map((body) => body.user)).toEqual(['admin', 'member']);
  bodies.forEach((body) => {
    expect(body.steps).toEqual([
      { click: 'submit' },
      { as: 'reviewer' },
      { expect: { visible: 'submit' } },
    ]);
  });
});

test('test --repeat repeats each persona run', async () => {
  const { default: test } = await import('./test.js');
  writeJourneyFile('a.yaml', personaJourneyYaml({}));
  context.options.repeat = '2';
  await test({ context });
  expect(mockPost.mock.calls.map(([, body]) => body.user)).toEqual([
    'admin',
    'admin',
    'member',
    'member',
  ]);
  expect(logs.info).toContain('2 passed, 0 failed of 2 journeys');
});

test('test refuses a list of users without data once, as an invalid journey file', async () => {
  const { default: test } = await import('./test.js');
  writeJourneyFile('a.yaml', personaJourneyYaml({ data: null }));
  await test({ context });
  expect(mockPost).not.toHaveBeenCalled();
  expect(logs.error).toContainEqual(
    expect.stringContaining(
      'Invalid journey file: Journey "user" is a list of data set users, but the journey declares no "data"'
    )
  );
  expect(logs.error).toContain('0 passed, 1 failed of 1 journeys');
});

test('test --lint lints a journey with a list of users once', async () => {
  const { default: test } = await import('./test.js');
  writeConfigFile('tests/data/tickets.yaml', 'users:\n  admin:\n    roles: [admin]\n');
  writeJourneyFile('a.yaml', personaJourneyYaml({ user: '[admin, stranger]' }));
  context.options = { lint: true };
  await test({ context });
  expect(mockStartDevServer).not.toHaveBeenCalled();
  const l5 = logs.warn.filter((line) => line.startsWith('L5'));
  expect(l5).toEqual([
    'L5  edits a ticket  names user "stranger", which data set "tickets" does not have. Its users: admin.',
  ]);
  expect([...logs.info, ...logs.error]).toContainEqual(
    expect.stringMatching(/^Linted 1 journeys:/)
  );
});

// A page-less journey whose steps live in a shared file and whose rows fill in the endpoint and
// the user.
function writeCaseTable() {
  writeConfigFile(
    'tests/shared/comment-steps.yaml',
    '- call: { endpoint: { _case: endpoint }, payload: { _case: payload } }\n- expect: { status: 400 }\n'
  );
  writeJourneyFile(
    'cases.yaml',
    `name: refuses another company
data: tickets
user: { _case: user }
cases:
  - { name: ticket, user: admin, endpoint: tickets-add-comment, payload: { ticket_id: T-B-1 } }
  - { name: workflow, user: member, endpoint: workflow-submit, payload: { action_id: A-B-1 } }
  - { name: note, user: stranger, endpoint: notes-add, payload: { note_id: N-B-1 } }
steps:
  _ref: tests/shared/comment-steps.yaml
`
  );
}

test('test runs a case table once per row, each named for its row, with its values filled in', async () => {
  const { default: test } = await import('./test.js');
  writeCaseTable();
  await test({ context });
  const bodies = mockPost.mock.calls.map(([, body]) => body);
  expect(bodies.map((body) => body.user)).toEqual(['admin', 'member', 'stranger']);
  expect(bodies[1].steps).toEqual([
    { call: { endpoint: 'workflow-submit', payload: { action_id: 'A-B-1' } } },
    { expect: { status: 400 } },
  ]);
  expect(logs.info.filter((line) => line.startsWith('PASS'))).toEqual([
    expect.stringContaining('PASS  refuses another company [ticket]'),
    expect.stringContaining('PASS  refuses another company [workflow]'),
    expect.stringContaining('PASS  refuses another company [note]'),
  ]);
  expect(logs.info).toContain('3 passed, 0 failed of 3 journeys');
});

test('test --filter picks one row of a case table by its name', async () => {
  const { default: test } = await import('./test.js');
  writeCaseTable();
  context.options.filter = '[workflow]';
  await test({ context });
  expect(mockPost).toHaveBeenCalledTimes(1);
  expect(mockPost.mock.calls[0][1].steps[0]).toEqual({
    call: { endpoint: 'workflow-submit', payload: { action_id: 'A-B-1' } },
  });
});

test('test --lint lints a case table once, as its first row', async () => {
  const { default: test } = await import('./test.js');
  writeConfigFile('tests/data/tickets.yaml', 'users:\n  admin:\n    roles: [admin]\n');
  writeCaseTable();
  context.options = { lint: true };
  await test({ context });
  expect(mockStartDevServer).not.toHaveBeenCalled();
  expect(logs.warn.filter((line) => line.startsWith('L5'))).toEqual([]);
  expect([...logs.info, ...logs.error]).toContainEqual(
    expect.stringMatching(/^Linted 1 journeys:/)
  );
});

test('test refuses a case table beside a list of users once, as an invalid journey file', async () => {
  const { default: test } = await import('./test.js');
  writeJourneyFile(
    'cases.yaml',
    'name: both\ndata: tickets\nuser: [admin, member]\ncases:\n  - { name: one }\nsteps:\n  - call: { endpoint: save }\n'
  );
  await test({ context });
  expect(mockPost).not.toHaveBeenCalled();
  expect(logs.error).toContainEqual(
    expect.stringContaining(
      'Invalid journey file: Journey has "cases" and a list of users: write a row per user'
    )
  );
  expect(logs.error).toContain('0 passed, 1 failed of 1 journeys');
});

// A journey refreshed with production evidence: `sessions` over the 30 days of
// September, or the `months` given. No evidence when neither is given.
function rankedJourneyYaml({ name, sessions, months, failures = 0, ...rest }) {
  const steps = [{ click: name.replace(/\W/g, '_') }];
  const journey = { name, pageId: 'form', ...rest, steps };
  const monthList =
    months ??
    (sessions === undefined
      ? undefined
      : [{ month: '2026-09', days: 30, sessions, persons: 1, orgs: 1, failures }]);
  if (monthList !== undefined) {
    journey.evidence = {
      production: {
        sequence: sequenceId({ pageId: 'form', steps }),
        pageId: 'form',
        flow: flowLines({ pageId: 'form', steps }),
        months: monthList,
      },
    };
  }
  return YAML.stringify(journey);
}

test('test --tier common runs the common journeys and the unranked ones, and records nothing', async () => {
  const { default: test } = await import('./test.js');
  context.options.browser = true;
  writeJourneyFile('a.yaml', rankedJourneyYaml({ name: 'top', sessions: 300, failures: 4 }));
  writeJourneyFile('b.yaml', rankedJourneyYaml({ name: 'middle', sessions: 60 }));
  writeJourneyFile('c.yaml', rankedJourneyYaml({ name: 'low', sessions: 30 }));
  writeJourneyFile('d.yaml', rankedJourneyYaml({ name: 'new' }));
  context.options.tier = 'common';
  await test({ context });
  const bodies = mockPost.mock.calls.map(([, body]) => body);
  expect(bodies).toHaveLength(2);
  bodies.forEach((body) => expect(body).not.toHaveProperty('recording'));
  expect(logs.info.filter((line) => line.startsWith('PASS'))).toEqual([
    expect.stringMatching(
      /^PASS {2}top {2}\(1 steps, \d+ms\) {2}common #1 · 10\.0\/day · 4 failed \(3m\)$/
    ),
    expect.stringMatching(/^PASS {2}new {2}\(1 steps, \d+ms\)$/),
  ]);
  expect(logs.info.some((line) => line.startsWith('Recorded this run'))).toBe(false);
  expect(logs.info[logs.info.length - 1]).toEqual('2 passed, 0 failed of 2 journeys');
});

test("test without --tier runs every journey and shows each one's tier on its PASS line", async () => {
  const { default: test } = await import('./test.js');
  context.options.browser = true;
  writeJourneyFile('a.yaml', rankedJourneyYaml({ name: 'top', sessions: 300 }));
  writeJourneyFile('b.yaml', rankedJourneyYaml({ name: 'low', sessions: 30 }));
  await test({ context });
  expect(mockPost).toHaveBeenCalledTimes(2);
  const passLines = logs.info.filter((line) => line.startsWith('PASS'));
  expect(passLines[0]).toContain('common #1 · 10.0/day · 0 failed (3m)');
  expect(passLines[1]).toContain('edge #2 · 1.0/day · 0 failed (3m)');
  expect(logs.info.some((line) => line.startsWith('Recorded this run'))).toBe(true);
});

test('test --tier tiers over the selected folder and tag only', async () => {
  const { default: test } = await import('./test.js');
  writeJourneyFile('a.yaml', rankedJourneyYaml({ name: 'busiest', sessions: 3000 }));
  writeJourneyFile(
    path.join('review', 'b.yaml'),
    rankedJourneyYaml({ name: 'review top', sessions: 300, tags: ['smoke'] })
  );
  writeJourneyFile(
    path.join('review', 'c.yaml'),
    rankedJourneyYaml({ name: 'review low', sessions: 30, tags: ['smoke'] })
  );
  context.options.paths = [path.join(configDirectory, 'tests', 'journeys', 'review')];
  context.options.tier = 'common';
  await test({ context });
  expect(logs.info.filter((line) => line.startsWith('PASS'))).toEqual([
    expect.stringContaining('PASS  review top'),
  ]);
  delete context.options.paths;
  context.options.tag = ['smoke'];
  logs.info = [];
  await test({ context });
  expect(logs.info.filter((line) => line.startsWith('PASS'))).toEqual([
    expect.stringMatching(/^PASS {2}review top .* common #1 · 10\.0\/day/),
  ]);
});

test('test --tier common runs every user of a journey with a list of users in the tier', async () => {
  const { default: test } = await import('./test.js');
  writeJourneyFile(
    'a.yaml',
    rankedJourneyYaml({
      name: 'edits a ticket',
      sessions: 300,
      data: 'tickets',
      user: ['admin', 'member'],
    })
  );
  writeJourneyFile('b.yaml', rankedJourneyYaml({ name: 'low', sessions: 30 }));
  context.options.tier = 'common';
  await test({ context });
  const bodies = mockPost.mock.calls.map(([, body]) => body);
  expect(bodies.map((body) => body.user)).toEqual(['admin', 'member']);
  expect(logs.info.filter((line) => line.startsWith('PASS'))).toEqual([
    expect.stringMatching(/^PASS {2}edits a ticket \[admin\] .* common #1 · 10\.0\/day/),
    expect.stringMatching(/^PASS {2}edits a ticket \[member\] .* common #1 · 10\.0\/day/),
  ]);
});

// A journey clicking a grid row by a data value, refreshed: its stored id
// reads that text as none, since it is not config text.
function dataValueJourneyYaml({ name, sessions }) {
  const steps = [{ click: { blockId: 'grid', text: 'Sample customer' } }];
  const isConfigText = (text) => text === 'Save';
  return YAML.stringify({
    name,
    pageId: 'form',
    steps,
    evidence: {
      production: {
        sequence: sequenceId({ pageId: 'form', steps, isConfigText }),
        pageId: 'form',
        flow: flowLines({ pageId: 'form', steps, isConfigText }),
        months: [{ month: '2026-09', days: 30, sessions, persons: 1, orgs: 1, failures: 0 }],
      },
    },
  });
}

test('test without --tier never reads config text, and shows a journey clicking a data value as unranked', async () => {
  const { default: test } = await import('./test.js');
  context.options.browser = true;
  writeJourneyFile('a.yaml', rankedJourneyYaml({ name: 'top', sessions: 300 }));
  writeJourneyFile('b.yaml', dataValueJourneyYaml({ name: 'opens a customer', sessions: 60 }));
  await test({ context });
  expect(mockReadConfigText).not.toHaveBeenCalled();
  expect(mockPost).toHaveBeenCalledTimes(2);
  expect(logs.info.filter((line) => line.startsWith('PASS'))).toEqual([
    expect.stringContaining('common #1 · 10.0/day'),
    expect.stringMatching(/^PASS {2}opens a customer .* unranked$/),
  ]);
});

test('test --tier edge reads config text to rank a journey clicking a data value', async () => {
  const { default: test } = await import('./test.js');
  writeJourneyFile('a.yaml', rankedJourneyYaml({ name: 'top', sessions: 300 }));
  writeJourneyFile('b.yaml', dataValueJourneyYaml({ name: 'opens a customer', sessions: 60 }));
  context.options.tier = 'edge';
  await test({ context });
  expect(mockReadConfigText).toHaveBeenCalledTimes(1);
  expect(logs.info.filter((line) => line.startsWith('PASS'))).toEqual([
    expect.stringContaining('common #1 · 10.0/day'),
    expect.stringMatching(/^PASS {2}opens a customer .* edge #2 · 2\.0\/day/),
  ]);
});

test('test without --tier below 100 matches shows the rate and failures with no tier', async () => {
  const { default: test } = await import('./test.js');
  context.options.browser = true;
  writeJourneyFile('a.yaml', rankedJourneyYaml({ name: 'top', sessions: 30, failures: 3 }));
  await test({ context });
  expect(process.exitCode).toBeUndefined();
  expect(logs.info.filter((line) => line.startsWith('PASS'))).toEqual([
    expect.stringMatching(/^PASS {2}top {2}\(1 steps, \d+ms\) {2}1\.0\/day · 3 failed \(3m\)$/),
  ]);
});

test('test --tier refuses below 100 matches, and says to refresh with no evidence', async () => {
  const { default: test } = await import('./test.js');
  writeJourneyFile('a.yaml', rankedJourneyYaml({ name: 'top', sessions: 30 }));
  context.options.tier = 'common';
  await test({ context });
  expect(process.exitCode).toBe(1);
  expect(logs.error).toEqual([
    'The selection has 30 journey matches in 2026-07 to 2026-09, fewer than the 100 tiers need. Use --tier full, or pull more production use.',
  ]);
  expect(mockStartDevServer).not.toHaveBeenCalled();
  writeJourneyFile('a.yaml', rankedJourneyYaml({ name: 'top' }));
  logs.error = [];
  await test({ context });
  expect(logs.error).toEqual([
    'No selected journey has production evidence to rank by. Pull production use with "lowdefy journeys pull posthog", then run "lowdefy journeys evidence --refresh".',
  ]);
  expect(mockStartDevServer).not.toHaveBeenCalled();
});

test('test --usage-window 6m changes the rates and the cut, and 6 or 6d is refused', async () => {
  const { default: test } = await import('./test.js');
  context.options.browser = true;
  writeJourneyFile(
    'a.yaml',
    rankedJourneyYaml({
      name: 'older',
      months: [
        { month: '2026-04', days: 30, sessions: 300, persons: 1, orgs: 1, failures: 0 },
        { month: '2026-09', days: 30, sessions: 30, persons: 1, orgs: 1, failures: 0 },
      ],
    })
  );
  writeJourneyFile('b.yaml', rankedJourneyYaml({ name: 'steady', sessions: 90 }));
  context.options.tier = 'common';
  await test({ context });
  expect(logs.info.filter((line) => line.startsWith('PASS'))).toEqual([
    expect.stringMatching(/^PASS {2}steady .* common #1 · 3\.0\/day · 0 failed \(3m\)$/),
  ]);
  logs.info = [];
  context.options.usageWindow = '6m';
  await test({ context });
  expect(logs.info.filter((line) => line.startsWith('PASS'))).toEqual([
    expect.stringMatching(/^PASS {2}older .* common #1 · 5\.5\/day · 0 failed \(6m\)$/),
  ]);
  context.options.usageWindow = '6';
  await expect(test({ context })).rejects.toThrow('Received "6".');
  context.options.usageWindow = '6d';
  await expect(test({ context })).rejects.toThrow('Received "6d".');
});

test('test skips a deprecated journey in every run, named or not, and a plain run still records', async () => {
  const { default: test } = await import('./test.js');
  context.options.browser = true;
  writeJourneyFile(
    'a.yaml',
    rankedJourneyYaml({ name: 'retired', sessions: 30, deprecated: true })
  );
  writeJourneyFile('b.yaml', rankedJourneyYaml({ name: 'live', sessions: 300 }));
  await test({ context });
  const bodies = mockPost.mock.calls.map(([, body]) => body);
  expect(bodies).toHaveLength(1);
  expect(bodies[0].recording).toEqual(
    expect.objectContaining({ journey: 'tests/journeys/b.yaml#live' })
  );
  expect(logs.info).toContain('SKIP deprecated  retired  1.0/day (3m)');
  expect(logs.info.some((line) => line.startsWith('Recorded this run'))).toBe(true);
  expect(logs.info[logs.info.length - 1]).toEqual(
    '1 passed, 0 failed of 1 journeys, 1 deprecated skipped'
  );
  logs.info = [];
  context.options.paths = [path.join(configDirectory, 'tests', 'journeys', 'a.yaml')];
  await test({ context });
  expect(mockPost).toHaveBeenCalledTimes(1);
  expect(mockStartDevServer).toHaveBeenCalledTimes(1);
  expect(logs.info).toEqual([
    'SKIP deprecated  retired  1.0/day (3m)',
    '0 passed, 0 failed of 0 journeys, 1 deprecated skipped',
  ]);
  expect(process.exitCode).toBeUndefined();
});

test('test exits 75 without starting a server when no journey run slot frees', async () => {
  const { default: test } = await import('./test.js');
  context.options.browser = true;
  writeJourneyFile('a.yaml', journeyYaml({ name: 'first journey' }));
  mockAcquireJourneyRunSlots.mockRejectedValue(
    Object.assign(new Error('busy'), { code: 'MACHINE_SLOT_TIMEOUT', slot: 'journey-run' })
  );
  await test({ context });
  expect(mockAcquireJourneyRunSlots).toHaveBeenCalledWith({
    context,
    command: 'lowdefy test',
    browser: true,
  });
  expect(mockStartDevServer).not.toHaveBeenCalled();
  expect(mockPost).not.toHaveBeenCalled();
  expect(logs.error).toEqual([
    'The machine is busy running other journeys. Try again later; do not start your own dev server.',
  ]);
  expect(process.exitCode).toBe(75);
  expect(fs.existsSync(context.directories.test)).toBe(false);
});

test('test takes the journey run slots before the server and frees them after it stops', async () => {
  const { default: test } = await import('./test.js');
  context.options.browser = true;
  writeJourneyFile('a.yaml', journeyYaml({ name: 'first journey' }));
  const order = [];
  mockAcquireJourneyRunSlots.mockImplementation(async () => {
    order.push('slots');
    return { release: () => order.push('release') };
  });
  mockStartDevServer.mockImplementation(async () => {
    order.push('server');
    return { url: 'http://localhost:3228', stop: async () => order.push('stop') };
  });
  await test({ context });
  expect(order).toEqual(['slots', 'server', 'stop', 'release']);
});

test('test frees the journey run slots when a journey fails', async () => {
  const { default: test } = await import('./test.js');
  context.options.browser = true;
  writeJourneyFile('a.yaml', journeyYaml({ name: 'failing journey' }));
  mockPost.mockResolvedValueOnce({
    data: { passed: false, steps: [], failure: { index: 0, message: 'Block "submit" not found.' } },
  });
  await test({ context });
  expect(process.exitCode).toBe(1);
  expect(mockReleaseSlots).toHaveBeenCalledTimes(1);
});

test('test frees the journey run slots when the server fails to start', async () => {
  const { default: test } = await import('./test.js');
  context.options.browser = true;
  writeJourneyFile('a.yaml', journeyYaml({ name: 'first journey' }));
  mockStartDevServer.mockRejectedValue(new Error('boot failed'));
  await expect(test({ context })).rejects.toThrow('boot failed');
  expect(mockReleaseSlots).toHaveBeenCalledTimes(1);
});

test('test frees the journey run slots when a signal stops the run', async () => {
  const { default: test } = await import('./test.js');
  context.options.browser = true;
  writeJourneyFile('a.yaml', journeyYaml({ name: 'first journey' }));
  const exit = vi.spyOn(process, 'exit').mockImplementation(() => {});
  // The handler is called directly: a real signal would reach the test runner too.
  const once = vi.spyOn(process, 'once');
  try {
    mockPost.mockImplementationOnce(async () => {
      const [, onSignal] = once.mock.calls.find(([signal]) => signal === 'SIGTERM');
      await onSignal();
      return { data: { passed: true, steps: [] } };
    });
    await test({ context });
    expect(exit).toHaveBeenCalledWith(143);
    expect(mockStop).toHaveBeenCalledTimes(1);
    expect(mockReleaseSlots).toHaveBeenCalledTimes(1);
  } finally {
    exit.mockRestore();
    once.mockRestore();
  }
});

test('test --build without --headless runs headless on the production build', async () => {
  const { default: test } = await import('./test.js');
  writeJourneyFile('a.yaml', journeyYaml({ name: 'first journey' }));
  context.directories.server = path.join(configDirectory, '.lowdefy', 'server');
  writeBuildAuth();
  context.options = { port: 3000, build: true };
  await test({ context });
  expect(mockStartDevServer).not.toHaveBeenCalled();
  expect(mockOpenTestApp).toHaveBeenCalledTimes(1);
  expect(mockRunHeadlessJourney).toHaveBeenCalledTimes(1);
  expect(logs.info[logs.info.length - 1]).toBe('1 passed, 0 failed of 1 journeys');
  expect(process.exitCode).toBeUndefined();
});

function dataJourneyYaml({ name, serial = false }) {
  return `name: ${name}\npageId: form\ndata: base\n${
    serial ? 'serial: true\n' : ''
  }steps:\n  - click: submit\n`;
}

// Answers each post after the delay its journey's name maps to, counting the posts in flight.
function delayedPosts({ delays }) {
  const flight = { now: 0, max: 0, order: [] };
  mockPost.mockImplementation(async (url, body) => {
    const name = body.recording?.journey?.split('#')[1] ?? body.steps.length;
    flight.now += 1;
    flight.max = Math.max(flight.max, flight.now);
    flight.order.push(name);
    await new Promise((resolve) => setTimeout(resolve, delays[name] ?? 0));
    flight.now -= 1;
    return { data: { passed: true, steps: [] } };
  });
  return flight;
}

test('test --concurrency 2 keeps two data set journeys in flight and prints them in run order', async () => {
  const { default: test } = await import('./test.js');
  context.options.browser = true;
  // The journey with no data set is first in the selection, and runs alone after the others.
  writeJourneyFile('a.yaml', journeyYaml({ name: 'no data' }));
  writeJourneyFile('b.yaml', dataJourneyYaml({ name: 'slow' }));
  writeJourneyFile('c.yaml', dataJourneyYaml({ name: 'quick' }));
  writeJourneyFile('d.yaml', dataJourneyYaml({ name: 'next' }));
  context.options = { ...context.options, concurrency: '2' };
  const flight = delayedPosts({ delays: { slow: 60 } });
  await test({ context });
  expect(flight.max).toBe(2);
  expect(flight.order).toEqual(['slow', 'quick', 'next', 'no data']);
  // quick and next finished before slow, and print after it, in run order; the alone journey
  // first in the selection did not hold them back.
  expect(logs.info.filter((line) => line.startsWith('PASS'))).toEqual([
    expect.stringMatching(/^PASS {2}slow/),
    expect.stringMatching(/^PASS {2}quick/),
    expect.stringMatching(/^PASS {2}next/),
    expect.stringMatching(/^PASS {2}no data/),
  ]);
  const run = JSON.parse(fs.readFileSync(path.join(context.directories.test, 'run.json'), 'utf8'));
  expect(Object.keys(run.journeys)).toEqual([
    'tests/journeys/a.yaml#no data',
    'tests/journeys/b.yaml#slow',
    'tests/journeys/c.yaml#quick',
    'tests/journeys/d.yaml#next',
  ]);
  expect(logs.info[logs.info.length - 1]).toEqual('4 passed, 0 failed of 4 journeys');
});

test('test runs one journey at a time by default and a serial journey alone', async () => {
  const { default: test } = await import('./test.js');
  context.options.browser = true;
  writeJourneyFile('a.yaml', dataJourneyYaml({ name: 'first' }));
  writeJourneyFile('b.yaml', dataJourneyYaml({ name: 'second' }));
  const flight = delayedPosts({ delays: {} });
  await test({ context });
  expect(flight.max).toBe(1);

  context.options = { ...context.options, concurrency: '3' };
  writeJourneyFile('a.yaml', dataJourneyYaml({ name: 'first', serial: true }));
  const serialFlight = delayedPosts({ delays: {} });
  await test({ context });
  expect(serialFlight.max).toBe(1);
  expect(serialFlight.order).toEqual(['second', 'first']);
});

test('test --concurrency out of range is refused before a server starts', async () => {
  const { default: test } = await import('./test.js');
  writeJourneyFile('a.yaml', journeyYaml({ name: 'first journey' }));
  context.options = { ...context.options, browser: true, concurrency: '4' };
  await test({ context });
  expect(logs.error).toEqual(['--concurrency must be an integer from 1 to 3. Received "4".']);
  expect(mockStartDevServer).not.toHaveBeenCalled();
  expect(process.exitCode).toBe(1);
});

test('test --headless --build refuses a --concurrency below 1 before anything opens', async () => {
  const { default: test } = await import('./test.js');
  writeJourneyFile('a.yaml', journeyYaml({ name: 'first journey' }));
  context.options = {
    ...context.options,
    headless: true,
    build: true,
    concurrency: '0',
    typedOptions: ['headless', 'build', 'concurrency'],
  };
  await test({ context });
  expect(logs.error).toEqual([
    '--concurrency must be a whole number of journeys at once, 1 or more. Received "0".',
  ]);
  expect(mockStartDevServer).not.toHaveBeenCalled();
  expect(mockOpenTestApp).not.toHaveBeenCalled();
  expect(process.exitCode).toBe(1);
});

test('test --headless runs a typed --concurrency of data set journeys side by side, printed in selection order', async () => {
  const { default: test } = await import('./test.js');
  writeJourneyFile('a.yaml', dataJourneyYaml({ name: 'slow' }));
  writeJourneyFile('b.yaml', dataJourneyYaml({ name: 'quick' }));
  writeJourneyFile('c.yaml', dataJourneyYaml({ name: 'next' }));
  context.options = {
    ...context.options,
    headless: true,
    concurrency: '2',
    typedOptions: ['headless', 'concurrency'],
  };
  const flight = { now: 0, max: 0, order: [] };
  mockPost.mockImplementation(async (url, body) => {
    flight.now += 1;
    flight.max = Math.max(flight.max, flight.now);
    expect(body.headless).toBe(true);
    // The first journey answers last.
    const first = flight.order.length === 0;
    flight.order.push(first);
    await new Promise((resolve) => setTimeout(resolve, first ? 60 : 0));
    flight.now -= 1;
    return { data: { passed: true, steps: [] } };
  });
  await test({ context });
  expect(flight.max).toBe(2);
  expect(logs.info.filter((line) => line.startsWith('PASS'))).toEqual([
    expect.stringMatching(/^PASS {2}slow/),
    expect.stringMatching(/^PASS {2}quick/),
    expect.stringMatching(/^PASS {2}next/),
  ]);
  expect(process.exitCode).toBeUndefined();
});

test('test --headless on the dev server runs one at a time by default, also with a concurrency from lowdefy.yaml', async () => {
  const { default: test } = await import('./test.js');
  const spies = [
    vi.spyOn(os, 'availableParallelism').mockReturnValue(8),
    vi.spyOn(os, 'totalmem').mockReturnValue(64 * 1024 ** 3),
  ];
  onTestFinished(() => spies.forEach((spy) => spy.mockRestore()));
  writeJourneyFile('a.yaml', dataJourneyYaml({ name: 'first' }));
  writeJourneyFile('b.yaml', dataJourneyYaml({ name: 'second' }));
  context.options = {
    ...context.options,
    headless: true,
    concurrency: 2,
    typedOptions: ['headless'],
  };
  // A headless post names no journey: each answers after 30 ms, keyed on its one step.
  const flight = delayedPosts({ delays: { 1: 30 } });
  await test({ context });
  expect(flight.max).toBe(1);
  expect(process.exitCode).toBeUndefined();
});

test('test --headless posts each journey headless to the dev server, takes only the worktree slot and lists browser-only ones', async () => {
  const { default: test } = await import('./test.js');
  writeJourneyFile('a.yaml', journeyYaml({ name: 'clicks submit' }));
  writeJourneyFile('b.yaml', journeyYaml({ name: 'reads the title' }));
  context.options = { ...context.options, headless: true };
  // a.yaml is posted first and passes; b.yaml answers browser-only.
  mockPost
    .mockResolvedValueOnce({
      data: { pageId: 'form', passed: true, steps: [], exercised: { pages: ['form'] } },
    })
    .mockResolvedValueOnce({
      data: {
        pageId: 'form',
        browserOnly: {
          index: 0,
          step: { click: 'submit' },
          reason: 'DownloadFile needs the browser.',
        },
        steps: [],
      },
    });
  await test({ context });
  expect(mockAcquireJourneyRunSlots).toHaveBeenCalledWith({
    context,
    command: 'lowdefy test',
    browser: false,
  });
  expect(mockStartDevServer).toHaveBeenCalledWith({ context });
  expect(mockPost).toHaveBeenCalledTimes(2);
  expect(mockPost.mock.calls.every(([, body]) => body.headless === true)).toBe(true);
  expect(mockPost.mock.calls.every(([, body]) => body.recording === undefined)).toBe(true);
  expect(logs.info).toContain(
    'BROWSER-ONLY  reads the title  step 0 (click "submit"): DownloadFile needs the browser.'
  );
  expect(logs.info[logs.info.length - 2]).toBe(
    '1 passed, 0 failed of 1 journeys, 1 browser-only not run'
  );
  expect(process.exitCode).toBeUndefined();
  const written = JSON.parse(
    fs.readFileSync(path.join(context.directories.test, 'headless-run.json'), 'utf8')
  );
  expect(written.mode).toBe('dev');
  expect(written.journeys['tests/journeys/b.yaml#reads the title'].browserOnly.index).toBe(0);
  expect(fs.existsSync(path.join(context.directories.test, 'run.json'))).toBe(false);
  const exercised = JSON.parse(
    fs.readFileSync(path.join(context.directories.test, 'exercised.json'), 'utf8')
  );
  expect(Object.keys(exercised.journeys)).toEqual(['tests/journeys/a.yaml#clicks submit']);
});

// The build's auth.json, which the build always writes: the access step reads whether auth is
// configured and the roles it declares.
function writeBuildAuth(auth = {}) {
  fs.mkdirSync(context.directories.build, { recursive: true });
  fs.writeFileSync(
    path.join(context.directories.build, 'auth.json'),
    JSON.stringify({
      configured: false,
      roles: [],
      pages: { roles: {} },
      api: { roles: {} },
      ...auth,
    })
  );
}

function headlessContext() {
  context.directories.server = path.join(configDirectory, '.lowdefy', 'server');
  context.options = { ...context.options, headless: true, build: true };
  writeBuildAuth();
}

test('test --headless --build runs headless journeys on the build with no server or slots, and lists the browser-only ones', async () => {
  const { default: test } = await import('./test.js');
  writeJourneyFile('a.yaml', journeyYaml({ name: 'clicks submit' }));
  writeJourneyFile(
    'b.yaml',
    journeyYaml({
      name: 'reads the title',
      steps: '  - click: submit\n  - expect: { title: { contains: Saved } }\n',
    })
  );
  headlessContext();
  await test({ context });
  expect(mockStartDevServer).not.toHaveBeenCalled();
  expect(mockAcquireJourneyRunSlots).not.toHaveBeenCalled();
  expect(mockPost).not.toHaveBeenCalled();
  expect(mockOpenTestApp).toHaveBeenCalledWith({
    configDirectory,
    secrets: {},
    serverDirectory: context.directories.server,
  });
  const app = await mockOpenTestApp.mock.results[0].value;
  expect(mockCreateBuildHost).toHaveBeenCalledTimes(1);
  expect(mockCreateBuildHost).toHaveBeenCalledWith({
    app,
    data: undefined,
    user: { id: 'lowdefy-headless', name: 'Lowdefy Headless', roles: [] },
  });
  expect(mockRunHeadlessJourney).toHaveBeenCalledWith(
    expect.objectContaining({ stepTimeout: 5000, configDirectory })
  );
  expect(mockHostClose).toHaveBeenCalledTimes(1);
  expect(logs.info).toEqual([
    expect.stringMatching(/^PASS {2}clicks submit {2}\(1 steps, \d+ms\)$/),
    'BROWSER-ONLY  reads the title  step 1 (expect: { title }): expect "title" reads the page in a browser',
    '1 passed, 0 failed of 1 journeys, 1 browser-only not run',
    [
      'Not run, needs a browser:',
      `  reads the title (${fromCwd('b.yaml')})  step 1 (expect: { title }): expect "title" reads the page in a browser`,
      `Run them in the browser: lowdefy test --thorough --config-directory ${configFromCwd()} ${fromCwd('b.yaml')}`,
    ].join('\n'),
  ]);
  expect(process.exitCode).toBeUndefined();
  const written = JSON.parse(
    fs.readFileSync(path.join(context.directories.test, 'headless-run.json'), 'utf8')
  );
  // Taken on the production build, by its build id.
  expect(written.journeys['tests/journeys/a.yaml#clicks submit']).toEqual({
    passed: true,
    hash: expect.stringMatching(/^[0-9a-f]{40}$/),
    configHashes: ['build-id-1'],
  });
  expect(written.journeys['tests/journeys/b.yaml#reads the title'].browserOnly.index).toBe(1);
  expect(fs.existsSync(path.join(context.directories.test, 'run.json'))).toBe(false);
});

test('test --headless --build gives every journey the LOWDEFY_TEST_SECRET_ values of its environment, and never a LOWDEFY_SECRET_ value', async () => {
  const { default: test } = await import('./test.js');
  writeJourneyFile('a.yaml', journeyYaml({ name: 'clicks submit' }));
  writeJourneyFile('b.yaml', journeyYaml({ name: 'clicks submit again' }));
  headlessContext();
  process.env.LOWDEFY_TEST_SECRET_ORG_ID = 'org-a';
  process.env.LOWDEFY_SECRET_ORG_ID = 'org-real';
  process.env.LOWDEFY_SECRET_X = 'real';
  const app = { close: vi.fn() };
  mockOpenTestApp.mockResolvedValue(app);
  try {
    await test({ context });
  } finally {
    delete process.env.LOWDEFY_TEST_SECRET_ORG_ID;
    delete process.env.LOWDEFY_SECRET_ORG_ID;
    delete process.env.LOWDEFY_SECRET_X;
  }
  expect(mockOpenTestApp).toHaveBeenCalledTimes(1);
  expect(mockOpenTestApp).toHaveBeenCalledWith({
    configDirectory,
    secrets: { ORG_ID: 'org-a' },
    serverDirectory: context.directories.server,
  });
  expect(mockCreateBuildHost).toHaveBeenCalledTimes(2);
  mockCreateBuildHost.mock.calls.forEach(([options]) => {
    expect(options.app).toBe(app);
  });
  expect(mockRunHeadlessJourney).toHaveBeenCalledTimes(2);
  expect(process.exitCode).toBeUndefined();
});

test('test --headless --build is refused with the harness message when the build cannot be read', async () => {
  const { default: test } = await import('./test.js');
  writeJourneyFile('a.yaml', journeyYaml({ name: 'clicks submit' }));
  headlessContext();
  mockOpenTestApp.mockRejectedValue(new Error('No Lowdefy build found at "x".'));
  await test({ context });
  expect(logs.error).toEqual(['No Lowdefy build found at "x".']);
  expect(mockCreateBuildHost).not.toHaveBeenCalled();
  expect(process.exitCode).toBe(1);
});

test('test --headless --build fails on a failed journey and does not repeat one the runner calls browser-only', async () => {
  const { default: test } = await import('./test.js');
  writeJourneyFile('a.yaml', journeyYaml({ name: 'clicks submit' }));
  writeJourneyFile('b.yaml', journeyYaml({ name: 'downloads a file' }));
  headlessContext();
  context.options.repeat = '2';
  mockRunHeadlessJourney.mockImplementation(async ({ journey }) => {
    if (journey.name === 'downloads a file') {
      return {
        pageId: 'form',
        steps: [],
        browserOnly: {
          index: 0,
          step: { click: 'submit' },
          reason: 'DownloadFile needs the browser.',
        },
      };
    }
    return {
      pageId: 'form',
      passed: false,
      steps: [],
      failure: { index: 0, step: { click: 'submit' }, message: 'Block "submit" is not visible.' },
    };
  });
  await test({ context });
  expect(mockRunHeadlessJourney).toHaveBeenCalledTimes(3);
  expect(logs.info).toContain(
    'BROWSER-ONLY  downloads a file  step 0 (click "submit"): DownloadFile needs the browser.'
  );
  expect(logs.error[0]).toMatch(/^FAIL {3}clicks submit/);
  expect(logs.error[logs.error.length - 1]).toBe(
    '0 passed, 1 failed of 1 journeys, 1 browser-only not run'
  );
  expect(process.exitCode).toBe(1);
});

test('test --build lists a journey an earlier run found browser-only on the same build without running it again', async () => {
  const { default: test } = await import('./test.js');
  writeJourneyFile('a.yaml', journeyYaml({ name: 'clicks submit' }));
  writeJourneyFile('b.yaml', journeyYaml({ name: 'downloads a file' }));
  headlessContext();
  mockRunHeadlessJourney.mockImplementation(async ({ journey }) => {
    if (journey.name === 'downloads a file') {
      return {
        pageId: 'form',
        steps: [],
        browserOnly: {
          index: 0,
          step: { click: 'submit' },
          reason: 'DownloadFile needs the browser.',
        },
      };
    }
    return { pageId: 'form', passed: true, steps: [] };
  });
  await test({ context });
  expect(mockRunHeadlessJourney).toHaveBeenCalledTimes(2);

  // The same build: only the other journey runs.
  mockRunHeadlessJourney.mockClear();
  logs.info = [];
  await test({ context });
  expect(mockRunHeadlessJourney.mock.calls.map(([{ journey }]) => journey.name)).toEqual([
    'clicks submit',
  ]);
  expect(logs.info).toContain(
    'BROWSER-ONLY  downloads a file  step 0 (click "submit"): DownloadFile needs the browser; found by an earlier run, not run again'
  );
  expect(logs.info[logs.info.length - 2]).toBe(
    '1 passed, 0 failed of 1 journeys, 1 browser-only not run'
  );
  expect(logs.info[logs.info.length - 1]).toMatch(
    /\(found by an earlier run\)\nRun them in the browser: lowdefy test --thorough /
  );
  expect(process.exitCode).toBeUndefined();

  expect(
    JSON.parse(fs.readFileSync(path.join(context.directories.test, 'headless-run.json'), 'utf8'))
      .journeys['tests/journeys/b.yaml#downloads a file']
  ).toEqual({
    browserOnly: { index: 0, step: { click: 'submit' }, reason: 'DownloadFile needs the browser.' },
    hash: expect.stringMatching(/^[0-9a-f]{40}$/),
    configHashes: ['build-id-1'],
  });

  // A new build: it runs again.
  mockRunHeadlessJourney.mockClear();
  mockOpenTestApp.mockResolvedValue({ buildId: 'build-id-2', close: vi.fn() });
  await test({ context });
  expect(mockRunHeadlessJourney).toHaveBeenCalledTimes(2);
});

// One test app per run: the access step and every journey, and every repeat of one, use the app
// openTestApp opened, each journey on a host (a fresh data session) of its own.
function openOneApp() {
  const app = { accessMatrix: vi.fn(), close: vi.fn() };
  mockOpenTestApp.mockResolvedValue(app);
  return app;
}

test('test --headless --build opens the build once and gives each journey a host of its own on it', async () => {
  const { default: test } = await import('./test.js');
  writeJourneyFile('a.yaml', journeyYaml({ name: 'clicks submit' }));
  writeJourneyFile(
    'b.yaml',
    `name: saves as a member\npageId: form\ndata: harden\nuser: member\nsteps:\n  - click: submit\n`
  );
  writeJourneyFile('c.yaml', journeyYaml({ name: 'clicks submit again' }));
  headlessContext();
  const app = openOneApp();
  await test({ context });
  expect(mockOpenTestApp).toHaveBeenCalledTimes(1);
  expect(mockCreateBuildHost).toHaveBeenCalledTimes(3);
  expect(mockCreateBuildHost.mock.calls.every(([{ app: given }]) => given === app)).toBe(true);
  // The pool runs the journey on a data set first, then those with none, which run alone.
  expect(mockCreateBuildHost.mock.calls.map(([{ data, user }]) => ({ data, user }))).toEqual([
    { data: 'harden', user: 'member' },
    { data: undefined, user: { id: 'lowdefy-headless', name: 'Lowdefy Headless', roles: [] } },
    { data: undefined, user: { id: 'lowdefy-headless', name: 'Lowdefy Headless', roles: [] } },
  ]);
  expect(mockHostClose).toHaveBeenCalledTimes(3);
  expect(app.close).toHaveBeenCalledTimes(1);
  expect(logs.info[logs.info.length - 1]).toBe('3 passed, 0 failed of 3 journeys');
  expect(process.exitCode).toBeUndefined();
});

test('test --headless --build refuses a journey whose data set is unknown and runs the others on the same app', async () => {
  const { default: test } = await import('./test.js');
  writeJourneyFile('a.yaml', journeyYaml({ name: 'clicks submit' }));
  writeJourneyFile(
    'b.yaml',
    `name: reads a missing data set\npageId: form\ndata: no-such-set\nsteps:\n  - click: submit\n`
  );
  writeJourneyFile('c.yaml', journeyYaml({ name: 'clicks submit again' }));
  headlessContext();
  const app = openOneApp();
  mockCreateBuildHost.mockImplementation(async ({ data }) => {
    if (data === 'no-such-set') {
      throw new Error('Data set "no-such-set" not found in tests/data.');
    }
    return { close: mockHostClose };
  });
  await test({ context });
  expect(mockOpenTestApp).toHaveBeenCalledTimes(1);
  expect(mockCreateBuildHost).toHaveBeenCalledTimes(3);
  expect(mockRunHeadlessJourney).toHaveBeenCalledTimes(2);
  expect(logs.error.some((line) => line.includes('reads a missing data set'))).toBe(true);
  expect(logs.error.some((line) => line.includes('Data set "no-such-set" not found'))).toBe(true);
  expect(logs.error[logs.error.length - 1]).toBe('2 passed, 1 failed of 3 journeys');
  expect(app.close).toHaveBeenCalledTimes(1);
  expect(process.exitCode).toBe(1);
});

test('test --headless --build fails a journey that throws, runs the rest and closes the app once', async () => {
  const { default: test } = await import('./test.js');
  writeJourneyFile('a.yaml', journeyYaml({ name: 'clicks submit' }));
  writeJourneyFile('b.yaml', journeyYaml({ name: 'clicks submit again' }));
  headlessContext();
  const app = openOneApp();
  mockRunHeadlessJourney.mockRejectedValueOnce(new Error('The runner broke.'));
  await test({ context });
  expect(mockRunHeadlessJourney).toHaveBeenCalledTimes(2);
  expect(logs.error.some((line) => line.includes('The runner broke.'))).toBe(true);
  expect(logs.error[logs.error.length - 1]).toBe('1 passed, 1 failed of 2 journeys');
  expect(mockHostClose).toHaveBeenCalledTimes(2);
  expect(app.close).toHaveBeenCalledTimes(1);
  expect(process.exitCode).toBe(1);
});

test('test --headless --build --repeat runs every repeat on the one app', async () => {
  const { default: test } = await import('./test.js');
  writeJourneyFile('a.yaml', journeyYaml({ name: 'clicks submit' }));
  writeJourneyFile('b.yaml', journeyYaml({ name: 'clicks submit again' }));
  headlessContext();
  context.options.repeat = '3';
  const app = openOneApp();
  await test({ context });
  expect(mockOpenTestApp).toHaveBeenCalledTimes(1);
  expect(mockCreateBuildHost).toHaveBeenCalledTimes(6);
  expect(mockCreateBuildHost.mock.calls.every(([{ app: given }]) => given === app)).toBe(true);
  expect(mockHostClose).toHaveBeenCalledTimes(6);
  expect(app.close).toHaveBeenCalledTimes(1);
});

// The build's access table as the harness handle's accessMatrix answers it.
const builtTable = {
  pages: { billing: { finance: 'allow', 'no-role': 'deny', none: 'deny' } },
  endpoints: { approve: { finance: 'allow', 'no-role': 'deny', none: 'deny' } },
};

function accessFilePath() {
  return path.join(configDirectory, 'tests', 'access.yaml');
}

function writeAccessYaml(table) {
  fs.mkdirSync(path.dirname(accessFilePath()), { recursive: true });
  fs.writeFileSync(accessFilePath(), YAML.stringify(table));
}

function openWithTable(table = builtTable) {
  const app = { accessMatrix: vi.fn(async () => table), close: vi.fn() };
  mockOpenTestApp.mockResolvedValue(app);
  return app;
}

function accessContext(options) {
  context.directories.server = path.join(configDirectory, '.lowdefy', 'server');
  context.options = { ...context.options, ...options };
  writeBuildAuth();
}

const firstFileCommand =
  'lowdefy build --no-client-build --config-directory <app> && lowdefy test --update-access --config-directory <app>';

// The commands name the app by its full path: the test's app is outside the working directory.
function withApp(text) {
  return text.replaceAll('<app>', configDirectory);
}

test('test --headless --build checks the access table first, then runs the journeys', async () => {
  const { default: test } = await import('./test.js');
  writeJourneyFile('a.yaml', journeyYaml({ name: 'clicks submit' }));
  headlessContext();
  writeAccessYaml({ data: 'roles', ...builtTable });
  const app = openWithTable();
  await test({ context });
  expect(mockOpenTestApp).toHaveBeenCalledTimes(1);
  expect(app.accessMatrix).toHaveBeenCalledWith({ data: 'roles' });
  expect(app.close).toHaveBeenCalledTimes(1);
  expect(logs.info[0]).toBe('PASS  access table  (1 pages, 1 endpoints)');
  expect(logs.info[1]).toMatch(/^PASS {2}clicks submit/);
  expect(process.exitCode).toBeUndefined();
});

test('test --headless --build fails on a changed cell, names it, and still runs the journeys', async () => {
  const { default: test } = await import('./test.js');
  writeJourneyFile('a.yaml', journeyYaml({ name: 'clicks submit' }));
  headlessContext();
  writeAccessYaml({ data: 'roles', ...builtTable });
  openWithTable({
    pages: builtTable.pages,
    endpoints: { approve: { finance: 'allow', 'no-role': 'allow', none: 'deny' } },
  });
  await test({ context });
  expect(logs.error).toEqual([
    'FAIL  access table: tests/access.yaml differs from the build',
    '      endpoints.approve.no-role: deny → allow',
    withApp(
      '      If these changes are meant, run "lowdefy test --update-access --config-directory <app>" and commit tests/access.yaml.'
    ),
  ]);
  expect(mockRunHeadlessJourney).toHaveBeenCalledTimes(1);
  expect(logs.info[logs.info.length - 1]).toBe('1 passed, 0 failed of 1 journeys');
  expect(process.exitCode).toBe(1);
});

test('test --headless --build checks the whole table on a filtered run', async () => {
  const { default: test } = await import('./test.js');
  writeJourneyFile('a.yaml', journeyYaml({ name: 'clicks submit' }));
  writeJourneyFile('b.yaml', journeyYaml({ name: 'approves a run' }));
  headlessContext();
  context.options.filter = ['approves'];
  writeAccessYaml({ data: 'roles', pages: builtTable.pages, endpoints: {} });
  const app = openWithTable();
  await test({ context });
  expect(app.accessMatrix).toHaveBeenCalledTimes(1);
  expect(logs.error).toContain('      endpoints.approve: added');
  expect(mockRunHeadlessJourney).toHaveBeenCalledTimes(1);
  expect(process.exitCode).toBe(1);
});

test('test --headless --build checks the table of an app with no journeys and keeps exit 0 when it matches', async () => {
  const { default: test } = await import('./test.js');
  headlessContext();
  writeAccessYaml({ data: 'roles', ...builtTable });
  openWithTable();
  await test({ context });
  expect(logs.info).toEqual(['PASS  access table  (1 pages, 1 endpoints)']);
  expect(logs.warn).toEqual(['No tests found. Add journeys to tests/journeys/.']);
  expect(process.exitCode).toBeUndefined();
});

test('test --headless --build exits 1 for an app with no journeys when the table differs', async () => {
  const { default: test } = await import('./test.js');
  headlessContext();
  writeAccessYaml({ data: 'roles', pages: {}, endpoints: builtTable.endpoints });
  openWithTable();
  await test({ context });
  expect(logs.error[1]).toBe('      pages.billing: added');
  expect(logs.warn).toEqual(['No tests found. Add journeys to tests/journeys/.']);
  expect(process.exitCode).toBe(1);
});

test('test --headless --build refuses a build it cannot read once, before any journey, even with no journeys', async () => {
  const { default: test } = await import('./test.js');
  headlessContext();
  mockOpenTestApp.mockRejectedValue(new Error('The build is older than the config.'));
  await test({ context });
  expect(mockOpenTestApp).toHaveBeenCalledTimes(1);
  expect(logs.error).toEqual(['The build is older than the config.']);
  expect(logs.warn).toEqual([]);
  expect(process.exitCode).toBe(1);
});

test('test --headless --build warns with the first-file command when the app has auth and no access file', async () => {
  const { default: test } = await import('./test.js');
  writeJourneyFile('a.yaml', journeyYaml({ name: 'clicks submit' }));
  headlessContext();
  writeBuildAuth({ configured: true, roles: [{ id: 'finance' }] });
  const app = openWithTable();
  await test({ context });
  expect(app.accessMatrix).not.toHaveBeenCalled();
  expect(logs.warn).toEqual([
    withApp(
      `This app has auth and no tests/access.yaml, so who reaches which page and endpoint is not checked. Write it with "${firstFileCommand}", then commit the files it writes.`
    ),
  ]);
  expect(process.exitCode).toBeUndefined();
});

test('test --headless --build prints nothing about access for an app without auth or access file', async () => {
  const { default: test } = await import('./test.js');
  headlessContext();
  openWithTable();
  await test({ context });
  expect(logs.info).toEqual([]);
  expect(logs.warn).toEqual(['No tests found. Add journeys to tests/journeys/.']);
});

test('test --access checks the table alone and runs no journeys', async () => {
  const { default: test } = await import('./test.js');
  writeJourneyFile('a.yaml', journeyYaml({ name: 'clicks submit' }));
  accessContext({ access: true });
  writeAccessYaml({ data: 'roles', ...builtTable });
  openWithTable();
  await test({ context });
  expect(logs.info).toEqual(['PASS  access table  (1 pages, 1 endpoints)']);
  expect(mockRunHeadlessJourney).not.toHaveBeenCalled();
  expect(mockStartDevServer).not.toHaveBeenCalled();
  expect(process.exitCode).toBeUndefined();
  expect(context.sendTelemetry).toHaveBeenCalled();
});

test('test --access fails with the first-file command when the app has no access file', async () => {
  const { default: test } = await import('./test.js');
  accessContext({ access: true });
  openWithTable();
  await test({ context });
  expect(logs.error).toEqual([
    withApp(
      `No tests/access.yaml to check. Write it with "${firstFileCommand}", then commit the files it writes.`
    ),
  ]);
  expect(process.exitCode).toBe(1);
});

test('test --access with a journey option is refused before the build opens', async () => {
  const { default: test } = await import('./test.js');
  accessContext({ access: true, tag: ['smoke'], typedOptions: ['tag'] });
  await test({ context });
  expect(logs.error).toEqual([
    '--access checks the access table alone: drop --tag, or run "lowdefy test --build --tag <tag>" to check the table and run those journeys.',
  ]);
  expect(mockOpenTestApp).not.toHaveBeenCalled();
  expect(process.exitCode).toBe(1);
});

test('test --access with --concurrency is refused before the build opens', async () => {
  const { default: test } = await import('./test.js');
  accessContext({ access: true, concurrency: '2', typedOptions: ['concurrency'] });
  await test({ context });
  expect(logs.error).toEqual([
    '--access checks the access table alone: drop --concurrency, or run "lowdefy test --concurrency <n>" to run the browser journeys side by side.',
  ]);
  expect(mockOpenTestApp).not.toHaveBeenCalled();
  expect(process.exitCode).toBe(1);
});

test('test --update-access writes the roles data set and the first table, and runs nothing else', async () => {
  const { default: test } = await import('./test.js');
  writeJourneyFile('a.yaml', journeyYaml({ name: 'clicks submit' }));
  accessContext({ updateAccess: true });
  writeBuildAuth({ configured: true, roles: [{ id: 'finance' }] });
  const app = openWithTable();
  await test({ context });
  expect(app.accessMatrix).toHaveBeenCalledWith({ data: 'roles' });
  const roles = YAML.parse(
    fs.readFileSync(path.join(configDirectory, 'tests', 'data', 'roles.yaml'), 'utf8')
  );
  expect(roles).toEqual({
    users: {
      finance: { id: 'finance', roles: ['finance'] },
      'no-role': { id: 'no-role', roles: [] },
    },
  });
  expect(YAML.parse(fs.readFileSync(accessFilePath(), 'utf8'))).toEqual({
    data: 'roles',
    ...builtTable,
  });
  expect(logs.info).toEqual([
    'Wrote tests/data/roles.yaml with users finance, no-role.',
    'Wrote tests/access.yaml: 1 pages and 1 endpoints as data set "roles". Commit the files written.',
  ]);
  expect(mockRunHeadlessJourney).not.toHaveBeenCalled();
  expect(mockStartDevServer).not.toHaveBeenCalled();
  expect(process.exitCode).toBeUndefined();
});

test("test --update-access keeps the file's data set and lists what changed", async () => {
  const { default: test } = await import('./test.js');
  accessContext({ updateAccess: true });
  writeAccessYaml({ data: 'staff', pages: builtTable.pages, endpoints: {} });
  const app = openWithTable();
  await test({ context });
  expect(app.accessMatrix).toHaveBeenCalledWith({ data: 'staff' });
  expect(YAML.parse(fs.readFileSync(accessFilePath(), 'utf8'))).toEqual({
    data: 'staff',
    ...builtTable,
  });
  expect(fs.existsSync(path.join(configDirectory, 'tests', 'data', 'roles.yaml'))).toBe(false);
  expect(logs.info).toEqual(['Updated tests/access.yaml:', '      endpoints.approve: added']);
  expect(process.exitCode).toBeUndefined();
});

test('test on the dev server prints one line naming lowdefy test --access when the app has an access file', async () => {
  const { default: test } = await import('./test.js');
  writeJourneyFile('a.yaml', journeyYaml({ name: 'clicks submit' }));
  writeAccessYaml({ data: 'roles', ...builtTable });
  await test({ context });
  expect(logs.info[0]).toBe(
    withApp(
      'tests/access.yaml is checked on the production build, not the dev server: run "lowdefy build --no-client-build --config-directory <app> && lowdefy test --access --config-directory <app>" to check it.'
    )
  );
  expect(mockOpenTestApp).not.toHaveBeenCalled();
});

test('test --lint prints nothing about access', async () => {
  const { default: test } = await import('./test.js');
  writeJourneyFile('a.yaml', journeyYaml({ name: 'clicks submit' }));
  writeAccessYaml({ data: 'roles', ...builtTable });
  context.options = { ...context.options, lint: true };
  await test({ context });
  expect(logs.info.some((line) => line.includes('access'))).toBe(false);
  expect(mockOpenTestApp).not.toHaveBeenCalled();
});

// The default run: only the journeys that need no browser, headless. --thorough runs each journey
// headless when it can and in the browser when it can't.

function titleJourneyYaml({ name }) {
  return `name: ${name}\npageId: form\nsteps:\n  - expect:\n      title:\n        contains: home\n`;
}

function partwayJourneyYaml({ name, label = 'submit' }) {
  return `name: ${name}\npageId: form\nsteps:\n  - click: ${label}\n  - click: next\n`;
}

const TITLE = {
  index: 0,
  step: { expect: { title: { contains: 'home' } } },
  reason: 'expect "title" reads the page in a browser',
};

const PARTWAY = {
  index: 1,
  step: { click: 'next' },
  reason: 'the click lands on a block the headless run cannot model',
};

// The dev server's build, which hashBuild reads: `app` changes its hash.
function writeDevBuild({ app = 'first' } = {}) {
  const buildDirectory = path.join(context.directories.dev, 'build');
  fs.mkdirSync(path.join(buildDirectory, 'plugins'), { recursive: true });
  fs.writeFileSync(path.join(buildDirectory, 'plugins', 'blockMetas.json'), '{}');
  fs.writeFileSync(path.join(buildDirectory, 'keyMap.json'), '{}');
  fs.writeFileSync(path.join(buildDirectory, 'refMap.json'), '{}');
  fs.writeFileSync(path.join(buildDirectory, 'routes.json'), '[]');
  fs.writeFileSync(path.join(buildDirectory, 'config.json'), '{}');
  fs.writeFileSync(path.join(buildDirectory, 'app.json'), JSON.stringify({ app }));
}

// A dev server whose headless runs find the journey named `partway` needs a browser at its
// second step, and that passes every other run.
function answerMixedRuns() {
  mockPost.mockImplementation(async (url, body) => {
    if (body.headless === true && body.steps.some((step) => step.click === 'next')) {
      return { data: { browserOnly: PARTWAY } };
    }
    // The dev server's headless runner classifies a title check before it opens the page.
    if (body.headless === true && body.steps.some((step) => step.expect?.title)) {
      return { data: { browserOnly: TITLE } };
    }
    return { data: { passed: true, steps: [] } };
  });
}

function postedRuns() {
  return mockPost.mock.calls.map(([, body]) => ({
    headless: body.headless === true,
    first: body.steps[0],
  }));
}

function readHeadlessRunFile() {
  return JSON.parse(
    fs.readFileSync(path.join(context.directories.test, 'headless-run.json'), 'utf8')
  );
}

// The config directory as the browser-only note's command names it: from the working directory.
function configFromCwd() {
  return path.relative(process.cwd(), configDirectory).split(path.sep).join('/');
}

// A journey file's path as the browser-only note names it: from the working directory.
function fromCwd(fileName) {
  return path
    .relative(process.cwd(), path.join(configDirectory, 'tests', 'journeys', fileName))
    .split(path.sep)
    .join('/');
}

const PARTWAY_LINE =
  'BROWSER-ONLY  goes next  step 1 (click "next"): the click lands on a block the headless run cannot model';

test('test runs only the journeys that need no browser by default, and names the rest with the command that runs them', async () => {
  const { default: test } = await import('./test.js');
  writeDevBuild();
  answerMixedRuns();
  writeJourneyFile('a.yaml', journeyYaml({ name: 'clicks submit' }));
  writeJourneyFile('c.yaml', partwayJourneyYaml({ name: 'goes next' }));
  await test({ context });
  expect(postedRuns()).toEqual([
    { headless: true, first: { click: 'submit' } },
    { headless: true, first: { click: 'submit' } },
  ]);
  // A journey the classifier marks browser-only is posted headless too, and never to the browser.
  mockPost.mockClear();
  logs.info = [];
  writeJourneyFile('b.yaml', titleJourneyYaml({ name: 'reads the title' }));
  context.options.paths = [path.join(configDirectory, 'tests', 'journeys', 'b.yaml')];
  await test({ context });
  expect(postedRuns()).toEqual([
    { headless: true, first: { expect: { title: { contains: 'home' } } } },
  ]);
  expect(logs.info[logs.info.length - 2]).toBe(
    '0 passed, 0 failed of 0 journeys, 1 browser-only not run'
  );
  expect(mockAcquireJourneyRunSlots).toHaveBeenCalledWith({
    context,
    command: 'lowdefy test',
    browser: false,
  });
  delete context.options.paths;
  fs.rmSync(path.join(configDirectory, 'tests', 'journeys', 'b.yaml'));
  fs.rmSync(path.join(context.directories.test, 'headless-run.json'));
  mockPost.mockClear();
  logs.info = [];
  await test({ context });
  expect(postedRuns()).toEqual([
    { headless: true, first: { click: 'submit' } },
    { headless: true, first: { click: 'submit' } },
  ]);
  expect(mockPost.mock.calls.every(([, body]) => body.recording === undefined)).toBe(true);
  expect(logs.info).toContainEqual(
    expect.stringMatching(/^PASS {2}clicks submit {2}\(1 steps, \d+ms\)$/)
  );
  expect(logs.info).toContain(PARTWAY_LINE);
  expect(logs.info.slice(-2)).toEqual([
    '1 passed, 0 failed of 1 journeys, 1 browser-only not run',
    [
      'Not run, needs a browser:',
      `  goes next (${fromCwd('c.yaml')})  step 1 (click "next"): the click lands on a block the headless run cannot model`,
      `Run them in the browser: lowdefy test --thorough --config-directory ${configFromCwd()} ${fromCwd('c.yaml')}`,
    ].join('\n'),
  ]);
  expect(process.exitCode).toBeUndefined();
  // A headless run starts no browser, so it takes only its worktree's journey run slot.
  expect(mockAcquireJourneyRunSlots).toHaveBeenCalledWith({
    context,
    command: 'lowdefy test',
    browser: false,
  });
  const written = readHeadlessRunFile();
  expect(written.mode).toEqual('dev');
  expect(Object.keys(written.journeys).sort()).toEqual([
    'tests/journeys/a.yaml#clicks submit',
    'tests/journeys/c.yaml#goes next',
  ]);
  expect(written.journeys['tests/journeys/c.yaml#goes next']).toEqual({
    browserOnly: PARTWAY,
    hash: expect.stringMatching(/^[0-9a-f]{40}$/),
    // The dev server's build and the config source as the run started (devBuildHash).
    configHashes: [expect.stringMatching(/^[0-9a-f]{40}\+[0-9a-f]{40}$/)],
  });
});

test('--headless runs as the default does', async () => {
  const { default: test } = await import('./test.js');
  writeDevBuild();
  answerMixedRuns();
  writeJourneyFile('a.yaml', journeyYaml({ name: 'clicks submit' }));
  writeJourneyFile('c.yaml', partwayJourneyYaml({ name: 'goes next' }));
  context.options = { ...context.options, headless: true, typedOptions: ['headless'] };
  await test({ context });
  expect(postedRuns().every((run) => run.headless)).toBe(true);
  expect(logs.info[logs.info.length - 1]).toMatch(
    /\nRun them in the browser: lowdefy test --thorough /
  );
  expect(mockAcquireJourneyRunSlots).toHaveBeenCalledWith({
    context,
    command: 'lowdefy test',
    browser: false,
  });
});

test('a later default run lists a journey found partway through without running it again, and keeps its record', async () => {
  const { default: test } = await import('./test.js');
  writeDevBuild();
  answerMixedRuns();
  writeJourneyFile('a.yaml', journeyYaml({ name: 'clicks submit' }));
  writeJourneyFile('c.yaml', partwayJourneyYaml({ name: 'goes next' }));
  await test({ context });
  const recorded = readHeadlessRunFile().journeys['tests/journeys/c.yaml#goes next'];
  mockPost.mockClear();
  logs.info = [];

  await test({ context });
  expect(postedRuns()).toEqual([{ headless: true, first: { click: 'submit' } }]);
  expect(logs.info).toContain(`${PARTWAY_LINE}; found by an earlier run, not run again`);
  expect(logs.info.slice(-2)).toEqual([
    '1 passed, 0 failed of 1 journeys, 1 browser-only not run',
    [
      'Not run, needs a browser:',
      `  goes next (${fromCwd('c.yaml')})  step 1 (click "next"): the click lands on a block the headless run cannot model  (found by an earlier run)`,
      `Run them in the browser: lowdefy test --thorough --config-directory ${configFromCwd()} ${fromCwd('c.yaml')}`,
    ].join('\n'),
  ]);
  expect(process.exitCode).toBeUndefined();
  expect(mockAcquireJourneyRunSlots).toHaveBeenCalledWith({
    context,
    command: 'lowdefy test',
    browser: false,
  });
  expect(readHeadlessRunFile().journeys['tests/journeys/c.yaml#goes next']).toEqual(recorded);

  // A run of a subset keeps the records of the journeys it did not select.
  mockPost.mockClear();
  context.options.paths = [path.join(configDirectory, 'tests', 'journeys', 'a.yaml')];
  await test({ context });
  expect(postedRuns()).toEqual([{ headless: true, first: { click: 'submit' } }]);
  expect(readHeadlessRunFile().journeys['tests/journeys/c.yaml#goes next']).toEqual(recorded);
});

test('a journey found partway through runs again once the journey or the config changes', async () => {
  const { default: test } = await import('./test.js');
  writeDevBuild();
  answerMixedRuns();
  writeJourneyFile('c.yaml', partwayJourneyYaml({ name: 'goes next' }));
  await test({ context });

  // The journey changed: it runs headless again, and is found again.
  mockPost.mockClear();
  writeJourneyFile('c.yaml', partwayJourneyYaml({ name: 'goes next', label: 'save' }));
  await test({ context });
  expect(postedRuns()).toEqual([{ headless: true, first: { click: 'save' } }]);

  // The config changed: the same.
  mockPost.mockClear();
  writeDevBuild({ app: 'second' });
  await test({ context });
  expect(postedRuns()).toEqual([{ headless: true, first: { click: 'save' } }]);

  // Neither changed since: it is listed, not run.
  mockPost.mockClear();
  await test({ context });
  expect(postedRuns()).toEqual([]);
  expect(logs.info[logs.info.length - 2]).toBe(
    '0 passed, 0 failed of 0 journeys, 1 browser-only not run'
  );
});

test('a journey found partway through runs again after an edit to any config file, built or not', async () => {
  const { default: test } = await import('./test.js');
  writeDevBuild();
  answerMixedRuns();
  writeJourneyFile('c.yaml', partwayJourneyYaml({ name: 'goes next' }));
  fs.mkdirSync(path.join(configDirectory, 'pages'), { recursive: true });
  fs.writeFileSync(path.join(configDirectory, 'pages', 'form.yaml'), 'id: form\ntype: Box\n');
  await test({ context });
  mockPost.mockClear();
  await test({ context });
  expect(postedRuns()).toEqual([]);

  // The page's source changed, though the server has not rebuilt it: the build hash is the same.
  fs.writeFileSync(path.join(configDirectory, 'pages', 'form.yaml'), 'id: form\ntype: Card\n');
  await test({ context });
  expect(postedRuns()).toEqual([{ headless: true, first: { click: 'submit' } }]);

  // An edit to another journey file is not a config edit.
  mockPost.mockClear();
  writeJourneyFile('a.yaml', journeyYaml({ name: 'clicks submit' }));
  context.options.paths = [path.join(configDirectory, 'tests', 'journeys', 'c.yaml')];
  await test({ context });
  expect(postedRuns()).toEqual([]);
});

test('test --thorough runs each journey once, headless when it can, in the browser when the classifier says it needs one', async () => {
  const { default: test } = await import('./test.js');
  writeDevBuild();
  answerMixedRuns();
  writeJourneyFile('a.yaml', journeyYaml({ name: 'clicks submit' }));
  writeJourneyFile('b.yaml', titleJourneyYaml({ name: 'reads the title' }));
  context.options.thorough = true;
  await test({ context });
  expect(postedRuns()).toEqual([
    { headless: true, first: { click: 'submit' } },
    { headless: false, first: { expect: { title: { contains: 'home' } } } },
  ]);
  expect(logs.info).toContainEqual(
    expect.stringMatching(/^PASS {2}clicks submit {2}\(1 steps, \d+ms\) {2}\[headless\]$/)
  );
  expect(logs.info).toContainEqual(
    expect.stringMatching(/^PASS {2}reads the title {2}\(1 steps, \d+ms\) {2}\[browser\]$/)
  );
  expect(logs.info[logs.info.length - 1]).toEqual('2 passed, 0 failed of 2 journeys');
  // A thorough run may need the browser for any journey, so it takes the slots up front.
  expect(mockAcquireJourneyRunSlots).toHaveBeenCalledTimes(1);
  expect(mockReleaseSlots).toHaveBeenCalledTimes(1);
});

test('test --thorough runs a journey found partway through in the browser from step 1, in the same run', async () => {
  const { default: test } = await import('./test.js');
  writeDevBuild();
  answerMixedRuns();
  writeJourneyFile('a.yaml', journeyYaml({ name: 'clicks submit' }));
  writeJourneyFile('c.yaml', partwayJourneyYaml({ name: 'goes next' }));
  context.options.thorough = true;
  await test({ context });
  expect(postedRuns()).toEqual([
    { headless: true, first: { click: 'submit' } },
    { headless: true, first: { click: 'submit' } },
    { headless: false, first: { click: 'submit' } },
  ]);
  expect(logs.info).toContain(`${PARTWAY_LINE}; running it in the browser`);
  expect(logs.info).toContainEqual(
    expect.stringMatching(/^PASS {2}goes next {2}\(2 steps, \d+ms\) {2}\[browser\]$/)
  );
  expect(logs.info[logs.info.length - 1]).toEqual('2 passed, 0 failed of 2 journeys');
  expect(mockAcquireJourneyRunSlots).toHaveBeenCalledTimes(1);
  expect(readHeadlessRunFile().journeys['tests/journeys/c.yaml#goes next'].browserOnly).toEqual(
    PARTWAY
  );
});

test('test --thorough sends a journey a default run found partway through straight to the browser', async () => {
  const { default: test } = await import('./test.js');
  writeDevBuild();
  answerMixedRuns();
  writeJourneyFile('a.yaml', journeyYaml({ name: 'clicks submit' }));
  writeJourneyFile('c.yaml', partwayJourneyYaml({ name: 'goes next' }));
  await test({ context });
  const recorded = readHeadlessRunFile().journeys['tests/journeys/c.yaml#goes next'];
  mockPost.mockClear();
  logs.info = [];

  context.options.thorough = true;
  await test({ context });
  expect(postedRuns()).toEqual([
    { headless: true, first: { click: 'submit' } },
    { headless: false, first: { click: 'submit' } },
  ]);
  expect(logs.info[logs.info.length - 1]).toEqual('2 passed, 0 failed of 2 journeys');
  expect(readHeadlessRunFile().journeys['tests/journeys/c.yaml#goes next']).toEqual(recorded);
});

test('a journey that fails in the browser part of a thorough run fails the run', async () => {
  const { default: test } = await import('./test.js');
  mockPost.mockImplementation(async (url, body) => {
    if (body.headless === true) {
      return { data: { browserOnly: PARTWAY } };
    }
    return {
      data: {
        passed: false,
        failure: { step: 1, action: { click: 'next' }, message: 'next is hidden' },
      },
    };
  });
  writeJourneyFile('c.yaml', partwayJourneyYaml({ name: 'goes next' }));
  context.options.thorough = true;
  await test({ context });
  expect(logs.error[0]).toEqual('FAIL  goes next  [browser]');
  expect(logs.error[logs.error.length - 1]).toEqual('0 passed, 1 failed of 1 journeys');
  expect(process.exitCode).toBe(1);
});

test('a default run and a thorough run both take a typed --concurrency', async () => {
  const { default: test } = await import('./test.js');
  context.options.concurrency = '2';
  context.options.typedOptions = ['concurrency'];
  writeJourneyFile('a.yaml', journeyYaml({ name: 'clicks submit' }));
  await test({ context });
  expect(logs.error).toEqual([]);
  expect(process.exitCode).toBeUndefined();

  context.options.thorough = true;
  await test({ context });
  expect(process.exitCode).toBeUndefined();
  expect(logs.info[logs.info.length - 1]).toEqual('1 passed, 0 failed of 1 journeys');
});

test.each([
  [{ browser: true, headless: true }],
  [{ browser: true, thorough: true }],
  [{ thorough: true, headless: true }],
])('test refuses two of --browser, --thorough and --headless (%j)', async (flags) => {
  const { default: test } = await import('./test.js');
  writeJourneyFile('a.yaml', journeyYaml({ name: 'clicks submit' }));
  context.options = { port: 3000, ...flags };
  await test({ context });
  expect(logs.error[0]).toMatch(
    /^--browser, --thorough and --headless each pick where the journeys run: pass one of them\./
  );
  expect(process.exitCode).toBe(1);
  expect(mockStartDevServer).not.toHaveBeenCalled();
});

test.each([
  [{ thorough: true }, '--thorough'],
  [{ browser: true }, '--browser'],
])(
  'test --build refuses %j until the browser part runs on the production build',
  async (flags, flag) => {
    const { default: test } = await import('./test.js');
    writeJourneyFile('a.yaml', journeyYaml({ name: 'clicks submit' }));
    context.options = { port: 3000, build: true, ...flags };
    await test({ context });
    expect(logs.error[0]).toBe(
      `--build runs the journeys that need no browser on the production build. Running the browser journeys on the production build is not supported yet: drop --build and run "lowdefy test ${flag}" to run them on the dev server.`
    );
    expect(process.exitCode).toBe(1);
    expect(mockStartDevServer).not.toHaveBeenCalled();
    expect(mockOpenTestApp).not.toHaveBeenCalled();
  }
);

test('a record counts on a dev server kept running, whose build gained the pages the run opened', async () => {
  const { default: test } = await import('./test.js');
  writeDevBuild();
  // The dev server builds a page as a journey first opens it.
  mockPost.mockImplementation(async (url, body) => {
    const pages = path.join(context.directories.dev, 'build', 'pages');
    fs.mkdirSync(pages, { recursive: true });
    fs.writeFileSync(path.join(pages, `${body.pageId}.json`), JSON.stringify({ id: body.pageId }));
    if (body.headless === true) {
      return { data: { browserOnly: PARTWAY } };
    }
    return { data: { passed: true, steps: [] } };
  });
  writeJourneyFile('c.yaml', partwayJourneyYaml({ name: 'goes next' }));
  await test({ context });
  expect(
    readHeadlessRunFile().journeys['tests/journeys/c.yaml#goes next'].configHashes
  ).toHaveLength(2);

  mockPost.mockClear();
  await test({ context });
  expect(postedRuns()).toEqual([]);

  context.options.thorough = true;
  await test({ context });
  expect(postedRuns()).toEqual([{ headless: false, first: { click: 'submit' } }]);
});

const HELD_JOURNEY =
  'name: holds and goes next\npageId: form\ndata: base\nsteps:\n  - hold: { requestId: save }\n  - click: next\n';

const HELD_NOTE =
  'It has a hold, release or call as system step, which only the headless runner takes, so no run takes it to the browser.';

test('a thorough run leaves a journey with a step only the headless runner takes browser-only', async () => {
  const { default: test } = await import('./test.js');
  mockPost.mockResolvedValue({ data: { browserOnly: PARTWAY } });
  writeJourneyFile('h.yaml', HELD_JOURNEY);
  context.options.thorough = true;
  await test({ context });
  expect(postedRuns()).toEqual([{ headless: true, first: { hold: { requestId: 'save' } } }]);
  expect(logs.info).toContain(
    'BROWSER-ONLY  holds and goes next  step 1 (click "next"): the click lands on a block the headless run cannot model'
  );
  expect(process.exitCode).toBeUndefined();
  // No run takes the journey to the browser: the note names it and says why, with no command.
  expect(logs.info[logs.info.length - 1]).toBe(
    [
      'Not run, needs a browser:',
      `  holds and goes next (${fromCwd('h.yaml')})  step 1 (click "next"): the click lands on a block the headless run cannot model`,
      HELD_NOTE,
    ].join('\n')
  );
});

test('a default run gives no command for a journey with a step only the headless runner takes', async () => {
  const { default: test } = await import('./test.js');
  mockPost.mockResolvedValue({ data: { browserOnly: PARTWAY } });
  writeJourneyFile('h.yaml', HELD_JOURNEY);
  await test({ context });
  expect(logs.info.some((line) => line.includes('--thorough'))).toBe(false);
  expect(logs.info[logs.info.length - 1].split('\n').slice(-1)).toEqual([HELD_NOTE]);
});

test('a default run skips by the records it read before the server started, not by a record written after', async () => {
  const { default: test } = await import('./test.js');
  writeDevBuild();
  answerMixedRuns();
  writeJourneyFile('c.yaml', partwayJourneyYaml({ name: 'goes next' }));
  await test({ context });
  const filePath = path.join(context.directories.test, 'headless-run.json');
  const recorded = fs.readFileSync(filePath, 'utf8');

  // The record lands while the server starts: another run of the app wrote it.
  fs.rmSync(filePath);
  mockPost.mockClear();
  mockStartDevServer.mockImplementation(async () => {
    fs.writeFileSync(filePath, recorded);
    return { url: 'http://localhost:3228', stop: mockStop };
  });
  await test({ context });
  expect(postedRuns()).toEqual([{ headless: true, first: { click: 'submit' } }]);
});

test('--access refuses --browser and --thorough, naming the command meant', async () => {
  const { default: test } = await import('./test.js');
  context.options = {
    port: 3000,
    access: true,
    browser: true,
    typedOptions: ['access', 'browser'],
  };
  await test({ context });
  expect(logs.error[0]).toBe(
    '--access checks the access table alone: drop --browser, or run "lowdefy test --browser" to run every journey in the browser.'
  );
  logs.error = [];
  context.options = {
    port: 3000,
    access: true,
    thorough: true,
    typedOptions: ['access', 'thorough'],
  };
  await test({ context });
  expect(logs.error[0]).toMatch(/^--access checks the access table alone: drop --thorough/);
});
