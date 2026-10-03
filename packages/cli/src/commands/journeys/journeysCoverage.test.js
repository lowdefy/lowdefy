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
import journeysCoverage from './journeysCoverage.js';

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
  fs.writeFileSync(path.join(directory, `${day}.manifest.json`), JSON.stringify({ day }));
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
