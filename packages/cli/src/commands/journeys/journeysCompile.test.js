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

const mockGet = jest.fn();
jest.unstable_mockModule('axios', () => ({ default: { get: mockGet } }));

const { validateJourneySteps } = await import('@lowdefy/node-utils');
const { default: journeysCompile } = await import('./journeysCompile.js');

let configDirectory;
let context;
let logged;

const DAY = 24 * 60 * 60 * 1000;

function record({ session, t, kind = 'click', block, source = 'dev', build = 'b1', ...rest }) {
  const base = {
    v: 1,
    source,
    session,
    person: null,
    org: null,
    roles: null,
    t: new Date(t).toISOString(),
    build,
    page_id: 'orders',
    scope: 'page',
    kind,
    target: null,
  };
  if (kind === 'pageview') base.url = '/orders';
  if (block !== undefined) {
    base.target = {
      block_id: block,
      block_type: rest.blockType ?? 'Button',
      row: null,
      column: null,
      text: null,
      nth: null,
      option: false,
    };
  }
  if (source !== 'production') base.event = null;
  const { blockType, ...others } = rest;
  return { ...base, ...others };
}

// A session on the orders page: open it, type a search, click submit.
function session({ id, start, source = 'dev', build = 'b1', value = 'shoes' }) {
  const typed = source === 'production' ? {} : { value };
  return [
    record({ session: id, t: start, kind: 'pageview', source, build }),
    record({
      session: id,
      t: start + 1000,
      kind: 'change',
      block: 'search',
      blockType: 'TextInput',
      source,
      build,
      ...typed,
    }),
    record({ session: id, t: start + 2000, block: 'submit', source, build }),
  ];
}

function writeTrace(name, records) {
  fs.writeFileSync(
    path.join(configDirectory, name),
    records.map((entry) => JSON.stringify(entry)).join('\n')
  );
  return path.join(configDirectory, name);
}

function writeBlockMetas() {
  const plugins = path.join(configDirectory, '.lowdefy', 'dev', 'build', 'plugins');
  fs.mkdirSync(plugins, { recursive: true });
  fs.writeFileSync(
    path.join(plugins, 'blockMetas.json'),
    JSON.stringify({
      Button: { category: 'button' },
      TextInput: { category: 'input', valueType: 'string' },
      DateSelector: { category: 'input', valueType: 'date' },
    })
  );
}

function candidates(source = 'dev', out = path.join('tests', 'journeys', '_candidates')) {
  const directory = path.join(configDirectory, out, source);
  return fs.existsSync(directory) ? fs.readdirSync(directory).sort() : [];
}

beforeEach(() => {
  configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-journeys-'));
  logged = [];
  context = {
    directories: {
      build: path.join(configDirectory, '.lowdefy', 'server', 'build'),
      config: configDirectory,
      dev: path.join(configDirectory, '.lowdefy', 'dev'),
      test: path.join(configDirectory, '.lowdefy', 'test'),
      traces: path.join(configDirectory, '.lowdefy', 'traces'),
    },
    logger: {
      info: (message) => logged.push(message),
      warn: (message) => logged.push(message),
    },
    options: {},
    sendTelemetry: async () => {},
  };
  mockGet.mockReset();
});

afterEach(() => {
  fs.rmSync(configDirectory, { recursive: true, force: true });
});

const now = Date.now();

test('journeys compile reads the trace files given and writes candidates that validate', async () => {
  writeBlockMetas();
  const file = writeTrace('trace.jsonl', [
    ...session({ id: 's-1', start: now - 3 * 60 * 60 * 1000 }),
    ...session({ id: 's-2', start: now - 2 * 60 * 60 * 1000, value: 'hats' }),
  ]);
  const result = await journeysCompile({ context, params: [[file]] });
  expect(result.candidates).toHaveLength(1);
  const [fileName] = candidates();
  expect(fileName).toMatch(/^orders-[0-9a-f]{8}\.yaml$/);
  const journey = YAML.parse(
    fs.readFileSync(
      path.join(configDirectory, 'tests', 'journeys', '_candidates', 'dev', fileName),
      'utf8'
    )
  );
  expect(journey.steps[0]).toEqual({
    fill: { blockId: 'search', value: 'hats', from: 'recorded' },
  });
  expect(validateJourneySteps({ steps: journey.steps })).toEqual({});
  expect(logged).toContain(
    `Compiled 2 sessions (2 segments) into 1 candidates in ${path.join(
      configDirectory,
      'tests',
      'journeys',
      '_candidates',
      'dev'
    )}.`
  );
  expect(logged).toContain(
    'Dropped 0 unreadable lines, 0 invalid records and 0 records of another trace version.'
  );
  expect(
    logged.some((line) =>
      /^created orders-[0-9a-f]{8}\.yaml: 2 sessions, 0 failures, 2 steps\.$/.test(line)
    )
  ).toBe(true);
});

test('journeys compile filters records within the given files by --source', async () => {
  writeBlockMetas();
  const file = writeTrace('trace.jsonl', [
    ...session({ id: 's-1', start: now - 60000 }),
    ...session({ id: 's-2', start: now - 50000, source: 'explorer' }),
  ]);
  context.options.source = 'explorer';
  const { segments } = await journeysCompile({ context, params: [[file]] });
  expect(segments.map((segment) => segment.session)).toEqual(['s-2']);
  expect(candidates('explorer')).toHaveLength(1);
});

test('journeys compile refuses files holding several sources without --source', async () => {
  const file = writeTrace('trace.jsonl', [
    ...session({ id: 's-1', start: now }),
    ...session({ id: 's-2', start: now, source: 'explorer' }),
  ]);
  await expect(journeysCompile({ context, params: [[file]] })).rejects.toThrow(
    'The trace files hold records from several sources (dev, explorer); choose one with --source.'
  );
});

test('journeys compile filters records by --since', async () => {
  writeBlockMetas();
  const file = writeTrace('trace.jsonl', [
    ...session({ id: 'old', start: now - 3 * DAY }),
    ...session({ id: 'new', start: now - 60 * 60 * 1000 }),
  ]);
  context.options.since = '2h';
  const { segments } = await journeysCompile({ context, params: [[file]] });
  expect(segments.map((segment) => segment.session)).toEqual(['new']);
});

test('journeys compile defaults production to the last 30 days', async () => {
  const file = writeTrace('trace.jsonl', [
    ...session({ id: 'old', start: now - 40 * DAY, source: 'production' }),
    ...session({ id: 'new', start: now - DAY, source: 'production' }),
  ]);
  const { segments } = await journeysCompile({ context, params: [[file]] });
  expect(segments.map((segment) => segment.session)).toEqual(['new']);
  expect(candidates('production')).toHaveLength(1);
});

test('journeys compile gives production an explicit window with --from and --to', async () => {
  const file = writeTrace('trace.jsonl', [
    ...session({ id: 'a', start: Date.parse('2026-08-01T10:00:00Z'), source: 'production' }),
    ...session({ id: 'b', start: Date.parse('2026-08-03T10:00:00Z'), source: 'production' }),
    ...session({ id: 'c', start: Date.parse('2026-08-05T10:00:00Z'), source: 'production' }),
  ]);
  context.options.from = '2026-08-02';
  context.options.to = '2026-08-03';
  const { segments } = await journeysCompile({ context, params: [[file]] });
  expect(segments.map((segment) => segment.session)).toEqual(['b']);
});

test('journeys compile refuses --from and --to for a source other than production', async () => {
  const file = writeTrace('trace.jsonl', session({ id: 's-1', start: now }));
  context.options.from = '2026-08-02';
  await expect(journeysCompile({ context, params: [[file]] })).rejects.toThrow(
    '--from and --to give a production window; for dev traces use --since.'
  );
});

test('journeys compile keeps only segments wholly on the --build given', async () => {
  const file = writeTrace('trace.jsonl', [
    ...session({ id: 's-1', start: now - 60000, build: 'b1' }),
    ...session({ id: 's-2', start: now - 50000, build: 'b2' }),
  ]);
  context.options.build = 'b2';
  const { segments } = await journeysCompile({ context, params: [[file]] });
  expect(segments.map((segment) => segment.session)).toEqual(['s-2']);
});

test('journeys compile reads --build current from the running dev server', async () => {
  fs.mkdirSync(path.join(configDirectory, '.lowdefy'), { recursive: true });
  fs.writeFileSync(
    path.join(configDirectory, '.lowdefy', 'instance.json'),
    JSON.stringify({
      configDirectory: fs.realpathSync.native(configDirectory),
      pid: process.pid,
      state: 'ready',
      url: 'http://localhost:3999',
    })
  );
  mockGet.mockResolvedValue({ data: { buildId: 'b1' } });
  const file = writeTrace('trace.jsonl', [
    ...session({ id: 's-1', start: now - 60000, build: 'b1' }),
    ...session({ id: 's-2', start: now - 50000, build: 'b2' }),
  ]);
  context.options.build = 'current';
  const { segments } = await journeysCompile({ context, params: [[file]] });
  expect(mockGet).toHaveBeenCalledWith('http://localhost:3999/lowdefy-docs/build-status', {
    timeout: 2000,
  });
  expect(segments.map((segment) => segment.session)).toEqual(['s-1']);
});

test('journeys compile takes --build current from the newest build in the records with no dev server', async () => {
  const file = writeTrace('trace.jsonl', [
    ...session({ id: 's-1', start: now - 60000, build: '2026-10-01T08:00:00.000Z' }),
    ...session({ id: 's-2', start: now - 50000, build: '2026-10-02T08:00:00.000Z' }),
  ]);
  context.options.build = 'current';
  const { segments } = await journeysCompile({ context, params: [[file]] });
  expect(segments.map((segment) => segment.session)).toEqual(['s-2']);
  expect(logged).toContain(
    'No dev server for this app answered, so --build current is the newest build in the records, 2026-10-02T08:00:00.000Z.'
  );
  expect(mockGet).not.toHaveBeenCalled();
});

test('journeys compile takes --build current from the records inside the --since window', async () => {
  const file = writeTrace('trace.jsonl', [
    ...session({ id: 's-1', start: now - 60000, build: '2026-10-01T08:00:00.000Z' }),
    ...session({ id: 's-2', start: now - 2 * 3600000, build: '2026-10-02T08:00:00.000Z' }),
  ]);
  context.options.build = 'current';
  context.options.since = '1h';
  const { segments } = await journeysCompile({ context, params: [[file]] });
  expect(segments.map((segment) => segment.session)).toEqual(['s-1']);
});

test('journeys compile keeps only segments visiting the --page given', async () => {
  const file = writeTrace('trace.jsonl', [
    ...session({ id: 's-1', start: now - 60000 }),
    ...session({ id: 's-2', start: now - 50000 }).map((entry) => ({
      ...entry,
      page_id: 'tickets',
    })),
  ]);
  context.options.page = 'tickets';
  const { segments } = await journeysCompile({ context, params: [[file]] });
  expect(segments.map((segment) => segment.session)).toEqual(['s-2']);
});

test('journeys compile refuses --source journey', async () => {
  context.options.source = 'journey';
  await expect(journeysCompile({ context, params: [[]] })).rejects.toThrow(
    'Journey runs are measured coverage, not candidates: "--source journey" cannot be compiled to candidates.'
  );
});

test('journeys compile refuses trace files whose records are all journey runs', async () => {
  const file = writeTrace('trace.jsonl', session({ id: 's-1', start: now, source: 'journey' }));
  await expect(journeysCompile({ context, params: [[file]] })).rejects.toThrow(
    '"--source journey" cannot be compiled'
  );
});

function writeRecording({ source, id, records }) {
  const date = `${id.slice(0, 4)}-${id.slice(4, 6)}-${id.slice(6, 8)}`;
  const directory = path.join(configDirectory, '.lowdefy', 'traces', source, date);
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(
    path.join(directory, `${id}.jsonl`),
    records.map((entry) => JSON.stringify(entry)).join('\n')
  );
}

function traceId(time, suffix) {
  const iso = new Date(time).toISOString();
  return `${iso.slice(0, 10).replace(/-/g, '')}T${iso.slice(11, 19).replace(/:/g, '')}Z-${suffix}`;
}

test('journeys compile --source dev reads the dev recordings and writes dev candidates', async () => {
  writeBlockMetas();
  const start = now - 60 * 60 * 1000;
  writeRecording({
    source: 'dev',
    id: traceId(start, 'aaaaaa'),
    records: session({ id: traceId(start, 'aaaaaa'), start }),
  });
  context.options.source = 'dev';
  const { candidates: compiled } = await journeysCompile({ context, params: [[]] });
  expect(compiled).toHaveLength(1);
  expect(candidates('dev')).toEqual([compiled[0].fileName]);
});

test('journeys compile --source explorer reads the explorer recordings', async () => {
  const start = now - 60 * 60 * 1000;
  writeRecording({
    source: 'explorer',
    id: traceId(start, 'eeeeee'),
    records: session({ id: 'walk-1', start, source: 'explorer' }),
  });
  context.options.source = 'explorer';
  await journeysCompile({ context, params: [[]] });
  expect(candidates('explorer')).toHaveLength(1);
});

test('journeys compile --source dev --since skips recordings older than the window', async () => {
  const old = now - 10 * 24 * 60 * 60 * 1000;
  writeRecording({
    source: 'dev',
    id: traceId(old, 'oldold'),
    records: session({ id: 'old-session', start: old }),
  });
  context.options.source = 'dev';
  context.options.since = '2d';
  const { segments } = await journeysCompile({ context, params: [[]] });
  expect(segments).toEqual([]);
  expect(candidates('dev')).toEqual([]);
});

test('journeys compile reads the files given even when recordings exist', async () => {
  const start = now - 60 * 60 * 1000;
  writeRecording({
    source: 'dev',
    id: traceId(start, 'aaaaaa'),
    records: session({ id: 'recorded', start, value: 'boots' }),
  });
  const file = writeTrace('trace.jsonl', session({ id: 'from-file', start }));
  context.options.source = 'dev';
  const { segments } = await journeysCompile({ context, params: [[file]] });
  expect(segments.map((segment) => segment.session)).toEqual(['from-file']);
});

test('journeys compile without trace files needs a source', async () => {
  await expect(journeysCompile({ context, params: [[]] })).rejects.toThrow(
    'lowdefy journeys compile needs trace files, or --source to choose recorded traces.'
  );
});

function writeProductionDay(day, records) {
  const directory = path.join(configDirectory, '.lowdefy', 'traces', 'production');
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(
    path.join(directory, `${day}.jsonl`),
    records.map((entry) => JSON.stringify(entry)).join('\n')
  );
  fs.writeFileSync(
    path.join(directory, `${day}.manifest.json`),
    JSON.stringify({ day, text_rule: 'token' })
  );
}

function utcDay(time) {
  return new Date(time).toISOString().slice(0, 10);
}

test('journeys compile --source production with no files compiles the pulled cache', async () => {
  const today = Date.parse(`${utcDay(now)}T10:00:00.000Z`);
  writeProductionDay(
    utcDay(today - 2 * DAY),
    session({ id: 'a', start: today - 2 * DAY, source: 'production' })
  );
  writeProductionDay(
    utcDay(today - DAY),
    session({ id: 'b', start: today - DAY, source: 'production' })
  );
  writeProductionDay(utcDay(today), []);
  context.options.source = 'production';
  context.options.since = '3d';
  const { segments } = await journeysCompile({ context, params: [[]] });
  expect(segments).toHaveLength(2);
  expect(candidates('production')).toHaveLength(1);
});

test('journeys compile --source production removes old-rule days, production candidates and coverage.json', async () => {
  const today = Date.parse(`${utcDay(now)}T10:00:00.000Z`);
  writeProductionDay(utcDay(today), session({ id: 'a', start: today, source: 'production' }));
  const directory = path.join(configDirectory, '.lowdefy', 'traces', 'production');
  const oldDay = utcDay(today - 40 * DAY);
  fs.writeFileSync(path.join(directory, `${oldDay}.jsonl`), '');
  fs.writeFileSync(
    path.join(directory, `${oldDay}.manifest.json`),
    JSON.stringify({ day: oldDay })
  );
  fs.writeFileSync(path.join(directory, 'salt'), Buffer.alloc(32, 1));
  const productionCandidates = path.join(
    configDirectory,
    'tests',
    'journeys',
    '_candidates',
    'production'
  );
  fs.mkdirSync(productionCandidates, { recursive: true });
  fs.writeFileSync(path.join(productionCandidates, 'stale.yaml'), 'name: stale\n');
  fs.writeFileSync(
    path.join(configDirectory, 'tests', 'journeys', 'orders.yaml'),
    'name: orders\n'
  );
  fs.mkdirSync(path.join(configDirectory, '.lowdefy', 'test'), { recursive: true });
  fs.writeFileSync(path.join(configDirectory, '.lowdefy', 'test', 'coverage.json'), '{}');
  context.options.source = 'production';
  context.options.since = '1d';
  await journeysCompile({ context, params: [[]] });
  expect(fs.existsSync(path.join(directory, `${oldDay}.manifest.json`))).toBe(false);
  expect(fs.existsSync(path.join(directory, `${utcDay(today)}.manifest.json`))).toBe(true);
  expect(fs.existsSync(path.join(directory, 'salt'))).toBe(true);
  expect(candidates('production')).not.toContain('stale.yaml');
  expect(fs.existsSync(path.join(configDirectory, '.lowdefy', 'test', 'coverage.json'))).toBe(
    false
  );
  expect(
    fs.readFileSync(path.join(configDirectory, 'tests', 'journeys', 'orders.yaml'), 'utf8')
  ).toEqual('name: orders\n');
  logged = [];
  await journeysCompile({ context, params: [[]] });
  expect(logged.filter((line) => line.startsWith('Removed'))).toEqual([]);
});

test('journeys compile --source production refuses a window over 30 days', async () => {
  context.options.source = 'production';
  context.options.since = '45d';
  await expect(journeysCompile({ context, params: [[]] })).rejects.toThrow(
    'is 45 days long; a mining window is at most 30 days'
  );
});

test('journeys compile --source production names the pull for a day missing from the cache', async () => {
  context.options.source = 'production';
  context.options.since = '2d';
  await expect(journeysCompile({ context, params: [[]] })).rejects.toThrow(
    'lowdefy journeys pull posthog --from'
  );
});

test('journeys compile writes to the --out directory with the source appended', async () => {
  const file = writeTrace('trace.jsonl', session({ id: 's-1', start: now }));
  context.options.out = 'out/candidates';
  await journeysCompile({ context, params: [[file]] });
  expect(candidates('dev', 'out/candidates')).toHaveLength(1);
});

test('journeys compile rerun updates the existing candidate origin and reports updated', async () => {
  const file = writeTrace('trace.jsonl', session({ id: 's-1', start: now }));
  await journeysCompile({ context, params: [[file]] });
  const [fileName] = candidates();
  const filePath = path.join(configDirectory, 'tests', 'journeys', '_candidates', 'dev', fileName);
  fs.writeFileSync(
    filePath,
    fs.readFileSync(filePath, 'utf8').replace(/name: orders recorded \w+/, 'name: searches orders')
  );
  logged = [];
  const { candidates: second } = await journeysCompile({ context, params: [[file]] });
  expect(second.map((candidate) => candidate.status)).toEqual(['updated']);
  expect(YAML.parse(fs.readFileSync(filePath, 'utf8')).name).toBe('searches orders');
  expect(logged.some((line) => line.startsWith(`updated ${fileName}:`))).toBe(true);
});

test('journeys compile warns once and still compiles when no block metas are found', async () => {
  const file = writeTrace('trace.jsonl', [
    ...session({ id: 's-1', start: now }),
    record({
      session: 's-1',
      t: now + 3000,
      kind: 'change',
      block: 'due',
      blockType: 'DateSelector',
      value: 'x',
    }),
  ]);
  const { candidates: compiled } = await journeysCompile({ context, params: [[file]] });
  const warnings = logged.filter((line) => line.startsWith('No build found'));
  expect(warnings).toHaveLength(1);
  // Without metas the date input reads as a typed input.
  expect(compiled[0].journey.steps).toContainEqual({
    fill: { blockId: 'due', value: 'x', from: 'recorded' },
  });
});

test('journeys compile throws when a trace file does not exist', async () => {
  await expect(journeysCompile({ context, params: [['missing.jsonl']] })).rejects.toThrow(
    `Trace file not found at ${path.resolve('missing.jsonl')}.`
  );
});
