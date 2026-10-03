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

const mockStartDevServer = jest.fn();
jest.unstable_mockModule('../../test/startDevServer.js', () => ({
  default: mockStartDevServer,
}));

const url = 'http://localhost:3230';
let configDirectory;
let context;
let logs;
const originalExitCode = process.exitCode;

const journey = {
  name: 'saves a ticket',
  pageId: 'tickets',
  user: 'none',
  steps: [
    { fill: { blockId: 'title', value: 'Printer jam' } },
    { click: 'save' },
    { wait: { request: 'save' } },
    { expect: { visible: 'saved' } },
  ],
};

const exercised = {
  pages: ['tickets'],
  appEvents: true,
  requests: [{ pageId: 'tickets', requestId: 'save', calls: 1, write: true }],
  endpoints: [],
  events: [],
  rendered: {},
};

const pageConfig = {
  blockId: 'tickets',
  type: 'Box',
  slots: { content: { blocks: [{ blockId: 'title', type: 'TextInput', required: true }] } },
};

function journeysPath(...parts) {
  return path.join(configDirectory, 'tests', 'journeys', ...parts);
}

function listVariants() {
  const directory = journeysPath('_candidates', 'variants');
  return fs.existsSync(directory) ? fs.readdirSync(directory).sort() : [];
}

beforeEach(() => {
  process.exitCode = undefined;
  configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-variants-command-'));
  fs.mkdirSync(journeysPath(), { recursive: true });
  fs.writeFileSync(journeysPath('tickets.yaml'), JSON.stringify(journey));
  logs = { info: [], warn: [], error: [] };
  context = {
    directories: { config: configDirectory, journeys: journeysPath() },
    options: {},
    logger: {
      info: (line) => logs.info.push(line),
      warn: (line) => logs.warn.push(line),
      error: (line) => logs.error.push(line),
      debug: jest.fn(),
    },
    sendTelemetry: jest.fn(),
  };
  mockGet.mockImplementation(async (target) => {
    if (target === `${url}/lowdefy-docs/page-config/tickets`) return { data: pageConfig };
    if (target === `${url}/api/root`) return { data: { i18n: {} } };
    return { data: { buildId: 'build-1' } };
  });
  mockPost.mockResolvedValue({ data: { passed: true, steps: [], exercised } });
});

afterEach(() => {
  process.exitCode = originalExitCode;
  fs.rmSync(configDirectory, { recursive: true, force: true });
});

async function variants(options) {
  const { default: journeysVariants } = await import('./journeysVariants.js');
  context.options = { url, file: journeysPath('tickets.yaml'), ...options };
  await journeysVariants({ context });
}

test('journeysVariants --no-run measures the journey once, writes the variants and replays none', async () => {
  await variants({ run: false });
  expect(process.exitCode).toBeUndefined();
  expect(mockPost).toHaveBeenCalledTimes(1);
  expect(listVariants()).toEqual([
    'tickets-double-submit.yaml',
    'tickets-interrupt.yaml',
    'tickets-negative.yaml',
  ]);
  ['role', 'tenant', 'empty', 'volume'].forEach((kind) =>
    expect(logs.info).toContain(`SKIPPED  ${kind}: needs data sets`)
  );
  // The baseline is recorded, so the next run reads it instead of measuring.
  expect(fs.existsSync(path.join(configDirectory, '.lowdefy', 'test', 'exercised.json'))).toBe(
    true
  );
});

test('journeysVariants writes byte-identical files on a second run, from the recorded path', async () => {
  await variants({ run: false });
  const first = listVariants().map((name) =>
    fs.readFileSync(journeysPath('_candidates', 'variants', name), 'utf8')
  );
  mockPost.mockClear();
  await variants({ run: false });
  expect(mockPost).not.toHaveBeenCalled();
  expect(
    listVariants().map((name) =>
      fs.readFileSync(journeysPath('_candidates', 'variants', name), 'utf8')
    )
  ).toEqual(first);
});

test('journeysVariants replays each variant three times and classifies it', async () => {
  await variants({ kinds: 'double-submit' });
  // One baseline, then three replays of the one variant.
  expect(mockPost).toHaveBeenCalledTimes(4);
  expect(mockPost.mock.calls[1][1].steps[1]).toEqual({ click: { blockId: 'save', count: 2 } });
  expect(logs.info.some((line) => line.startsWith('PASS'))).toBe(true);
});

test('journeysVariants does not replay a variant with a placeholder to fill', async () => {
  const withRule = {
    ...pageConfig,
    slots: {
      content: {
        blocks: [
          { blockId: 'title', type: 'TextInput', validate: [{ pass: true, message: 'Too short' }] },
        ],
      },
    },
  };
  mockGet.mockImplementation(async (target) => {
    if (target.endsWith('/page-config/tickets')) return { data: withRule };
    if (target.endsWith('/api/root')) return { data: { i18n: {} } };
    return { data: { buildId: 'build-1' } };
  });
  await variants({ kinds: 'negative' });
  expect(mockPost).toHaveBeenCalledTimes(1);
  const relative = path.join(
    'tests',
    'journeys',
    '_candidates',
    'variants',
    'tickets-negative.yaml'
  );
  const prefix = `NOT RUN  ${relative}: `;
  expect(logs.warn[0].slice(0, prefix.length)).toEqual(prefix);
});

test('journeysVariants refuses unknown kinds and a file of several journeys without --name', async () => {
  await variants({ kinds: 'negative,typo' });
  expect(process.exitCode).toBe(1);
  expect(logs.error).toContain(
    '--kinds takes role, tenant, empty, volume, negative, interrupt, double-submit. Received "typo".'
  );
  process.exitCode = undefined;
  fs.writeFileSync(
    journeysPath('tickets.yaml'),
    JSON.stringify([journey, { ...journey, name: 'saves another ticket' }])
  );
  await variants({});
  expect(process.exitCode).toBe(1);
  expect(logs.error.at(-1)).toContain('pick one with --name');
  expect(mockStartDevServer).not.toHaveBeenCalled();
});
