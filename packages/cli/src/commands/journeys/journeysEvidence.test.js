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

import validateJourney from '../test/validateJourney.js';

// The config text set comes from a full build by the dev server's builder;
// these tests hold it fixed.
jest.unstable_mockModule('./configText/readConfigText.js', () => ({
  default: async () => ({ texts: new Set(), isConfigText: () => false }),
}));

const { default: journeysEvidence } = await import('./journeysEvidence.js');

let configDirectory;
let context;
let logged;

const NOW = Date.parse('2026-10-03T12:00:00.000Z');

function record({ session, t, kind = 'click', block, person = 'p_1', org = 'o_1' }) {
  const base = {
    v: 1,
    source: 'production',
    session,
    person,
    org,
    roles: ['member'],
    t: new Date(t).toISOString(),
    build: 'b1',
    page_id: 'tickets',
    scope: 'page',
    kind,
    target: null,
  };
  if (kind === 'pageview') base.url = '/tickets';
  if (block) {
    base.target = {
      block_id: block,
      block_type: 'Button',
      row: null,
      column: null,
      text: null,
      nth: null,
      option: false,
    };
  }
  return base;
}

function visit({ session, start, blocks, person, org }) {
  return [
    record({ session, t: start, kind: 'pageview', person, org }),
    ...blocks.map((block, index) =>
      record({ session, t: start + (index + 1) * 1000, block, person, org })
    ),
  ];
}

function writeDay(day, records) {
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

function writeJourney(name, text) {
  const directory = path.join(configDirectory, 'tests', 'journeys');
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, name), text);
  return path.join(directory, name);
}

const SAVES = `# Saves a ticket.
name: member saves a ticket
pageId: tickets

steps:
  - click: edit   # opens the form
  - click: save
`;

const CLOSE = `- name: member closes a ticket
  pageId: tickets
  evidence:
    mutation: { killed: 4, total: 5, unique: 2 }
  steps:
    - click: close
`;

beforeEach(() => {
  configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-evidence-'));
  logged = [];
  const log = (message) => logged.push(String(message));
  context = {
    directories: {
      build: path.join(configDirectory, '.lowdefy', 'server', 'build'),
      config: configDirectory,
      dev: path.join(configDirectory, '.lowdefy', 'dev'),
      journeys: path.join(configDirectory, 'tests', 'journeys'),
      test: path.join(configDirectory, '.lowdefy', 'test'),
      traces: path.join(configDirectory, '.lowdefy', 'traces'),
    },
    logger: { info: log, warn: log },
    options: { since: '2d' },
    sendTelemetry: async () => {},
  };
  jest.spyOn(Date, 'now').mockReturnValue(NOW);
  writeDay('2026-10-02', [
    ...visit({
      session: 's1',
      start: Date.parse('2026-10-02T09:00:00Z'),
      blocks: ['edit', 'save'],
    }),
    ...visit({
      session: 's2',
      start: Date.parse('2026-10-02T10:00:00Z'),
      blocks: ['edit', 'title', 'save'],
      person: 'p_2',
      org: 'o_2',
    }),
  ]);
  writeDay('2026-10-03', [
    ...visit({ session: 's3', start: Date.parse('2026-10-03T09:00:00Z'), blocks: ['open'] }),
  ]);
});

afterEach(() => {
  jest.restoreAllMocks();
  fs.rmSync(configDirectory, { recursive: true, force: true });
});

test('journeys evidence without --refresh prints what would change and writes nothing', async () => {
  const savesPath = writeJourney('saves.yaml', SAVES);
  const { results } = await journeysEvidence({ context });
  expect(fs.readFileSync(savesPath, 'utf8')).toBe(SAVES);
  expect(results[0].after.production).toEqual({
    sessions: 2,
    persons: 2,
    orgs: 2,
    share: 0.67,
    failures: 0,
    window: '2026-10-02/2026-10-03',
  });
  expect(logged).toContain(
    `${path.join(
      'tests',
      'journeys',
      'saves.yaml'
    )}#member saves a ticket: no evidence -> 2 sessions · 2 orgs`
  );
  expect(logged.some((line) => line.includes('Run with --refresh'))).toBe(true);
});

test('journeys evidence --refresh writes only the evidence node, and a second refresh changes nothing', async () => {
  const savesPath = writeJourney('saves.yaml', SAVES);
  const closePath = writeJourney('close.yaml', CLOSE);
  context.options.refresh = true;
  await journeysEvidence({ context });
  const saves = fs.readFileSync(savesPath, 'utf8');
  expect(saves.replace(/evidence:\n(?: {2}.*\n)+/, '')).toBe(SAVES);
  const journey = YAML.parse(saves);
  expect(journey.evidence.refreshed).toBe('2026-10-03');
  expect(validateJourney({ journey })).toEqual({ valid: true });

  const close = YAML.parse(fs.readFileSync(closePath, 'utf8'))[0];
  expect(close.evidence).toEqual({
    production: {
      sessions: 0,
      persons: 0,
      orgs: 0,
      share: 0,
      failures: 0,
      window: '2026-10-02/2026-10-03',
    },
    mutation: { killed: 4, total: 5, unique: 2 },
    refreshed: '2026-10-03',
  });

  const before = [fs.readFileSync(savesPath, 'utf8'), fs.readFileSync(closePath, 'utf8')];
  Date.now.mockReturnValue(NOW + 60 * 60 * 1000);
  await journeysEvidence({ context });
  expect([fs.readFileSync(savesPath, 'utf8'), fs.readFileSync(closePath, 'utf8')]).toEqual(before);
});

test('journeys evidence lists zero-backed journeys with their mutation numbers and deletes none', async () => {
  writeJourney('saves.yaml', SAVES);
  const closePath = writeJourney('close.yaml', CLOSE);
  await journeysEvidence({ context });
  expect(logged).toContain('No production backing in 2026-10-02/2026-10-03 (nothing is removed):');
  expect(logged).toContain(
    '  member closes a ticket  0 sessions · 4/5 mutants · 2 only this journey kills'
  );
  expect(fs.existsSync(closePath)).toBe(true);
});

test('journeys evidence reports a file that does not parse and leaves it alone', async () => {
  const brokenPath = writeJourney('broken.yaml', 'name: [unclosed\n');
  writeJourney('saves.yaml', SAVES);
  context.options.refresh = true;
  await journeysEvidence({ context });
  expect(fs.readFileSync(brokenPath, 'utf8')).toBe('name: [unclosed\n');
  expect(
    logged.some((line) =>
      line.startsWith(`Skipped ${path.join('tests', 'journeys', 'broken.yaml')}: Invalid YAML`)
    )
  ).toBe(true);
});

test('journeys evidence names the pull for a day missing from the window', async () => {
  writeJourney('saves.yaml', SAVES);
  context.options.since = '5d';
  await expect(journeysEvidence({ context })).rejects.toThrow(
    'lowdefy journeys pull posthog --from 2026-09-29'
  );
});

test('journeys evidence --refresh is not capped at a 30-day mining window', async () => {
  writeJourney('saves.yaml', SAVES);
  context.options.since = '90d';
  context.options.refresh = true;
  await expect(journeysEvidence({ context })).rejects.toThrow(
    'missing 88 day(s) of 2026-07-06/2026-10-03'
  );
});

test('journeys evidence refuses a source other than production', async () => {
  context.options.source = 'dev';
  await expect(journeysEvidence({ context })).rejects.toThrow('--source should be production');
});

test('journeys evidence --refresh fills mutation from the report and the schema accepts it', async () => {
  const savesPath = writeJourney('saves.yaml', SAVES);
  fs.mkdirSync(path.join(configDirectory, '.lowdefy', 'test'), { recursive: true });
  fs.writeFileSync(
    path.join(configDirectory, '.lowdefy', 'test', 'mutation.json'),
    JSON.stringify({
      killed: 3,
      total: 4,
      journeys: [
        {
          file: path.join('tests', 'journeys', 'saves.yaml'),
          name: 'member saves a ticket',
          killed: 3,
          total: 4,
          unique: 1,
        },
      ],
    })
  );
  context.options.refresh = true;
  await journeysEvidence({ context });
  const journey = YAML.parse(fs.readFileSync(savesPath, 'utf8'));
  expect(journey.evidence.mutation).toEqual({ killed: 3, total: 4, unique: 1 });
  expect(validateJourney({ journey })).toEqual({ valid: true });
});

test('journeys evidence without a mutation report adds no mutation key', async () => {
  const savesPath = writeJourney('saves.yaml', SAVES);
  context.options.refresh = true;
  await journeysEvidence({ context });
  expect(YAML.parse(fs.readFileSync(savesPath, 'utf8')).evidence).not.toHaveProperty('mutation');
});

// A dev session as the dev server records it: every interaction carries the
// event it ran, and no person or org.
function writeDevRecording({ id, start, blocks }) {
  const records = visit({ session: id, start, blocks }).map(
    ({ person, org, roles, ...rest }, index) => ({
      ...rest,
      source: 'dev',
      ...(index === 0
        ? {}
        : { event: { name: 'onClick', block_id: blocks[index - 1], success: true } }),
    })
  );
  const date = new Date(start).toISOString().slice(0, 10);
  const directory = path.join(configDirectory, '.lowdefy', 'traces', 'dev', date);
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(
    path.join(directory, `${id}.jsonl`),
    records.map((entry) => JSON.stringify(entry)).join('\n')
  );
}

test('journeys evidence --refresh counts the dev recordings of the last 7 days that back each journey', async () => {
  const savesPath = writeJourney('saves.yaml', SAVES);
  writeDevRecording({
    id: '20261003T080000Z-dev001',
    start: Date.parse('2026-10-03T08:00:00Z'),
    blocks: ['edit', 'title', 'save'],
  });
  writeDevRecording({
    id: '20261001T080000Z-dev002',
    start: Date.parse('2026-10-01T08:00:00Z'),
    blocks: ['edit', 'save'],
  });
  writeDevRecording({
    id: '20261002T080000Z-dev003',
    start: Date.parse('2026-10-02T08:00:00Z'),
    blocks: ['close'],
  });
  // Older than the 7-day window.
  writeDevRecording({
    id: '20260920T080000Z-dev004',
    start: Date.parse('2026-09-20T08:00:00Z'),
    blocks: ['edit', 'save'],
  });
  context.options.refresh = true;
  await journeysEvidence({ context });
  const journey = YAML.parse(fs.readFileSync(savesPath, 'utf8'));
  expect(journey.evidence.dev).toEqual({ recordings: 2 });
  expect(validateJourney({ journey })).toEqual({ valid: true });
  expect(logged.some((line) => line.includes('2 dev recordings'))).toBe(true);
});

test('journeys evidence keeps the committed dev.recordings when this machine has no dev recordings', async () => {
  const savesPath = writeJourney(
    'saves.yaml',
    SAVES.replace('steps:', 'evidence:\n  dev: { recordings: 5 }\n  refreshed: 2026-09-01\nsteps:')
  );
  context.options.refresh = true;
  await journeysEvidence({ context });
  const journey = YAML.parse(fs.readFileSync(savesPath, 'utf8'));
  expect(journey.evidence.dev).toEqual({ recordings: 5 });
});
