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

import flowLines from './evidence/flowLines.js';
import sequenceId from './evidence/sequenceId.js';
import validateJourney from '../test/validateJourney.js';
import readTraceSalt from './pull/readTraceSalt.js';

// The config text set comes from a full build by the dev server's builder;
// these tests hold it fixed.
const CONFIG_TEXTS = new Set(['Assign', 'Delete']);
jest.unstable_mockModule('./configText/readConfigText.js', () => ({
  default: async () => ({ texts: CONFIG_TEXTS, isConfigText: (text) => CONFIG_TEXTS.has(text) }),
}));

const { default: journeysEvidence } = await import('./journeysEvidence.js');
const { default: readProductionTrace } = await import('./readProductionTrace.js');
const { default: tokenText } = await import('./tokenText.js');

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

// A day as the pull writes it: under the machine's salt, which the first
// day written here creates when a test has not written its own.
function writeDay(day, records, { final = true } = {}) {
  const directory = path.join(configDirectory, '.lowdefy', 'traces', 'production');
  fs.mkdirSync(directory, { recursive: true });
  if (!fs.existsSync(path.join(directory, 'salt'))) {
    fs.writeFileSync(path.join(directory, 'salt'), Buffer.alloc(32, 2));
  }
  const { saltId } = readTraceSalt({
    directories: { traces: path.join(configDirectory, '.lowdefy', 'traces') },
  });
  fs.writeFileSync(
    path.join(directory, `${day}.jsonl`),
    records.map((entry) => JSON.stringify(entry)).join('\n')
  );
  fs.writeFileSync(
    path.join(directory, `${day}.manifest.json`),
    JSON.stringify({ day, final, salt_id: saltId, text_rule: 'token' })
  );
}

function writeJourney(name, text) {
  const directory = path.join(configDirectory, 'tests', 'journeys');
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, name), text);
  return path.join(directory, name);
}

function readJourney(filePath) {
  const parsed = YAML.parse(fs.readFileSync(filePath, 'utf8'));
  return Array.isArray(parsed) ? parsed[0] : parsed;
}

function month(name, days, sessions, persons = 0, orgs = 0, failures = 0) {
  return { month: name, days, sessions, persons, orgs, failures };
}

const SAVES = `# Saves a ticket.
name: member saves a ticket
pageId: tickets

steps:
  - click: edit   # opens the form
  - click: save
`;

const SAVES_STEPS = [{ click: 'edit' }, { click: 'save' }];
const SAVES_FLOW = {
  sequence: sequenceId({ pageId: 'tickets', steps: SAVES_STEPS }),
  pageId: 'tickets',
  flow: flowLines({ pageId: 'tickets', steps: SAVES_STEPS }),
};

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
    options: {},
    sendTelemetry: async () => {},
  };
  jest.spyOn(Date, 'now').mockReturnValue(NOW);
  // A session that starts on the last day of September and ends in October.
  writeDay('2026-09-30', [
    record({ session: 's0', t: Date.parse('2026-09-30T23:59:00Z'), kind: 'pageview' }),
    record({ session: 's0', t: Date.parse('2026-09-30T23:59:30Z'), block: 'edit' }),
  ]);
  writeDay('2026-10-01', [
    record({ session: 's0', t: Date.parse('2026-10-01T00:00:10Z'), block: 'save' }),
  ]);
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
  // Today: pulled, not final, never counted.
  writeDay(
    '2026-10-03',
    visit({ session: 's3', start: Date.parse('2026-10-03T09:00:00Z'), blocks: ['edit', 'save'] }),
    { final: false }
  );
});

afterEach(() => {
  jest.restoreAllMocks();
  fs.rmSync(configDirectory, { recursive: true, force: true });
});

test('journeys evidence without --refresh prints what would change and writes nothing', async () => {
  const savesPath = writeJourney('saves.yaml', SAVES);
  const { results, months } = await journeysEvidence({ context });
  expect(fs.readFileSync(savesPath, 'utf8')).toBe(SAVES);
  expect(months).toEqual(['2026-09', '2026-10']);
  expect(results[0].after.production).toEqual({
    ...SAVES_FLOW,
    months: [month('2026-09', 1, 1, 1, 1), month('2026-10', 2, 2, 2, 2)],
  });
  expect(logged).toContain(
    `${path.join(
      'tests',
      'journeys',
      'saves.yaml'
    )}#member saves a ticket: no evidence -> 3 sessions`
  );
  expect(logged).toContain(
    '1 of 1 journeys would change over 3 final days of 2026-09, 2026-10. Run with --refresh to write them.'
  );
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

  const close = readJourney(closePath);
  expect(close.evidence).toEqual({
    production: {
      sequence: sequenceId({ pageId: 'tickets', steps: [{ click: 'close' }] }),
      pageId: 'tickets',
      flow: ['tickets ["click","close",null,null]'],
      months: [month('2026-09', 1, 0), month('2026-10', 2, 0)],
    },
    mutation: { killed: 4, total: 5, unique: 2 },
    refreshed: '2026-10-03',
  });
  expect(validateJourney({ journey: close })).toEqual({ valid: true });

  const before = [fs.readFileSync(savesPath, 'utf8'), fs.readFileSync(closePath, 'utf8')];
  logged = [];
  Date.now.mockReturnValue(NOW + 60 * 60 * 1000);
  await journeysEvidence({ context });
  expect([fs.readFileSync(savesPath, 'utf8'), fs.readFileSync(closePath, 'utf8')]).toEqual(before);
  expect(logged).toContain(
    'Refreshed evidence for 0 of 2 journeys with no new final days in the production cache.'
  );
});

test('journeys evidence counts a day once its manifest turns final, and only the month it is in', async () => {
  const savesPath = writeJourney('saves.yaml', SAVES);
  context.options.refresh = true;
  await journeysEvidence({ context });
  writeDay(
    '2026-10-03',
    visit({ session: 's3', start: Date.parse('2026-10-03T09:00:00Z'), blocks: ['edit', 'save'] })
  );
  await journeysEvidence({ context });
  expect(readJourney(savesPath).evidence.production.months).toEqual([
    month('2026-09', 1, 1, 1, 1),
    month('2026-10', 3, 3, 2, 2),
  ]);
});

test('journeys evidence keeps a committed month the cache holds fewer final days of', async () => {
  const committed = { ...SAVES_FLOW, months: [month('2026-09', 30, 99, 9, 3)] };
  const savesPath = writeJourney(
    'saves.yaml',
    SAVES.replace(
      'steps:',
      `evidence:\n  production: ${JSON.stringify(committed)}\n  refreshed: 2026-09-01\nsteps:`
    )
  );
  context.options.refresh = true;
  await journeysEvidence({ context });
  expect(readJourney(savesPath).evidence.production.months).toEqual([
    month('2026-09', 30, 99, 9, 3),
    month('2026-10', 2, 2, 2, 2),
  ]);
});

test('journeys evidence refreshes over a cache with a missing day, which compile and coverage still refuse', async () => {
  fs.rmSync(path.join(context.directories.traces, 'production', '2026-10-01.manifest.json'));
  const savesPath = writeJourney('saves.yaml', SAVES);
  context.options.refresh = true;
  await journeysEvidence({ context });
  expect(readJourney(savesPath).evidence.production.months).toEqual([
    month('2026-09', 1, 0),
    month('2026-10', 1, 2, 2, 2),
  ]);
  await expect(
    readProductionTrace({ context, from: '2026-09-30', to: '2026-10-02', now: NOW })
  ).rejects.toThrow('missing 1 day(s)');
});

test('journeys evidence --refresh deprecates an edited flow with its months and brings it back when the edit is undone', async () => {
  const savesPath = writeJourney('saves.yaml', SAVES);
  context.options.refresh = true;
  await journeysEvidence({ context });
  const counted = readJourney(savesPath).evidence.production;

  const edited = fs.readFileSync(savesPath, 'utf8').replace('- click: save', '- click: title');
  fs.writeFileSync(savesPath, edited);
  Date.now.mockReturnValue(Date.parse('2026-10-05T12:00:00Z'));
  await journeysEvidence({ context });
  const journey = readJourney(savesPath);
  expect(validateJourney({ journey })).toEqual({ valid: true });
  const editedSteps = [{ click: 'edit' }, { click: 'title' }];
  expect(journey.evidence.production).toEqual({
    sequence: sequenceId({ pageId: 'tickets', steps: editedSteps }),
    pageId: 'tickets',
    flow: flowLines({ pageId: 'tickets', steps: editedSteps }),
    months: [month('2026-09', 1, 0), month('2026-10', 2, 1, 1, 1)],
    deprecated: [{ ...SAVES_FLOW, replaced: '2026-10-05', months: counted.months }],
  });

  fs.writeFileSync(
    savesPath,
    fs.readFileSync(savesPath, 'utf8').replace('- click: title', '- click: save')
  );
  Date.now.mockReturnValue(Date.parse('2026-10-06T12:00:00Z'));
  await journeysEvidence({ context });
  const reverted = readJourney(savesPath);
  expect(reverted.evidence.production).toEqual({
    ...counted,
    deprecated: [
      {
        sequence: sequenceId({ pageId: 'tickets', steps: editedSteps }),
        pageId: 'tickets',
        flow: flowLines({ pageId: 'tickets', steps: editedSteps }),
        replaced: '2026-10-06',
        months: journey.evidence.production.months,
      },
    ],
  });
});

test('journeys evidence leaves the flow alone when only waits, expectations and values change', async () => {
  const savesPath = writeJourney('saves.yaml', SAVES);
  context.options.refresh = true;
  await journeysEvidence({ context });
  const before = readJourney(savesPath).evidence;
  fs.writeFileSync(
    savesPath,
    fs
      .readFileSync(savesPath, 'utf8')
      .replace('  - click: save', '  - wait: 200\n  - click: save\n  - expect: { visible: done }')
  );
  await journeysEvidence({ context });
  expect(readJourney(savesPath).evidence).toEqual(before);
});

test('journeys evidence --refresh replaces a legacy window shape with monthly evidence', async () => {
  const savesPath = writeJourney(
    'saves.yaml',
    SAVES.replace(
      'steps:',
      'evidence:\n  production: { sessions: 9, persons: 2, orgs: 1, share: 0.5, failures: 0, window: 2026-09-03/2026-10-02 }\n  refreshed: 2026-10-02\nsteps:'
    )
  );
  expect(validateJourney({ journey: readJourney(savesPath) })).toEqual({ valid: true });
  context.options.refresh = true;
  await journeysEvidence({ context });
  const journey = readJourney(savesPath);
  expect(journey.evidence.production).toEqual({
    ...SAVES_FLOW,
    months: [month('2026-09', 1, 1, 1, 1), month('2026-10', 2, 2, 2, 2)],
  });
  expect(validateJourney({ journey })).toEqual({ valid: true });
});

test('journeys evidence lists journeys unbacked over the usage window with their mutation numbers and deletes none', async () => {
  writeJourney('saves.yaml', SAVES);
  const closePath = writeJourney('close.yaml', CLOSE);
  await journeysEvidence({ context });
  expect(logged).toContain('No production backing in 2026-08 to 2026-10 (nothing is removed):');
  expect(logged).toContain(
    '  member closes a ticket  0 sessions · 4/5 mutants · 2 only this journey kills'
  );
  expect(fs.existsSync(closePath)).toBe(true);
});

test('journeys evidence keeps committed production evidence when the cache holds no final day', async () => {
  fs.rmSync(path.join(context.directories.traces, 'production'), { recursive: true });
  const committed = { ...SAVES_FLOW, months: [month('2026-09', 30, 99, 9, 3)] };
  const savesPath = writeJourney(
    'saves.yaml',
    SAVES.replace(
      'steps:',
      `evidence:\n  production: ${JSON.stringify(committed)}\n  refreshed: 2026-09-01\nsteps:`
    )
  );
  const original = fs.readFileSync(savesPath, 'utf8');
  context.options.refresh = true;
  await journeysEvidence({ context });
  expect(fs.readFileSync(savesPath, 'utf8')).toBe(original);
  expect(logged).toContain(
    'The production trace cache holds no final day. Run "lowdefy journeys pull posthog" first to count production use.'
  );
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

// A day hashed under another salt resolves none of its clicked-text tokens,
// so it reads as a day not held rather than as clicks without text.
test('journeys evidence leaves out final days pulled under another salt', async () => {
  const manifestPath = path.join(
    context.directories.traces,
    'production',
    '2026-10-01.manifest.json'
  );
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  fs.writeFileSync(manifestPath, JSON.stringify({ ...manifest, salt_id: 'other000' }));
  const savesPath = writeJourney('saves.yaml', SAVES);
  context.options.refresh = true;
  await journeysEvidence({ context });
  expect(readJourney(savesPath).evidence.production.months).toEqual([
    month('2026-09', 1, 0),
    month('2026-10', 1, 2, 2, 2),
  ]);
  expect(logged).toContain(
    'Left out 1 final day(s) of the production cache pulled under another trace salt (2026-10-01). Pulling them again hashes them under this machine\'s salt. Run "lowdefy journeys pull posthog --from 2026-10-01 --to 2026-10-01" first.'
  );
});

function setOtherSalt(day) {
  const manifestPath = path.join(context.directories.traces, 'production', `${day}.manifest.json`);
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  fs.writeFileSync(manifestPath, JSON.stringify({ ...manifest, salt_id: 'other000' }));
}

test('journeys evidence names the pull when every final day is under another salt, not an empty cache', async () => {
  ['2026-09-30', '2026-10-01', '2026-10-02'].forEach(setOtherSalt);
  writeJourney('saves.yaml', SAVES);
  await journeysEvidence({ context });
  expect(logged).toContain(
    'Left out 3 final day(s) of the production cache pulled under another trace salt (2026-09-30, 2026-10-01, 2026-10-02). Pulling them again hashes them under this machine\'s salt. Run "lowdefy journeys pull posthog --from 2026-09-30 --to 2026-10-02" first.'
  );
  expect(logged.some((line) => line.includes('holds no final day'))).toBe(false);
});

test('journeys evidence says there is no trace salt when the cache has days but no salt', async () => {
  fs.rmSync(path.join(context.directories.traces, 'production', 'salt'));
  writeJourney('saves.yaml', SAVES);
  await journeysEvidence({ context });
  expect(logged).toContain(
    'There is no trace salt in .lowdefy/traces/production/, so 3 final day(s) of the production cache cannot be read (2026-09-30, 2026-10-01, 2026-10-02). Pulling them again hashes them under a new salt. Run "lowdefy journeys pull posthog --from 2026-09-30 --to 2026-10-02" first.'
  );
  expect(logged.some((line) => line.includes('holds no final day'))).toBe(false);
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

test('journeys evidence --refresh prints the dev recordings of the last 7 days that back each journey and writes none', async () => {
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
  expect(journey.evidence).not.toHaveProperty('dev');
  expect(validateJourney({ journey })).toEqual({ valid: true });
  expect(logged.some((line) => line.includes('2 dev recordings'))).toBe(true);
});

test('journeys evidence --refresh removes a committed dev count', async () => {
  const savesPath = writeJourney(
    'saves.yaml',
    SAVES.replace('steps:', 'evidence:\n  dev: { recordings: 5 }\n  refreshed: 2026-09-01\nsteps:')
  );
  context.options.refresh = true;
  await journeysEvidence({ context });
  const journey = YAML.parse(fs.readFileSync(savesPath, 'utf8'));
  expect(journey.evidence).not.toHaveProperty('dev');
  expect(validateJourney({ journey })).toEqual({ valid: true });
});

// Production clicks as the pull stores them: a token under the machine's
// salt, never the text.
function writeTokenisedDays() {
  const directory = path.join(configDirectory, '.lowdefy', 'traces', 'production');
  fs.mkdirSync(directory, { recursive: true });
  const salt = Buffer.alloc(32, 6);
  fs.writeFileSync(path.join(directory, 'salt'), salt);
  const click = ({ session, t, block, column = null, text }) => {
    const entry = record({ session, t, block });
    entry.target = { ...entry.target, column, text_token: tokenText({ salt, text }) };
    delete entry.target.text;
    return entry;
  };
  const start = Date.parse('2026-10-02T09:00:00Z');
  writeDay('2026-10-02', [
    record({ session: 's1', t: start, kind: 'pageview' }),
    click({ session: 's1', t: start + 1000, block: 'assign_button', text: 'Assign' }),
    record({ session: 's2', t: start + 5000, kind: 'pageview' }),
    click({ session: 's2', t: start + 6000, block: 'grid', column: 'name', text: 'Acme Ltd' }),
    record({ session: 's3', t: start + 9000, kind: 'pageview' }),
    click({ session: 's3', t: start + 10000, block: 'open_button', text: 'Open (3)' }),
  ]);
  writeDay('2026-10-03', []);
}

function journeyFile(steps) {
  return `name: picks
pageId: tickets
steps:
  - click: ${JSON.stringify(steps)}
`;
}

async function productionFor(steps) {
  writeJourney('picks.yaml', journeyFile(steps));
  const { results } = await journeysEvidence({ context });
  return results[0].after.production;
}

function octoberSessions(production) {
  return production.months.find((entry) => entry.month === '2026-10').sessions;
}

test('journeys evidence backs a config label only by clicks that resolved to it', async () => {
  writeTokenisedDays();
  expect(octoberSessions(await productionFor({ blockId: 'assign_button', text: 'Assign' }))).toBe(
    1
  );
  expect(octoberSessions(await productionFor({ blockId: 'assign_button', text: 'Delete' }))).toBe(
    0
  );
});

test('journeys evidence backs a guessed data value exactly as a click with no text', async () => {
  writeTokenisedDays();
  const shown = await productionFor({ blockId: 'grid', column: 'name', text: 'Acme Ltd' });
  const shownLog = logged.join('\n');
  logged.length = 0;
  const neverShown = await productionFor({ blockId: 'grid', column: 'name', text: 'Initech' });
  const neverShownLog = logged.join('\n');
  logged.length = 0;
  const none = await productionFor({ blockId: 'grid', column: 'name' });
  expect(octoberSessions(shown)).toBe(1);
  expect(shown).toEqual(neverShown);
  expect(shown).toEqual(none);
  expect(shownLog).toEqual(neverShownLog);
  expect(shownLog).not.toContain('Acme');
});

test('journeys evidence backs a label built from values by its block', async () => {
  writeTokenisedDays();
  expect(octoberSessions(await productionFor({ blockId: 'open_button', text: 'Open (3)' }))).toBe(
    1
  );
  expect(octoberSessions(await productionFor({ blockId: 'open_button', text: 'Open (4)' }))).toBe(
    1
  );
});

test('journeys evidence --refresh writes the same evidence for a guessed value and no text', async () => {
  writeTokenisedDays();
  context.options.refresh = true;
  const guessed = writeJourney(
    'guessed.yaml',
    journeyFile({ blockId: 'grid', column: 'name', text: 'Initech' })
  );
  await journeysEvidence({ context });
  const written = YAML.parse(fs.readFileSync(guessed, 'utf8')).evidence;
  fs.rmSync(guessed);
  const plain = writeJourney('plain.yaml', journeyFile({ blockId: 'grid', column: 'name' }));
  await journeysEvidence({ context });
  expect(YAML.parse(fs.readFileSync(plain, 'utf8')).evidence).toEqual(written);
  expect(octoberSessions(written.production)).toBe(1);
});

test('journeys evidence --refresh keeps counting a renamed label by the text its committed flow holds', async () => {
  writeTokenisedDays();
  context.options.refresh = true;
  const picksPath = writeJourney(
    'picks.yaml',
    journeyFile({ blockId: 'assign_button', text: 'Assign' })
  );
  await journeysEvidence({ context });
  const counted = readJourney(picksPath).evidence.production;
  expect(counted.months).toEqual([month('2026-10', 2, 1, 1, 1, 0)]);
  // The label is renamed in the config and in the journey, and a fuller pull
  // adds a day of October, so the old flow's month is read again.
  writeDay('2026-10-01', []);
  CONFIG_TEXTS.delete('Assign');
  CONFIG_TEXTS.add('Store');
  try {
    fs.writeFileSync(
      picksPath,
      fs.readFileSync(picksPath, 'utf8').replace('"text":"Assign"', '"text":"Store"')
    );
    await journeysEvidence({ context });
  } finally {
    CONFIG_TEXTS.delete('Store');
    CONFIG_TEXTS.add('Assign');
  }
  const { production } = readJourney(picksPath).evidence;
  expect(production.deprecated).toHaveLength(1);
  expect(production.deprecated[0].flow).toEqual(counted.flow);
  expect(production.deprecated[0].months).toEqual([month('2026-10', 3, 1, 1, 1, 0)]);
  expect(production.months).toEqual([month('2026-10', 3, 0, 0, 0, 0)]);
});

test('journeys evidence --refresh refuses final days pulled with different environments', async () => {
  const directory = path.join(configDirectory, '.lowdefy', 'traces', 'production');
  [
    ['2026-10-01', 'production'],
    ['2026-10-02', 'staging'],
  ].forEach(([day, environment]) => {
    const manifestPath = path.join(directory, `${day}.manifest.json`);
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    fs.writeFileSync(
      manifestPath,
      JSON.stringify({ ...manifest, project_id: '1', environment, filter_test_accounts: true })
    );
  });
  const savesPath = writeJourney('saves.yaml', SAVES);
  context.options.refresh = true;
  await expect(journeysEvidence({ context })).rejects.toThrow(
    /different filters, which cannot be counted together: 2026-09-30 \(project null, any environment, test accounts filtered out\); 2026-10-01 \(project 1, environment "production", test accounts filtered out\); 2026-10-02 \(project 1, environment "staging", test accounts filtered out\)/
  );
  expect(fs.readFileSync(savesPath, 'utf8')).toBe(SAVES);
});
