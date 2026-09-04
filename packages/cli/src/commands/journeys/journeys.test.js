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

import fs from 'fs';
import os from 'os';
import path from 'path';
import YAML from 'yaml';
import { validateJourney } from '@lowdefy/node-utils';

import journeysCompile from './journeysCompile.js';
import journeysCoverage from './journeysCoverage.js';

let configDirectory;
let context;
let logged;

const event = (row) => ({
  page_id: 'orders',
  page_instance: 'pi-1',
  session_id: 's-1',
  ...row,
});

// Two sessions on the orders page: one that searches and submits, one that
// searches and fails on submit.
const traceRows = [
  event({
    t: '2026-09-01T10:00:00.000Z',
    block_id: 'page',
    event_name: 'onMount',
    success: true,
    actions: [{ id: 'm', outcome: 'ok', type: 'SetState' }],
  }),
  event({
    t: '2026-09-01T10:00:01.000Z',
    block_id: 'search',
    event_name: 'onChange',
    success: true,
    actions: [{ id: 'a', outcome: 'ok', type: 'Validate' }],
    state_writes: [{ path: 'search', type: 'string', value: 'shoes' }],
  }),
  event({
    t: '2026-09-01T10:00:02.000Z',
    block_id: 'submit',
    event_name: 'onClick',
    success: true,
    actions: [{ id: 'b', outcome: 'ok', type: 'Request' }],
    state_writes: [{ path: 'result.id', type: 'string', value: 'o-1' }],
  }),
  event({
    t: '2026-09-01T11:00:00.000Z',
    session_id: 's-2',
    page_instance: 'pi-2',
    block_id: 'refresh',
    event_name: 'onClick',
    success: false,
    error_name: 'RequestError',
    config_key: 'key-refresh',
    actions: [{ id: 'c', outcome: 'error', type: 'Request' }],
    rid: 'rid-2',
  }),
];

function writeBuild() {
  const build = path.join(configDirectory, '.lowdefy', 'server', 'build');
  fs.mkdirSync(path.join(build, 'pages'), { recursive: true });
  fs.mkdirSync(path.join(build, 'plugins'), { recursive: true });
  fs.writeFileSync(
    path.join(build, 'plugins', 'blockMetas.json'),
    JSON.stringify({
      Button: { category: 'button' },
      TextInput: { category: 'input', valueType: 'string' },
    })
  );
  fs.writeFileSync(
    path.join(build, 'pages', 'orders.json'),
    JSON.stringify({
      blockId: 'orders',
      type: 'Box',
      areas: {
        content: {
          blocks: [
            { blockId: 'search', type: 'TextInput' },
            { blockId: 'submit', type: 'Button' },
            { blockId: 'refresh', type: 'Button' },
          ],
        },
      },
    })
  );
}

function writeTrace(rows = traceRows) {
  const filePath = path.join(configDirectory, 'trace.jsonl');
  fs.writeFileSync(filePath, rows.map((row) => JSON.stringify(row)).join('\n'));
  return filePath;
}

function candidatesDirectory() {
  return path.join(configDirectory, 'tests', 'journeys', '_candidates');
}

beforeEach(() => {
  configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-journeys-'));
  logged = [];
  context = {
    directories: {
      build: path.join(configDirectory, '.lowdefy', 'server', 'build'),
      config: configDirectory,
      dev: path.join(configDirectory, '.lowdefy', 'dev'),
    },
    logger: {
      info: (message) => logged.push(message),
      warn: (message) => logged.push(message),
    },
    options: {},
    sendTelemetry: async () => {},
  };
});

afterEach(() => {
  fs.rmSync(configDirectory, { recursive: true, force: true });
});

test('journeys compile writes one candidate file per session sequence', async () => {
  writeBuild();
  writeTrace();
  await journeysCompile({ context, params: ['trace.jsonl'] });
  expect(fs.readdirSync(candidatesDirectory()).sort()).toEqual([
    'orders-33a69dd4.yaml',
    'orders-5e9f5687.yaml',
  ]);
});

test('journeys compile writes a candidate that validates as a journey', async () => {
  writeBuild();
  writeTrace();
  await journeysCompile({ context, params: ['trace.jsonl'] });
  fs.readdirSync(candidatesDirectory()).forEach((fileName) => {
    const journey = YAML.parse(fs.readFileSync(path.join(candidatesDirectory(), fileName), 'utf8'));
    expect(validateJourney({ journey })).toEqual({ valid: true });
  });
});

test('journeys compile reads block types from the build so a change compiles to a set step', async () => {
  writeBuild();
  writeTrace();
  const { candidates } = await journeysCompile({ context, params: ['trace.jsonl'] });
  const happy = candidates.find((candidate) => candidate.origin.failures === 0);
  expect(happy.journey.steps[0]).toEqual({ set: { blockId: 'search', value: 'shoes' } });
});

test('journeys compile warns and compiles no set step when the app has not been built', async () => {
  writeTrace();
  const { candidates } = await journeysCompile({ context, params: ['trace.jsonl'] });
  const happy = candidates.find((candidate) => candidate.origin.failures === 0);
  expect(happy.journey.steps.some((step) => 'set' in step)).toBe(false);
  expect(happy.contents).toContain(
    '# onChange on "search" is not a step: the block has no valueType'
  );
  expect(logged[0]).toContain('No build found');
});

test('journeys compile writes to the directory --out names', async () => {
  writeBuild();
  writeTrace();
  context.options.out = 'out/candidates';
  await journeysCompile({ context, params: ['trace.jsonl'] });
  expect(fs.readdirSync(path.join(configDirectory, 'out', 'candidates'))).toHaveLength(2);
});

test('journeys compile rerun over the same trace rewrites the same files unchanged', async () => {
  writeBuild();
  writeTrace();
  await journeysCompile({ context, params: ['trace.jsonl'] });
  const before = fs
    .readdirSync(candidatesDirectory())
    .map((name) => fs.readFileSync(path.join(candidatesDirectory(), name), 'utf8'));
  const { candidates } = await journeysCompile({ context, params: ['trace.jsonl'] });
  const after = fs
    .readdirSync(candidatesDirectory())
    .map((name) => fs.readFileSync(path.join(candidatesDirectory(), name), 'utf8'));
  expect(candidates.map((candidate) => candidate.status)).toEqual(['updated', 'updated']);
  expect(after).toEqual(before);
});

test('journeys compile throws when the trace file does not exist', async () => {
  await expect(journeysCompile({ context, params: ['missing.jsonl'] })).rejects.toThrow(
    'Trace file not found'
  );
});

test('journeys coverage reports the triples a committed journey does not exercise', async () => {
  writeTrace();
  const journeys = path.join(configDirectory, 'tests', 'journeys');
  fs.mkdirSync(journeys, { recursive: true });
  fs.writeFileSync(
    path.join(journeys, 'search.yaml'),
    `name: searches orders
pageId: orders
steps:
  - set: { blockId: search, value: shoes }
  - click: submit
`
  );
  const coverage = await journeysCoverage({ context, params: ['trace.jsonl'] });
  expect(coverage).toMatchObject({ covered: 2, total: 3 });
  expect(coverage.uncovered).toEqual([
    { block_id: 'refresh', event_name: 'onClick', page_id: 'orders', sessions: 1 },
  ]);
  expect(logged.join('\n')).toContain('orders refresh onClick - 1 sessions');
});

test('journeys coverage reports nothing covered when no journey is committed', async () => {
  writeTrace();
  const coverage = await journeysCoverage({ context, params: ['trace.jsonl'] });
  expect(coverage).toMatchObject({ covered: 0, share: 0, total: 3 });
});
