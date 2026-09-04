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
jest.unstable_mockModule('axios', () => ({
  default: { post: mockPost },
}));

const mockStop = jest.fn();
const mockStartDevServer = jest.fn();
jest.unstable_mockModule('./startDevServer.js', () => ({
  default: mockStartDevServer,
}));

const mockLoadMemoryMongo = jest.fn();
jest.unstable_mockModule('./loadMemoryMongo.js', () => ({ default: mockLoadMemoryMongo }));

const mockSeedFixtures = jest.fn();
jest.unstable_mockModule('./seedFixtures.js', () => ({ default: mockSeedFixtures }));

const mockMemoryServerStop = jest.fn();
const mockClientClose = jest.fn();
class MockMongoClient {
  constructor(uri) {
    this.uri = uri;
  }
  async connect() {}
  close = mockClientClose;
}

let configDirectory;
let context;
let logs;
const originalExitCode = process.exitCode;

function writeJourneyFile(fileName, content) {
  const directory = path.join(configDirectory, 'tests', 'journeys');
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, fileName), content);
}

function journeyYaml({ name, steps = '  - click: submit\n' }) {
  return `name: ${name}\npageId: form\nsteps:\n${steps}`;
}

function writeRequestTestFile(fileName, content) {
  const directory = path.join(configDirectory, 'tests', 'requests');
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, fileName), content);
}

function requestTestYaml({ name, extra = '' }) {
  return `name: ${name}\npageId: controls\nrequestId: get_controls\nexpect:\n  - title: A\n${extra}`;
}

function postForRoute(handlers) {
  mockPost.mockImplementation((url) => {
    const route = url.slice(url.indexOf('/lowdefy-docs/'));
    return Promise.resolve(handlers[route]());
  });
}

beforeEach(() => {
  process.exitCode = undefined;
  configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-test-command-'));
  logs = { info: [], warn: [], error: [] };
  context = {
    commandLineOptions: {},
    directories: {
      config: configDirectory,
      dev: path.join(configDirectory, '.lowdefy', 'dev'),
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
  mockSeedFixtures.mockResolvedValue();
  mockLoadMemoryMongo.mockResolvedValue({
    MongoMemoryServer: {
      create: async () => ({
        getUri: () => 'mongodb://127.0.0.1:27999/',
        stop: mockMemoryServerStop,
      }),
    },
    MongoClient: MockMongoClient,
  });
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
  expect(logs.warn).toEqual([
    'No tests found. Add journeys to tests/journeys/*.yaml or request tests to tests/requests/*.test.yaml.',
  ]);
  expect(process.exitCode).toBeUndefined();
  expect(context.sendTelemetry).toHaveBeenCalled();
});

test('test boots a dev server, runs every journey and exits 0 when all pass', async () => {
  const { default: test } = await import('./test.js');
  writeJourneyFile('a.yaml', journeyYaml({ name: 'first journey' }));
  writeJourneyFile('b.yaml', journeyYaml({ name: 'second journey' }));
  await test({ context });
  expect(mockStartDevServer).toHaveBeenCalledWith({ context, env: {} });
  expect(mockPost).toHaveBeenCalledTimes(2);
  expect(mockPost.mock.calls[0][0]).toEqual('http://localhost:3228/lowdefy-docs/journey');
  expect(mockStop).toHaveBeenCalledTimes(1);
  expect(logs.info.filter((line) => line.startsWith('PASS'))).toHaveLength(2);
  expect(logs.info[logs.info.length - 1]).toEqual('2 passed, 0 failed of 2 tests');
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
    '1 passed, 1 failed of 2 tests',
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
  expect(logs.info).toContain('2 passed, 0 failed of 2 tests');
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

test('test --url targets a running server and does not boot or stop one', async () => {
  const { default: test } = await import('./test.js');
  writeJourneyFile('a.yaml', journeyYaml({ name: 'first journey' }));
  context.options.url = 'http://localhost:3000/';
  await test({ context });
  expect(mockStartDevServer).not.toHaveBeenCalled();
  expect(mockStop).not.toHaveBeenCalled();
  expect(mockPost.mock.calls[0][0]).toEqual('http://localhost:3000/lowdefy-docs/journey');
  expect(logs.info[0]).toEqual('Running against http://localhost:3000.');
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
  expect(logs.error[logs.error.length - 1]).toEqual('1 passed, 1 failed of 2 tests');
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
  const bootError = new Error('Development server did not answer GET /api/ping within 120000ms.');
  bootError.serverOutput = ['line one', 'line two'];
  mockStartDevServer.mockRejectedValue(bootError);
  await expect(test({ context })).rejects.toThrow(
    'Development server did not answer GET /api/ping within 120000ms.'
  );
  expect(logs.error).toEqual(['line one', 'line two']);
  expect(mockPost).not.toHaveBeenCalled();
});

test('test runs journeys and request tests together with one combined summary', async () => {
  const { default: test } = await import('./test.js');
  writeJourneyFile('a.yaml', journeyYaml({ name: 'first journey' }));
  writeRequestTestFile('controls.test.yaml', requestTestYaml({ name: 'lists controls' }));
  postForRoute({
    '/lowdefy-docs/journey': () => ({ data: { passed: true, steps: [] } }),
    '/lowdefy-docs/run-request': () => ({
      data: { refused: false, success: true, response: [{ title: 'A', extra: 1 }] },
    }),
  });
  await test({ context });
  expect(mockStartDevServer).toHaveBeenCalledWith({ context, env: {} });
  expect(mockLoadMemoryMongo).not.toHaveBeenCalled();
  expect(mockPost).toHaveBeenCalledTimes(2);
  expect(mockPost.mock.calls[1][0]).toEqual('http://localhost:3228/lowdefy-docs/run-request');
  expect(logs.info.filter((line) => line.startsWith('PASS'))).toHaveLength(2);
  expect(logs.info[logs.info.length - 1]).toEqual('2 passed, 0 failed of 2 tests');
  expect(process.exitCode).toBeUndefined();
});

test('test --filter selects across both suites', async () => {
  const { default: test } = await import('./test.js');
  writeJourneyFile('a.yaml', journeyYaml({ name: 'member creates a control' }));
  writeJourneyFile('b.yaml', journeyYaml({ name: 'guest signs up' }));
  writeRequestTestFile('a.test.yaml', requestTestYaml({ name: 'get_controls lists controls' }));
  writeRequestTestFile('b.test.yaml', requestTestYaml({ name: 'get_users lists users' }));
  postForRoute({
    '/lowdefy-docs/journey': () => ({ data: { passed: true, steps: [] } }),
    '/lowdefy-docs/run-request': () => ({
      data: { refused: false, success: true, response: [{ title: 'A' }] },
    }),
  });
  context.options.filter = 'Control';
  await test({ context });
  const routes = mockPost.mock.calls.map(([url]) => url.slice(url.indexOf('/lowdefy-docs/')));
  expect(routes).toEqual(['/lowdefy-docs/journey', '/lowdefy-docs/run-request']);
  expect(logs.info).toContain('2 passed, 0 failed of 2 tests');
});

test('test starts a memory MongoDB for seeded request tests, passes the overrides env and stops it', async () => {
  const { default: test } = await import('./test.js');
  writeRequestTestFile(
    'controls.test.yaml',
    requestTestYaml({
      name: 'lists seeded controls',
      extra: 'seed:\n  controls:\n    - _id: c1\n      title: A\n',
    })
  );
  postForRoute({
    '/lowdefy-docs/run-request': () => ({
      data: { refused: false, success: true, response: [{ title: 'A' }] },
    }),
  });
  await test({ context });
  expect(mockStartDevServer).toHaveBeenCalledWith({
    context,
    env: {
      LOWDEFY_TEST_CONNECTION_OVERRIDES: JSON.stringify({
        controls: { databaseUri: 'mongodb://127.0.0.1:27999/' },
      }),
    },
  });
  expect(mockSeedFixtures).toHaveBeenCalledTimes(1);
  expect(mockSeedFixtures.mock.calls[0][0].client).toBeInstanceOf(MockMongoClient);
  expect(mockSeedFixtures.mock.calls[0][0].seed).toEqual({ controls: [{ _id: 'c1', title: 'A' }] });
  expect(logs.info).toContain('Starting in-memory MongoDB for seeded tests.');
  expect(logs.info[logs.info.length - 1]).toEqual('1 passed, 0 failed of 1 tests');
  expect(mockStop).toHaveBeenCalledTimes(1);
  expect(mockClientClose).toHaveBeenCalledTimes(1);
  expect(mockMemoryServerStop).toHaveBeenCalledTimes(1);
});

test('test exits 1 with the install hint when seeded tests run without mongodb-memory-server', async () => {
  const { default: test } = await import('./test.js');
  writeRequestTestFile(
    'controls.test.yaml',
    requestTestYaml({ name: 'seeded', extra: 'seed:\n  controls: []\n' })
  );
  const hint =
    'Request tests with "seed" need an in-memory MongoDB. Install it: pnpm add -D mongodb-memory-server mongodb';
  mockLoadMemoryMongo.mockRejectedValue(new Error(hint));
  await test({ context });
  expect(mockStartDevServer).not.toHaveBeenCalled();
  expect(mockPost).not.toHaveBeenCalled();
  expect(logs.error).toEqual([hint]);
  expect(process.exitCode).toEqual(1);
});

test('test exits 1 and refuses seeded request tests against --url', async () => {
  const { default: test } = await import('./test.js');
  writeRequestTestFile(
    'controls.test.yaml',
    requestTestYaml({ name: 'seeded', extra: 'seed:\n  controls: []\n' })
  );
  context.options.url = 'http://localhost:3000';
  await test({ context });
  expect(mockPost).not.toHaveBeenCalled();
  expect(logs.error).toEqual([
    'Seeded tests need a server this command started; --url targets a server whose connections it cannot redirect.',
  ]);
  expect(process.exitCode).toEqual(1);
});

test('test prints the mismatch path for a failing request test and exits 1', async () => {
  const { default: test } = await import('./test.js');
  writeRequestTestFile('controls.test.yaml', requestTestYaml({ name: 'lists controls' }));
  postForRoute({
    '/lowdefy-docs/run-request': () => ({
      data: { refused: false, success: true, response: [{ title: 'B' }] },
    }),
  });
  await test({ context });
  expect(logs.error).toEqual([
    'FAIL  lists controls',
    `      file: ${path.join(configDirectory, 'tests', 'requests', 'controls.test.yaml')}`,
    '      at: response.0.title',
    '      expected: A',
    '      actual:   B',
    '0 passed, 1 failed of 1 tests',
  ]);
  expect(process.exitCode).toEqual(1);
});

test('test --coverage reports static journey coverage and writes the journey index', async () => {
  const { default: test } = await import('./test.js');
  context.options.coverage = true;
  context.directories.build = path.join(configDirectory, 'build');
  fs.mkdirSync(context.directories.build, { recursive: true });
  fs.writeFileSync(
    path.join(context.directories.build, 'journeyCoverage.json'),
    JSON.stringify({
      pages: {
        form: { events: [{ blockId: 'submit', event: 'onClick' }], requestIds: [] },
        other: { events: [{ blockId: 'cancel', event: 'onClick' }], requestIds: [] },
      },
    })
  );
  writeJourneyFile('a.yaml', journeyYaml({ name: 'first journey' }));
  await test({ context });
  expect(logs.info).toContain('Journey coverage (static, declared config): 1/2 triples, 50%');
  expect(logs.info).toContain('  other (1 uncovered)');
  expect(
    JSON.parse(
      fs.readFileSync(path.join(configDirectory, '.lowdefy', 'test', 'journeyIndex.json'), 'utf8')
    )
  ).toEqual({ pages: { form: ['first journey'] } });
});

test('test does not report coverage without --coverage', async () => {
  const { default: test } = await import('./test.js');
  context.directories.build = path.join(configDirectory, 'build');
  writeJourneyFile('a.yaml', journeyYaml({ name: 'first journey' }));
  await test({ context });
  expect(logs.info.some((line) => line.startsWith('Journey coverage'))).toBe(false);
});

test('test starts a memory MongoDB for a journey with fixtures and clears it between journeys', async () => {
  const { default: test } = await import('./test.js');
  fs.mkdirSync(path.join(configDirectory, 'fixtures'), { recursive: true });
  fs.writeFileSync(
    path.join(configDirectory, 'fixtures', 'base.yaml'),
    'controls:\n  - _id: c1\n    title: A\n'
  );
  writeJourneyFile('a.yaml', `${journeyYaml({ name: 'seeded journey' })}fixtures: [base]\n`);
  writeJourneyFile('b.yaml', journeyYaml({ name: 'plain journey' }));
  await test({ context });
  expect(mockStartDevServer).toHaveBeenCalledWith({
    context,
    env: {
      LOWDEFY_TEST_CONNECTION_OVERRIDES: JSON.stringify({
        controls: { databaseUri: 'mongodb://127.0.0.1:27999/' },
      }),
    },
  });
  // Both journeys seed: the second must not read what the first one's fixture left.
  expect(mockSeedFixtures).toHaveBeenCalledTimes(2);
  expect(mockSeedFixtures.mock.calls[0][0].fixtures[0].connections[0].connectionId).toEqual(
    'controls'
  );
  expect(mockSeedFixtures.mock.calls[1][0].fixtures).toEqual([]);
  expect(mockSeedFixtures.mock.calls[1][0].seeded).toBe(mockSeedFixtures.mock.calls[0][0].seeded);
  expect(logs.info[logs.info.length - 1]).toEqual('2 passed, 0 failed of 2 tests');
});

test('test exits 1 and refuses a journey with fixtures against --url', async () => {
  const { default: test } = await import('./test.js');
  fs.mkdirSync(path.join(configDirectory, 'fixtures'), { recursive: true });
  fs.writeFileSync(path.join(configDirectory, 'fixtures', 'base.yaml'), 'controls: []\n');
  writeJourneyFile('a.yaml', `${journeyYaml({ name: 'seeded journey' })}fixtures: [base]\n`);
  context.options.url = 'http://localhost:3000';
  await test({ context });
  expect(mockPost).not.toHaveBeenCalled();
  expect(logs.error).toEqual([
    'Seeded tests need a server this command started; --url targets a server whose connections it cannot redirect.',
  ]);
  expect(process.exitCode).toEqual(1);
});

test('test exits 1 on an expectation with no equals and does not report it as passed', async () => {
  const { default: test } = await import('./test.js');
  writeJourneyFile(
    'a.yaml',
    journeyYaml({
      name: 'incomplete journey',
      steps: '  - click: submit\n  - expect: { state: { path: title } }\n',
    })
  );
  await test({ context });
  expect(mockPost).not.toHaveBeenCalled();
  expect(logs.error).toContain(
    '      Incomplete expectation at step 1: "expect.state" for path "title" has no "equals". Run lowdefy test --update to fill it from the observed state.'
  );
  expect(process.exitCode).toEqual(1);
});

test('test --update fills an empty expectation from the observed state and rewrites the file', async () => {
  const { default: test } = await import('./test.js');
  writeJourneyFile(
    'a.yaml',
    `# a recorded journey\n${journeyYaml({
      name: 'recorded journey',
      steps: '  - click: submit\n  - expect: { state: { path: title } }\n',
    })}`
  );
  context.options.update = true;
  mockPost
    .mockResolvedValueOnce({ data: { passed: true, steps: [], state: { title: 'done' } } })
    .mockResolvedValueOnce({ data: { passed: true, steps: [], state: { title: 'done' } } });
  await test({ context });
  const written = fs.readFileSync(
    path.join(configDirectory, 'tests', 'journeys', 'a.yaml'),
    'utf8'
  );
  expect(written).toContain('# a recorded journey');
  expect(written).toContain('{ state: { path: title, equals: done, from: recorded } }');
  expect(logs.info).toContain('1 passed, 0 failed of 1 tests');
  expect(process.exitCode).toBeUndefined();
});
