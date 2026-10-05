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

const mockResolveCurrentBuild = jest.fn();
jest.unstable_mockModule('./resolveCurrentBuild.js', () => ({
  default: mockResolveCurrentBuild,
}));

const { default: journeysRecordings } = await import('./journeysRecordings.js');
const { default: formatSessionLine } = await import('./formatSessionLine.js');

const BUILD_A = '2026-10-03T13:31:00.000Z';
const BUILD_B = '2026-10-03T14:02:00.000Z';
const OLD_SESSION = '20261003T134000Z-aaaaaa';
const NEW_SESSION = '20261003T140300Z-bbbbbb';
const TEST_RUN = '20261003T150000Z-tttttt';
const AGENT_RUN = '20261003T160000Z-gggggg';

let configDirectory;
let context;
let logs;

function at(minutes) {
  return new Date(Date.parse('2026-10-03T13:00:00.000Z') + minutes * 60000).toISOString();
}

function base({ session, t, build, source = 'dev', run }) {
  const record = {
    v: 1,
    session,
    t,
    scope: 'page',
    roles: [],
    person: null,
    org: null,
    build,
    source,
  };
  if (run) record.run = run;
  return record;
}

function pageview({ page, ...rest }) {
  return {
    ...base(rest),
    kind: 'pageview',
    page_id: page,
    url: `/${page}`,
    target: null,
    event: null,
  };
}

function click({ page, block, text, failure, ...rest }) {
  const event = {
    name: 'onClick',
    block_id: block,
    success: failure === undefined,
    requests: [],
    state_writes: [],
    url_after: `/${page}`,
  };
  if (failure) {
    event.error = {
      name: 'UserError',
      config_key: null,
      action_type: failure.action,
      action_id: 'a',
    };
    event.invalid_blocks = failure.invalid;
  }
  return {
    ...base(rest),
    kind: 'click',
    page_id: page,
    target: {
      block_id: block,
      block_type: 'Button',
      row: null,
      column: null,
      text,
      nth: null,
      option: false,
    },
    event,
  };
}

function writeTrace({ source, id, records }) {
  const date = `${id.slice(0, 4)}-${id.slice(4, 6)}-${id.slice(6, 8)}`;
  const directory = path.join(configDirectory, '.lowdefy', 'traces', source, date);
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(
    path.join(directory, `${id}.jsonl`),
    records.map((record) => JSON.stringify(record)).join('\n')
  );
}

function writeFixtures() {
  writeTrace({
    source: 'dev',
    id: OLD_SESSION,
    records: [
      pageview({ session: OLD_SESSION, t: at(40), build: BUILD_A, page: 'settings' }),
      click({
        session: OLD_SESSION,
        t: at(41),
        build: BUILD_A,
        page: 'settings',
        block: 'save',
        text: 'Save',
      }),
    ],
  });
  writeTrace({
    source: 'dev',
    id: NEW_SESSION,
    records: [
      pageview({ session: NEW_SESSION, t: at(63), build: BUILD_B, page: 'tickets' }),
      click({
        session: NEW_SESSION,
        t: at(64),
        build: BUILD_B,
        page: 'tickets',
        block: 'open',
        text: 'Open',
      }),
      click({
        session: NEW_SESSION,
        t: at(65),
        build: BUILD_B,
        page: 'tickets',
        block: 'assign_submit',
        text: 'Assign',
        failure: { action: 'Validate', invalid: ['assignee'] },
      }),
      pageview({ session: NEW_SESSION, t: at(70), build: BUILD_B, page: 'ticket' }),
      click({
        session: NEW_SESSION,
        t: at(71),
        build: BUILD_B,
        page: 'ticket',
        block: 'close',
        text: 'Close',
      }),
    ],
  });
  const testRun = { id: TEST_RUN, by: 'test', journey: 'tests/journeys/t.yaml', actor: 'main' };
  writeTrace({
    source: 'journey',
    id: TEST_RUN,
    records: [
      pageview({
        session: 'j1',
        t: at(120),
        build: BUILD_B,
        page: 'tickets',
        source: 'journey',
        run: testRun,
      }),
      click({
        session: 'j1',
        t: at(121),
        build: BUILD_B,
        page: 'tickets',
        block: 'open',
        text: 'Open',
        source: 'journey',
        run: testRun,
      }),
    ],
  });
  const agentRun = { id: AGENT_RUN, by: 'agent', journey: null, actor: 'main' };
  writeTrace({
    source: 'journey',
    id: AGENT_RUN,
    records: [
      pageview({
        session: 'j2',
        t: at(180),
        build: BUILD_B,
        page: 'settings',
        source: 'journey',
        run: agentRun,
      }),
      click({
        session: 'j2',
        t: at(181),
        build: BUILD_B,
        page: 'settings',
        block: 'save',
        text: 'Save',
        source: 'journey',
        run: agentRun,
      }),
    ],
  });
}

beforeEach(() => {
  configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-recordings-command-'));
  logs = [];
  context = {
    directories: {
      config: configDirectory,
      dev: path.join(configDirectory, '.lowdefy', 'dev'),
      build: path.join(configDirectory, '.lowdefy', 'server', 'build'),
    },
    options: {},
    logger: { info: (line) => logs.push(line) },
    sendTelemetry: jest.fn(),
  };
  mockResolveCurrentBuild.mockReset();
  jest.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-10-03T17:00:00.000Z'));
});

afterEach(() => {
  jest.restoreAllMocks();
  fs.rmSync(configDirectory, { recursive: true, force: true });
});

test('journeys recordings summarises sessions newest first with failures and coverage', async () => {
  writeFixtures();
  const { sessions, testRun } = await journeysRecordings({ context });
  expect(testRun).toEqual({ id: TEST_RUN });
  expect(sessions.map((session) => session.id)).toEqual([NEW_SESSION, OLD_SESSION]);
  expect(sessions[0]).toEqual({
    id: NEW_SESSION,
    start: at(63),
    end: at(71),
    builds: [BUILD_B],
    pages: ['tickets', 'ticket'],
    attempts: expect.any(Number),
    failed: 1,
    firstFailure: {
      block_id: 'assign_submit',
      action_type: 'Validate',
      invalid_blocks: ['assignee'],
    },
    covered: 1,
    total: expect.any(Number),
  });
  expect(sessions[0].total).toBeGreaterThanOrEqual(2);
  // The newer agent run drove settings.save, but only the test run counts.
  expect(sessions[1]).toMatchObject({ pages: ['settings'], failed: 0, covered: 0, total: 1 });
  expect(logs).toEqual(sessions.map((session) => formatSessionLine(session)));
  expect(logs[0]).toContain('tickets → ticket');
  expect(logs[0]).toContain('1 failed (Validate on assign_submit: assignee)');
  expect(logs[0]).toContain(`1/${sessions[0].total} interactions already covered by tests`);
});

test('journeys recordings omits coverage when no test run was recorded', async () => {
  writeTrace({
    source: 'dev',
    id: OLD_SESSION,
    records: [
      pageview({ session: OLD_SESSION, t: at(40), build: BUILD_A, page: 'settings' }),
      click({
        session: OLD_SESSION,
        t: at(41),
        build: BUILD_A,
        page: 'settings',
        block: 'save',
        text: 'Save',
      }),
    ],
  });
  const { sessions, testRun } = await journeysRecordings({ context });
  expect(testRun).toBe(null);
  expect(sessions[0].covered).toBe(null);
  expect(logs[0]).not.toContain('covered');
});

test('journeys recordings filters by --since and --page', async () => {
  writeFixtures();
  context.options.since = '190m';
  expect((await journeysRecordings({ context })).sessions.map((s) => s.id)).toEqual([NEW_SESSION]);
  context.options.since = undefined;
  context.options.page = 'settings';
  expect((await journeysRecordings({ context })).sessions.map((s) => s.id)).toEqual([OLD_SESSION]);
});

test('journeys recordings --build current keeps the sessions of the served build', async () => {
  writeFixtures();
  context.options.build = 'current';
  mockResolveCurrentBuild.mockResolvedValue({ buildId: BUILD_A, from: 'server' });
  expect((await journeysRecordings({ context })).sessions.map((s) => s.id)).toEqual([OLD_SESSION]);
});

test('journeys recordings --build current falls back to the newest recorded build and says so', async () => {
  writeFixtures();
  context.options.build = 'current';
  mockResolveCurrentBuild.mockResolvedValue({ buildId: BUILD_B, from: 'records' });
  const { sessions } = await journeysRecordings({ context });
  expect(sessions.map((s) => s.id)).toEqual([NEW_SESSION]);
  expect(logs[0]).toEqual(
    `No dev server for this app answered, so --build current is the newest build in the recordings, ${BUILD_B}.`
  );
  expect(mockResolveCurrentBuild.mock.calls[0][0].records).toHaveLength(7);
});

test('journeys recordings --json prints { sessions, testRun } on stdout', async () => {
  writeFixtures();
  const write = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
  context.options.json = true;
  const result = await journeysRecordings({ context });
  expect(JSON.parse(write.mock.calls[0][0])).toEqual(result);
  expect(Object.keys(result.sessions[0]).sort()).toEqual(
    [
      'attempts',
      'builds',
      'covered',
      'end',
      'failed',
      'firstFailure',
      'id',
      'pages',
      'start',
      'total',
    ].sort()
  );
  expect(logs).toEqual([]);
});

test('journeys recordings says when there is nothing recorded', async () => {
  await journeysRecordings({ context });
  expect(logs).toEqual(['No recorded dev sessions in this window.']);
});
