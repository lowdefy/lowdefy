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

beforeEach(() => {
  process.exitCode = undefined;
  configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-test-command-'));
  logs = { info: [], warn: [], error: [] };
  context = {
    directories: { config: configDirectory },
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
  const bootError = new Error('Development server did not answer GET /api/ping within 120000ms.');
  bootError.serverOutput = ['line one', 'line two'];
  mockStartDevServer.mockRejectedValue(bootError);
  await expect(test({ context })).rejects.toThrow(
    'Development server did not answer GET /api/ping within 120000ms.'
  );
  expect(logs.error).toEqual(['line one', 'line two']);
  expect(mockPost).not.toHaveBeenCalled();
});
