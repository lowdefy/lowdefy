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
import { validate } from '@lowdefy/ajv';

import coverageReportSchema from './coverageReport/coverageReportSchema.js';
import readTraceSalt from './pull/readTraceSalt.js';

// The config text set comes from a full build by the dev server's builder;
// these tests hold it fixed.
const CONFIG_TEXTS = new Set(['Help']);
jest.unstable_mockModule('./configText/readConfigText.js', () => ({
  default: async () => ({ texts: CONFIG_TEXTS, isConfigText: (text) => CONFIG_TEXTS.has(text) }),
}));

// Grouping starts at 100000 rows in use; the cache written below holds 5, so
// 6 puts it just under the threshold, and one more visit over it.
jest.unstable_mockModule('./flowGroupingMinRows.js', () => ({ default: 6 }));

const { default: journeysCoverage } = await import('./journeysCoverage.js');
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
function writeDay(day, records) {
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
    JSON.stringify({ day, salt_id: saltId, text_rule: 'token' })
  );
}

function writeJourney(name, text) {
  const directory = path.join(configDirectory, 'tests', 'journeys');
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, name), text);
  return path.join(directory, name);
}

const SAVES = `name: member saves a ticket
pageId: tickets
user: { roles: [member] }
steps:
  - click: edit
  - click: save
`;

beforeEach(() => {
  configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-coverage-command-'));
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
    // Most tests measure flows, so they group whatever the window holds.
    options: { since: '2d', group: true },
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
      blocks: ['open'],
      person: 'p_2',
    }),
  ]);
  writeDay('2026-10-03', []);
  writeJourney('saves.yaml', SAVES);
});

afterEach(() => {
  jest.restoreAllMocks();
  fs.rmSync(configDirectory, { recursive: true, force: true });
});

test('journeys coverage writes coverage.json with the measures, profile and journeys', async () => {
  const report = await journeysCoverage({ context });
  const written = JSON.parse(
    fs.readFileSync(path.join(configDirectory, '.lowdefy', 'test', 'coverage.json'), 'utf8')
  );
  expect(written).toEqual(report);
  expect(validate({ schema: coverageReportSchema, data: written })).toEqual({ valid: true });
  expect(written.window).toEqual({ from: '2026-10-02', to: '2026-10-03' });
  expect(written.measures.flow).toMatchObject({ covered: 1, total: 2 });
  expect(written.measures.role).toMatchObject({ covered: 1, total: 1 });
  expect(written.production.entryPoints).toEqual([{ page: 'tickets', sessions: 2 }]);
  expect(written.journeys).toEqual([
    {
      file: path.join('tests', 'journeys', 'saves.yaml'),
      name: 'member saves a ticket',
      pageId: 'tickets',
      sequence: [
        { page: 'tickets', identity: '["click","edit",null,null]' },
        { page: 'tickets', identity: '["click","save",null,null]' },
      ],
    },
  ]);
  expect(logged.some((line) => line.startsWith('flow'))).toBe(true);
});

test('journeys coverage leaves a deprecated journey out, so the flow only it walked is uncovered', async () => {
  const savesPath = writeJourney('saves.yaml', SAVES.replace('steps:', 'deprecated: true\nsteps:'));
  const deprecated = await journeysCoverage({ context });
  expect(deprecated.measures.flow).toMatchObject({ covered: 0, total: 2 });
  expect(deprecated.measures.flow.uncovered.map((item) => item.sequence.length)).toEqual([2, 1]);
  expect(deprecated.journeys).toEqual([]);
  fs.writeFileSync(savesPath, SAVES);
  const live = await journeysCoverage({ context });
  expect(live.measures.flow).toMatchObject({ covered: 1, total: 2 });
  expect(live.journeys.map((journey) => journey.name)).toEqual(['member saves a ticket']);
});

test('journeys coverage does not group a window under the threshold and says why', async () => {
  delete context.options.group;
  const report = await journeysCoverage({ context });
  expect(validate({ schema: coverageReportSchema, data: report })).toEqual({ valid: true });
  expect(report.flowGrouping).toEqual({ grouped: false, rows: 5, threshold: 6, forced: false });
  expect(report.measures.flow).toBeNull();
  expect(report.production.flows).toEqual([]);
  expect(report.measures.role).toMatchObject({ covered: 1, total: 1 });
  expect(logged).toContain(
    'flow         not grouped (5 rows < 6): read sessions with "lowdefy journeys session --source production", or group them with --group'
  );
});

test('journeys coverage --group groups a window under the threshold', async () => {
  const report = await journeysCoverage({ context });
  expect(report.flowGrouping).toEqual({ grouped: true, rows: 5, threshold: 6, forced: true });
  expect(report.measures.flow).toMatchObject({ covered: 1, total: 2 });
  expect(report.production.flows.length).toBeGreaterThan(0);
});

test('journeys coverage groups a window at the threshold, unless --no-group', async () => {
  delete context.options.group;
  writeDay(
    '2026-10-03',
    visit({ session: 's3', start: Date.parse('2026-10-03T08:00:00Z'), blocks: [] })
  );
  const grouped = await journeysCoverage({ context });
  expect(grouped.flowGrouping).toEqual({ grouped: true, rows: 6, threshold: 6, forced: false });
  expect(grouped.measures.flow).toMatchObject({ covered: 1, total: 2 });
  context.options.group = false;
  const skipped = await journeysCoverage({ context });
  expect(skipped.flowGrouping).toEqual({ grouped: false, rows: 6, threshold: 6, forced: true });
  expect(skipped.measures.flow).toBeNull();
  expect(logged.some((line) => line.includes('not grouped (--no-group)'))).toBe(true);
});

test('journeys coverage --json prints the report', async () => {
  const write = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
  context.options.json = true;
  const report = await journeysCoverage({ context });
  expect(JSON.parse(write.mock.calls[0][0])).toEqual(report);
});

test('journeys coverage gives the same report bytes for the same inputs apart from generated', async () => {
  const reportPath = path.join(configDirectory, '.lowdefy', 'test', 'coverage.json');
  await journeysCoverage({ context });
  const first = fs.readFileSync(reportPath, 'utf8');
  Date.now.mockReturnValue(NOW + 1000);
  await journeysCoverage({ context });
  const second = fs.readFileSync(reportPath, 'utf8');
  expect(second.replace(/"generated": ".*"/, '')).toBe(first.replace(/"generated": ".*"/, ''));
});

test('journeys coverage names the pull for a missing day', async () => {
  context.options.since = '4d';
  await expect(journeysCoverage({ context })).rejects.toThrow(
    'lowdefy journeys pull posthog --from 2026-09-30'
  );
});

test('journeys coverage refuses a window over 30 days', async () => {
  context.options.since = '60d';
  await expect(journeysCoverage({ context })).rejects.toThrow(
    'is 60 days long; a mining window is at most 30 days'
  );
});

test('journeys coverage adds the mutation score when a report exists, and none without', async () => {
  const report = await journeysCoverage({ context });
  expect(report).not.toHaveProperty('mutation');
  fs.writeFileSync(
    path.join(configDirectory, '.lowdefy', 'test', 'mutation.json'),
    JSON.stringify({ killed: 2, total: 3, journeys: [] })
  );
  const withMutation = await journeysCoverage({ context });
  expect(withMutation.mutation).toEqual({ killed: 2, total: 3, share: 0.67 });
  expect(validate({ schema: coverageReportSchema, data: withMutation })).toEqual({ valid: true });
  expect(logged.some((line) => line.startsWith('mutation     2/3 (0.67)'))).toBe(true);
});

const RUN = '20261003T110000Z-run001';
const SAVES_KEY = 'tests/journeys/saves.yaml#member saves a ticket';

const SAVE_FAILED = {
  name: 'onClick',
  block_id: 'save',
  success: false,
  error: { name: 'UserError', action_type: 'Validate', config_key: 'k-1', action_id: 'validate' },
  invalid_blocks: [],
};

// A journey run as the dev server records a full-suite `lowdefy test` run.
function writeJourneyRun({ blocks, failOn }) {
  const start = Date.parse('2026-10-03T11:00:00Z');
  const run = { id: RUN, by: 'test', journey: SAVES_KEY, actor: 'main' };
  const records = [
    { ...record({ session: 'j1', t: start, kind: 'pageview' }), source: 'journey', run },
    ...blocks.map((block, index) => {
      const entry = {
        ...record({ session: 'j1', t: start + (index + 1) * 1000, block }),
        source: 'journey',
        run,
        event: { name: 'onClick', block_id: block, success: true },
      };
      if (block === failOn) entry.event = SAVE_FAILED;
      return entry;
    }),
  ].map(({ person, org, roles, ...rest }) => rest);
  const directory = path.join(configDirectory, '.lowdefy', 'traces', 'journey', '2026-10-03');
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(
    path.join(directory, `${RUN}.jsonl`),
    records.map((entry) => JSON.stringify(entry)).join('\n')
  );
}

function writeTestRunResults({ run = RUN, passed }) {
  fs.mkdirSync(context.directories.test, { recursive: true });
  fs.writeFileSync(
    path.join(context.directories.test, 'run.json'),
    JSON.stringify({ version: 1, run, journeys: { [SAVES_KEY]: { passed } } })
  );
}

function addProductionSaveFailure() {
  writeDay('2026-10-03', [
    record({ session: 's3', t: Date.parse('2026-10-03T08:00:00Z'), kind: 'pageview' }),
    { ...record({ session: 's3', t: Date.parse('2026-10-03T08:00:01Z'), block: 'edit' }) },
    {
      ...record({ session: 's3', t: Date.parse('2026-10-03T08:00:02Z'), block: 'save' }),
      event: SAVE_FAILED,
    },
  ]);
}

test('journeys coverage reports the measured interaction share from the newest test run', async () => {
  writeJourneyRun({ blocks: ['edit'] });
  const report = await journeysCoverage({ context });
  expect(validate({ schema: coverageReportSchema, data: report })).toEqual({ valid: true });
  // Static: edit and save of the 3 entries. Measured: the run drove edit only.
  expect(report.measures.interaction).toMatchObject({ covered: 2, total: 3 });
  expect(report.measures.interaction.measured).toEqual({
    covered: 1,
    total: 3,
    share: 0.33,
    run: RUN,
  });
  expect(logged.some((line) => line.includes(`measured in run ${RUN}`))).toBe(true);
});

test('journeys coverage counts a failure a passing journey produced as measured', async () => {
  addProductionSaveFailure();
  writeJourneyRun({ blocks: ['edit', 'save'], failOn: 'save' });
  writeTestRunResults({ passed: true });
  const report = await journeysCoverage({ context });
  expect(validate({ schema: coverageReportSchema, data: report })).toEqual({ valid: true });
  expect(report.measures.failure).toMatchObject({
    mode: 'measured',
    run: RUN,
    covered: 1,
    total: 1,
  });
});

test('journeys coverage does not count a failure produced by a journey that failed', async () => {
  addProductionSaveFailure();
  writeJourneyRun({ blocks: ['edit', 'save'], failOn: 'save' });
  writeTestRunResults({ passed: false });
  const { failure } = (await journeysCoverage({ context })).measures;
  expect(failure).toMatchObject({ mode: 'measured', covered: 0, total: 1 });
});

test('journeys coverage stays reached when run.json belongs to another run', async () => {
  addProductionSaveFailure();
  writeJourneyRun({ blocks: ['edit', 'save'], failOn: 'save' });
  writeTestRunResults({ run: '20261002T110000Z-run000', passed: true });
  const { failure } = (await journeysCoverage({ context })).measures;
  expect(failure.mode).toBe('reached');
  expect(failure).not.toHaveProperty('run');
});

test('journeys coverage without journey runs reports no measured share and reached failures', async () => {
  const report = await journeysCoverage({ context });
  expect(report.measures.interaction).not.toHaveProperty('measured');
  expect(report.measures.failure.mode).toBe('reached');
});

// Production clicks as the pull stores them: a token, never the text. Two
// blockless rage clicks on different elements, one on config text, and grid
// cells showing customers' names, tokenised under the salt the days already
// in the cache were pulled with.
function writeTokenisedDay() {
  const directory = path.join(configDirectory, '.lowdefy', 'traces', 'production');
  fs.mkdirSync(directory, { recursive: true });
  if (!fs.existsSync(path.join(directory, 'salt'))) {
    fs.writeFileSync(path.join(directory, 'salt'), Buffer.alloc(32, 7));
  }
  const { salt } = readTraceSalt({
    directories: { traces: path.join(configDirectory, '.lowdefy', 'traces') },
  });
  const click = ({ session, t, block = null, column = null, text, frustration, person }) => {
    const entry = record({ session, t, block: block ?? 'placeholder', person });
    entry.target = {
      ...entry.target,
      block_id: block,
      column,
      text_token: tokenText({ salt, text }),
    };
    delete entry.target.text;
    if (frustration) entry.frustration = frustration;
    return entry;
  };
  const start = Date.parse('2026-10-03T09:00:00Z');
  writeDay('2026-10-03', [
    record({ session: 's9', t: start, kind: 'pageview' }),
    click({ session: 's9', t: start + 1000, text: 'Acme Ltd', frustration: 'rage' }),
    click({ session: 's9', t: start + 3000, text: 'Globex', frustration: 'rage' }),
    click({ session: 's9', t: start + 5000, text: 'Help', frustration: 'dead' }),
    click({ session: 's9', t: start + 7000, block: 'grid', column: 'name', text: 'Acme Ltd' }),
    click({
      session: 's9',
      t: start + 9000,
      block: 'grid',
      column: 'name',
      text: 'Globex',
      person: 'p_2',
    }),
  ]);
}

test('journeys coverage writes token counts and frustration by token, and no data text', async () => {
  writeTokenisedDay();
  const report = await journeysCoverage({ context });
  expect(validate({ schema: coverageReportSchema, data: report })).toEqual({ valid: true });
  const { frustration, textTokens } = report.production;
  const blockless = frustration.filter((entry) => entry.block_id === null);
  expect(blockless).toHaveLength(3);
  expect(blockless.filter((entry) => entry.text === 'Help')).toHaveLength(1);
  expect(new Set(blockless.map((entry) => entry.key)).size).toBe(3);
  const grid = textTokens.find((row) => row.block_id === 'grid');
  expect(grid).toMatchObject({ page: 'tickets', column: 'name', clicks: 2, tokens: 2 });
  expect(grid.top).toHaveLength(2);
  const written = fs.readFileSync(
    path.join(configDirectory, '.lowdefy', 'test', 'coverage.json'),
    'utf8'
  );
  expect(written).not.toContain('Acme');
  expect(written).not.toContain('Globex');
});

test('journeys coverage never matches a token-only frustration by a journey click text', async () => {
  writeTokenisedDay();
  writeJourney(
    'guess.yaml',
    `name: guesses
pageId: tickets
steps:
  - click: { text: Acme Ltd }
  - expect: { url: { contains: /tickets } }
  - click: { text: Help }
  - expect: { url: { contains: /tickets } }
`
  );
  const report = await journeysCoverage({ context });
  const uncovered = report.measures.frustration.uncovered.map((entry) => entry.text);
  expect(uncovered.filter((text) => text === 'Help')).toEqual([]);
  expect(uncovered.filter((text) => text === null)).toHaveLength(2);
  expect(JSON.stringify(report)).not.toContain('Acme');
});

// Sets one cached day's pull filters as the pull records them.
function setPullFilters({ day, environment }) {
  const manifestPath = path.join(
    configDirectory,
    '.lowdefy',
    'traces',
    'production',
    `${day}.manifest.json`
  );
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  fs.writeFileSync(
    manifestPath,
    JSON.stringify({ ...manifest, project_id: '1', environment, filter_test_accounts: true })
  );
}

test('journeys coverage refuses a window whose days were pulled with different environments', async () => {
  setPullFilters({ day: '2026-10-02', environment: 'production' });
  setPullFilters({ day: '2026-10-03', environment: 'staging' });
  await expect(journeysCoverage({ context })).rejects.toThrow(
    'The production trace cache holds days pulled with different filters, which cannot be counted together: 2026-10-02 (project 1, environment "production", test accounts filtered out); 2026-10-03 (project 1, environment "staging", test accounts filtered out). Pull them again with one set of filters (the same --environment and --include-test-accounts for every day): run "lowdefy journeys pull posthog --refetch --from 2026-10-02 --to 2026-10-03".'
  );
});
