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

const mockPost = jest.fn();
const mockGet = jest.fn();
jest.unstable_mockModule('axios', () => ({
  default: { post: mockPost, get: mockGet },
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
  expect(logs.warn).toEqual(['No tests found. Add journeys to tests/journeys/*.yaml.']);
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
    'L5  asserts  has no user: name a user from its data set, or write user: none for signed out.'
  );
});

function writeConfigFile(relativePath, content) {
  const filePath = path.join(configDirectory, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

test('test --lint reads data set users without a server when no data set has a snapshot', async () => {
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

test('test --lint builds the pages of snapshot journeys through a dev server, then lints L7 from the build', async () => {
  const { default: test } = await import('./test.js');
  writeConfigFile(
    'tests/data/staging.yaml',
    'snapshot:\n  from: staging\n  connections: [tickets]\nfixtures:\n  tickets:\n    - title: Fixture printer\nusers:\n  member:\n    roles: [member]\n'
  );
  writeConfigFile(
    '.lowdefy/data/staging/manifest.json',
    JSON.stringify({ pulledAt: '2026-10-01T00:00:00.000Z', collections: { tickets: {} } })
  );
  writeConfigFile(
    '.lowdefy/data/staging/tickets.jsonl',
    `${JSON.stringify({ title: 'Staging customer' })}\n`
  );
  const build = path.join(configDirectory, '.lowdefy', 'dev', 'build');
  writeConfigFile(
    '.lowdefy/dev/build/pages/form.json',
    JSON.stringify({ id: 'form', properties: { title: 'Form' } })
  );
  writeConfigFile('.lowdefy/dev/build/menus.json', '[]');
  writeConfigFile(
    '.lowdefy/dev/build/i18n.json',
    JSON.stringify({ defaultLocale: 'en', messages: { en: {} } })
  );
  writeJourneyFile(
    'a.yaml',
    [
      'name: finds a staging ticket',
      'pageId: form',
      'data: staging',
      'user: member',
      'steps:',
      '  - fill: { blockId: search, value: Staging customer }',
      '  - expect: { text: { blockId: grid, contains: Fixture printer } }',
      '  - expect: { text: { blockId: grid, contains: Acme Staging Ltd } }',
      '',
    ].join('\n')
  );
  mockGet.mockResolvedValue({ data: { id: 'form' } });
  context.options = { lint: true };
  await test({ context });
  expect(fs.existsSync(build)).toBe(true);
  expect(mockStartDevServer).toHaveBeenCalledWith({ context });
  expect(mockGet).toHaveBeenCalledWith('http://localhost:3228/lowdefy-docs/page-config/form', {
    timeout: 60000,
  });
  expect(mockStop).toHaveBeenCalledTimes(1);
  expect(logs.error).toEqual([
    'L7  finds a staging ticket  step 0 (fill "search") types "Staging customer", which only the pulled snapshot of data set "staging" holds: type a fixture value or new text.',
    'L7  finds a staging ticket  step 2 (expect: { text }) contains "Acme Staging Ltd" is not part of the app\'s text, a fixture or user of data set "staging", or an earlier fill: on a snapshot data set it may exist in only one pull. Use a fixture value.',
    'Linted 1 journeys: 2 errors, 1 warnings.',
  ]);
  expect(process.exitCode).toBe(1);
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
