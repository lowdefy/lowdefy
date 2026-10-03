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

const url = 'http://localhost:3229';
let configDirectory;
let context;
let logs;
let journeyRuns;
let buildIds;
const originalExitCode = process.exitCode;

function exercisedFor(pageId) {
  return {
    pages: [pageId],
    appEvents: true,
    requests: [],
    endpoints: [],
    events: [{ scope: 'page', pageId, blockId: 'save', eventName: 'onClick', actionIds: ['a'] }],
    rendered: { [pageId]: ['save', 'alert'] },
  };
}

function mutant({ id, operator, anchor }) {
  return {
    id,
    operator,
    artifact: anchor.pageId === 'app' ? 'events.json' : `pages/${anchor.pageId}.json`,
    key: `key-${id}`,
    arg: null,
    anchor,
    source: `pages/${anchor.pageId}.yaml:1`,
    config: `root.${id}`,
    describe: `${operator} ${id}`,
    copies: [],
  };
}

const listing = {
  buildId: 'build-1',
  artifacts: {},
  mutants: [
    mutant({
      id: 'kill',
      operator: 'drop-action',
      anchor: {
        type: 'action',
        pageId: 'orders',
        blockId: 'save',
        eventName: 'onClick',
        actionId: 'a',
      },
    }),
    mutant({
      id: 'alert',
      operator: 'drop-block',
      anchor: { type: 'block', pageId: 'orders', blockId: 'alert', parentBlockId: 'orders' },
    }),
    mutant({
      id: 'app',
      operator: 'drop-action',
      anchor: { type: 'action', pageId: 'app', blockId: null, eventName: 'onInit', actionId: 'b' },
    }),
    mutant({
      id: 'refund',
      operator: 'drop-block',
      anchor: { type: 'block', pageId: 'refunds', blockId: 'alert', parentBlockId: 'refunds' },
    }),
    mutant({
      id: 'tab',
      operator: 'drop-block',
      anchor: { type: 'block', pageId: 'orders', blockId: 'tab', parentBlockId: 'orders' },
    }),
  ],
};

function writeJourney(fileName, journey) {
  const filePath = path.join(configDirectory, 'tests', 'journeys', fileName);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(journey));
}

function readReport() {
  return JSON.parse(
    fs.readFileSync(path.join(configDirectory, '.lowdefy', 'test', 'mutation.json'), 'utf8')
  );
}

beforeEach(() => {
  process.exitCode = undefined;
  configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-harden-'));
  logs = { info: [], warn: [], error: [] };
  journeyRuns = [];
  buildIds = [];
  context = {
    directories: {
      config: configDirectory,
      journeys: path.join(configDirectory, 'tests', 'journeys'),
    },
    options: { url },
    logger: {
      info: (line) => logs.info.push(line),
      warn: (line) => logs.warn.push(line),
      error: (line) => logs.error.push(line),
      debug: jest.fn(),
    },
    sendTelemetry: jest.fn(),
  };
  writeJourney('orders.yaml', {
    name: 'orders',
    pageId: 'orders',
    steps: [{ click: 'save' }, { expect: { visible: 'alert' } }],
  });
  writeJourney('refunds.yaml', {
    name: 'refunds',
    pageId: 'refunds',
    steps: [{ click: 'save' }, { expect: { visible: 'alert' } }],
  });
  mockGet.mockImplementation(async () => ({ data: { buildId: buildIds.shift() ?? 'build-1' } }));
  mockPost.mockImplementation(async (target, body) => {
    if (target === `${url}/lowdefy-docs/mutants`) {
      return { data: listing };
    }
    journeyRuns.push({ pageId: body.pageId, mutant: body.mutant?.key ?? null });
    if (body.mutant?.key === 'key-kill') {
      return {
        data: {
          passed: false,
          failure: { index: 1, message: 'Expected block "alert" to be visible.' },
          exercised: exercisedFor(body.pageId),
          mutant: { id: 'run', applied: 1, misses: [] },
        },
      };
    }
    const mutantResult = body.mutant ? { mutant: { id: 'run', applied: 1, misses: [] } } : {};
    return { data: { passed: true, exercised: exercisedFor(body.pageId), ...mutantResult } };
  });
});

afterEach(() => {
  process.exitCode = originalExitCode;
  fs.rmSync(configDirectory, { recursive: true, force: true });
});

async function harden(options = {}) {
  const { default: journeysHarden } = await import('./journeysHarden.js');
  context.options = { url, ...options };
  await journeysHarden({ context });
}

test('journeysHarden runs each mutant on the journeys on its path and writes the report', async () => {
  const before = fs.readFileSync(
    path.join(configDirectory, 'tests', 'journeys', 'orders.yaml'),
    'utf8'
  );
  await harden({ seed: '3' });
  expect(process.exitCode).toBeUndefined();
  const mutantRuns = journeyRuns.filter((run) => run.mutant !== null);
  // The app-event mutant runs on both journeys; the rest on the page they sit on.
  expect(
    mutantRuns
      .filter((run) => run.mutant === 'key-app')
      .map((run) => run.pageId)
      .sort()
  ).toEqual(['orders', 'refunds']);
  expect(mutantRuns).toHaveLength(5);
  const report = readReport();
  expect(report.sampled).toEqual({ max: 200, of: 4, seed: 3 });
  expect(report.killed).toBe(1);
  expect(report.total).toBe(4);
  expect(report.mutants.map(({ id, status }) => [id, status])).toEqual(
    expect.arrayContaining([
      ['kill', 'killed'],
      ['alert', 'survived'],
      ['app', 'survived'],
      ['refund', 'survived'],
    ])
  );
  expect(report.journeys).toEqual([
    {
      file: path.join('tests', 'journeys', 'orders.yaml'),
      name: 'orders',
      killed: 1,
      total: 3,
      unique: 1,
    },
    {
      file: path.join('tests', 'journeys', 'refunds.yaml'),
      name: 'refunds',
      killed: 0,
      total: 2,
      unique: 0,
    },
  ]);
  expect(logs.info.some((line) => line.startsWith('SURVIVED  drop-block'))).toBe(true);
  expect(logs.info.at(-1)).toMatch(
    /^4 mutants run · 1 killed · 3 survived · 0 unapplied · 0 errors · sampled 4 of 4 \(seed 3\) · 1 not exercised · 0 rebuilds · \d+s$/
  );
  expect(
    fs.readFileSync(path.join(configDirectory, 'tests', 'journeys', 'orders.yaml'), 'utf8')
  ).toEqual(before);
  expect(fs.readdirSync(path.join(configDirectory, 'tests', 'journeys')).sort()).toEqual([
    'orders.yaml',
    'refunds.yaml',
  ]);
});

test('journeysHarden --list prints the sample and its estimate and runs no mutant', async () => {
  await harden({ list: true });
  expect(journeyRuns.filter((run) => run.mutant !== null)).toEqual([]);
  expect(fs.existsSync(path.join(configDirectory, '.lowdefy', 'test', 'mutation.json'))).toBe(
    false
  );
  expect(logs.info).toContain('Mutants by operator:');
  expect(logs.info.at(-1)).toMatch(
    /^4 mutants · sampled 4 of 4 \(seed 0\) · 1 not exercised · 1.3 journeys per mutant · 5 runs · about \d+s on 4 workers$/
  );
});

test('journeysHarden --page keeps that page and drops app-event mutants; --operators keeps the operators named', async () => {
  await harden({ page: ['refunds'], list: true });
  expect(logs.info).toContain('      1  page refunds');
  logs.info = [];
  await harden({ operators: 'drop-action', list: true });
  expect(logs.info).toContain('      2  drop-action');
  expect(logs.info.some((line) => line.includes('drop-block'))).toBe(false);
});

test('journeysHarden --max samples and --mutant runs one mutant without replacing the report', async () => {
  await harden({ max: '2' });
  expect(readReport().mutants).toHaveLength(2);
  const report = readReport();
  journeyRuns = [];
  await harden({ mutant: 'app' });
  expect(journeyRuns.filter((run) => run.mutant !== null)).toEqual([
    { pageId: 'orders', mutant: 'key-app' },
    { pageId: 'refunds', mutant: 'key-app' },
  ]);
  expect(readReport()).toEqual(report);
});

test('journeysHarden refuses an unknown --mutant id and bad numeric options', async () => {
  await harden({ mutant: 'nope' });
  expect(process.exitCode).toBe(1);
  expect(logs.error).toContain(
    'Mutant "nope" is not on any selected journey\'s path in the current build.'
  );
  process.exitCode = undefined;
  await harden({ workers: '0' });
  expect(process.exitCode).toBe(1);
  expect(logs.error).toContain('--workers must be an integer from 1 to 16. Received "0".');
});

test('journeysHarden leaves out a journey whose baseline fails, and says to replay it', async () => {
  mockPost.mockImplementationOnce(async () => ({
    data: {
      passed: false,
      failure: { index: 0, message: 'boom' },
      exercised: exercisedFor('orders'),
    },
  }));
  await harden({ list: true });
  expect(logs.warn[0]).toEqual(
    `Left out "orders": its baseline run failed (boom). Replay it first: lowdefy test --repeat 3 ${path.join(
      'tests',
      'journeys',
      'orders.yaml'
    )}`
  );
});

test('journeysHarden says the dev server needs a newer Lowdefy when it has no mutants route', async () => {
  mockPost.mockImplementation(async (target, body) => {
    if (target === `${url}/lowdefy-docs/mutants`) {
      const error = new Error('Not found');
      error.response = { status: 404, data: {} };
      throw error;
    }
    return { data: { passed: true, exercised: exercisedFor(body.pageId) } };
  });
  await expect(harden()).rejects.toThrow(
    'The dev server has no mutants route (POST /lowdefy-docs/mutants): it needs a newer Lowdefy.'
  );
});
