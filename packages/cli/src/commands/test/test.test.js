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

import { jest } from '@jest/globals';
import fs from 'fs';
import os from 'os';
import path from 'path';
import YAML from 'yaml';

import flowLines from '../journeys/evidence/flowLines.js';
import sequenceId from '../journeys/evidence/sequenceId.js';

const mockPost = jest.fn();
const mockGet = jest.fn();
jest.unstable_mockModule('axios', () => ({
  default: { post: mockPost, get: mockGet },
}));

// The config text set the tier ranking reads: "Save" is config text, a grid
// cell's data value is not.
const mockReadConfigText = jest.fn(async () => ({
  texts: new Set(['Save']),
  isConfigText: (text) => text === 'Save',
}));
jest.unstable_mockModule('../journeys/configText/readConfigText.js', () => ({
  default: mockReadConfigText,
}));

const mockStop = jest.fn();
const mockStartDevServer = jest.fn();
jest.unstable_mockModule('./startDevServer.js', () => ({
  default: mockStartDevServer,
}));

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
      debug: jest.fn(),
    },
    sendTelemetry: jest.fn(),
  };
  mockReadConfigText.mockClear();
  mockStop.mockResolvedValue();
  mockStartDevServer.mockResolvedValue({ url: 'http://localhost:3228', stop: mockStop });
  mockPost.mockResolvedValue({ data: { passed: true, steps: [] } });
  mockGet.mockResolvedValue({ data: { buildId: 'build-1' } });
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
  writeJourneyFile('a.yaml', 'name: no steps here\npageId: form\n');
  writeJourneyFile('b.yaml', journeyYaml({ name: 'valid journey' }));
  await test({ context });
  expect(mockPost).toHaveBeenCalledTimes(1);
  expect(logs.error[0]).toEqual('FAIL  no steps here');
  expect(logs.error[2]).toEqual(
    '      Invalid journey file: Journey should have required property "steps".'
  );
  expect(logs.info.some((line) => /^PASS  valid journey  \(1 steps, \d+ms\)$/.test(line))).toBe(
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
      [`${path.join('tests', 'journeys', 'a.yaml')}#first journey`]: {
        hash: expect.stringMatching(/^[0-9a-f]{40}$/),
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
  const cwd = jest.spyOn(process, 'cwd').mockReturnValue(configDirectory);
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
  const cwd = jest.spyOn(process, 'cwd').mockReturnValue(configDirectory);
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
    `${path.join('tests', 'journeys', 'a.yaml')}#edits a ticket [admin]`,
    `${path.join('tests', 'journeys', 'a.yaml')}#edits a ticket [member]`,
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
