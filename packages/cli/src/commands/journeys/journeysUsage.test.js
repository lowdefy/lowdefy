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

// The config text set comes from a full build by the dev server's builder;
// these tests hold it empty.
jest.unstable_mockModule('./configText/readConfigText.js', () => ({
  default: async () => ({ texts: new Set(), isConfigText: () => false }),
}));

const { default: journeysUsage } = await import('./journeysUsage.js');

let configDirectory;
let context;
let logged;
let errors;
let stdout;

function month(name, days, sessions, persons = 1, orgs = 1, failures = 0) {
  return { month: name, days, sessions, persons, orgs, failures };
}

function writeJourney({ file, name, blockId, months, extra = {}, deprecated }) {
  const steps = [{ click: blockId }, { expect: { visible: 'done' } }];
  const journey = { name, pageId: 'tickets', ...extra, steps };
  if (months) {
    journey.evidence = {
      production: {
        sequence: sequenceId({ pageId: 'tickets', steps }),
        pageId: 'tickets',
        flow: flowLines({ pageId: 'tickets', steps }),
        months,
      },
    };
    if (deprecated) journey.evidence.production.deprecated = deprecated;
  }
  const directory = path.join(configDirectory, 'tests', 'journeys', path.dirname(file));
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(configDirectory, 'tests', 'journeys', file), YAML.stringify(journey));
}

function writeCoverage({ grouped = true, forced = false, version = 2 } = {}) {
  fs.mkdirSync(context.directories.test, { recursive: true });
  fs.writeFileSync(
    path.join(context.directories.test, 'coverage.json'),
    JSON.stringify({
      version,
      window: { from: '2026-09-04', to: '2026-10-03' },
      flowGrouping: { grouped, rows: 4200, threshold: 100000, forced },
      measures: {
        flow: grouped
          ? {
              uncovered: [
                { key: 'aaaa1111', hash: 'aaaa1111', page: 'tickets', count: 4, sequence: [{}] },
                {
                  key: 'bbbb2222',
                  hash: 'bbbb2222',
                  page: 'board',
                  count: 40,
                  sequence: [{}, {}],
                },
              ],
            }
          : null,
      },
    })
  );
}

beforeEach(() => {
  configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-usage-'));
  logged = [];
  errors = [];
  stdout = [];
  context = {
    directories: {
      config: configDirectory,
      dev: path.join(configDirectory, '.lowdefy', 'dev'),
      build: path.join(configDirectory, '.lowdefy', 'server', 'build'),
      journeys: path.join(configDirectory, 'tests', 'journeys'),
      test: path.join(configDirectory, '.lowdefy', 'test'),
    },
    logger: {
      info: (message) => logged.push(String(message)),
      warn: (message) => logged.push(String(message)),
      error: (message) => errors.push(String(message)),
    },
    options: {},
    sendTelemetry: async () => {},
  };
  jest.spyOn(process.stdout, 'write').mockImplementation((text) => {
    stdout.push(text);
    return true;
  });
  writeJourney({
    file: 'assign.yaml',
    name: 'member assigns a ticket',
    blockId: 'assign',
    months: [month('2026-09', 30, 300, 30, 9, 4), month('2026-10', 3, 30, 11, 5, 1)],
    deprecated: [
      {
        sequence: 'v1-91be04d7',
        pageId: 'tickets',
        flow: ['tickets ["click","assign_button",null,null]'],
        replaced: '2026-10-01',
        months: [month('2026-09', 30, 60), month('2026-10', 3, 3)],
      },
      {
        sequence: 'v0-12345678',
        pageId: 'tickets',
        flow: [],
        replaced: '2026-01-01',
        months: [],
      },
    ],
  });
  writeJourney({
    file: 'review/close.yaml',
    name: 'member closes a ticket',
    blockId: 'close',
    months: [month('2026-09', 30, 30), month('2026-10', 3, 3)],
    extra: { tags: ['review'] },
  });
  writeJourney({
    file: 'review/new.yaml',
    name: 'member reopens a ticket',
    blockId: 'reopen',
    extra: { tags: ['review'] },
  });
  writeJourney({
    file: 'retired.yaml',
    name: 'member prints a ticket',
    blockId: 'print',
    months: [month('2026-10', 3, 6)],
    extra: { deprecated: true },
  });
});

afterEach(() => {
  jest.restoreAllMocks();
  process.exitCode = undefined;
  fs.rmSync(configDirectory, { recursive: true, force: true });
});

test('journeys usage ranks journeys by rate with tiers, months and old flows, then the uncovered flows', async () => {
  writeCoverage();
  await journeysUsage({ context });
  expect(logged).toEqual([
    'Journey usage over 2026-08 to 2026-10: 363 journey matches across 4 journeys.',
    'Tier shares are shares of journey matches, not sessions: a session counts once for every journey it backs.',
    '',
    `#1 common  10.0/day  member assigns a ticket  (${path.join(
      'tests',
      'journeys',
      'assign.yaml'
    )})`,
    '    330 sessions, 5 failed over the window · all time 330 sessions, 5 failed',
    '    2026-09: 300 (30 persons, 9 orgs) · 2026-10: 30 (11 persons, 5 orgs)',
    '    old flow v1-91be04d7, replaced 2026-10-01: 1.9/day · 63 sessions over the window',
    '    old flow v0-12345678, replaced 2026-01-01: no longer counted: hashed under an older matcher',
    `#2 edge  1.0/day  member closes a ticket  (${path.join(
      'tests',
      'journeys',
      'review',
      'close.yaml'
    )})`,
    '    33 sessions, 0 failed over the window · all time 33 sessions, 0 failed',
    '    2026-09: 30 (1 persons, 1 orgs) · 2026-10: 3 (1 persons, 1 orgs)',
    `unranked  member reopens a ticket  (${path.join('tests', 'journeys', 'review', 'new.yaml')})`,
    '    no counts for its current flow yet: run "lowdefy journeys evidence --refresh"; it runs in every tier',
    `deprecated  2.0/day  member prints a ticket  (${path.join(
      'tests',
      'journeys',
      'retired.yaml'
    )})`,
    '    6 sessions, 0 failed over the window · all time 6 sessions, 0 failed',
    '    2026-10: 6 (1 persons, 1 orgs)',
    '',
    "Uncovered production flows in 2026-09-04 to 2026-10-03 (coverage's window, by sessions, not tiered): 2",
    '      40 sessions  board  bbbb2222  (2 steps)',
    '       4 sessions  tickets  aaaa1111  (1 steps)',
  ]);
});

test('journeys usage says why it lists no flows when coverage did not group them', async () => {
  writeCoverage({ grouped: false });
  await journeysUsage({ context });
  expect(logged[logged.length - 1]).toBe(
    'Uncovered production flows in 2026-09-04 to 2026-10-03: not grouped (4200 rows < 100000). Read the sessions with "lowdefy journeys session --source production", or run "lowdefy journeys coverage --group".'
  );
  writeCoverage({ grouped: false, forced: true });
  await journeysUsage({ context });
  expect(logged[logged.length - 1]).toContain('not grouped (coverage ran with --no-group)');
});

test('journeys usage reads a coverage report of an earlier version as none', async () => {
  writeCoverage({ version: 1 });
  await journeysUsage({ context });
  expect(logged[logged.length - 1]).toBe(
    'Uncovered production flows: no coverage report yet. Run "lowdefy journeys coverage" to list them.'
  );
});

test('journeys usage says to run coverage when there is no coverage report', async () => {
  await journeysUsage({ context });
  expect(logged[logged.length - 1]).toBe(
    'Uncovered production flows: no coverage report yet. Run "lowdefy journeys coverage" to list them.'
  );
});

test('journeys usage --tier common lists the tier and the unranked journeys, not the deprecated one', async () => {
  context.options.tier = 'common';
  const report = await journeysUsage({ context });
  expect(report.rows.map((row) => row.name)).toEqual([
    'member assigns a ticket',
    'member reopens a ticket',
  ]);
  expect(logged).toContain('Showing tier common: 2 journeys.');
});

test('journeys usage computes tiers over the paths, tags and filters selected', async () => {
  context.options.tag = ['review'];
  const tagged = await journeysUsage({ context });
  expect(tagged.rows.map((row) => [row.name, row.tier])).toEqual([
    ['member closes a ticket', 'common'],
    ['member reopens a ticket', 'common'],
  ]);
  context.options.tag = undefined;
  context.options.filter = ['assigns'];
  context.options.paths = [path.join(configDirectory, 'tests', 'journeys', 'assign.yaml')];
  const filtered = await journeysUsage({ context });
  expect(filtered.rows.map((row) => row.name)).toEqual(['member assigns a ticket']);
});

test('journeys usage selects as lowdefy test does, a persona run filter included', async () => {
  writeJourney({
    file: 'edit.yaml',
    name: 'edits a ticket',
    blockId: 'edit',
    months: [month('2026-09', 30, 90)],
    extra: { data: 'tickets', user: ['admin', 'member'] },
  });
  context.options.filter = ['[admin]'];
  const report = await journeysUsage({ context });
  expect(report.rows.map((row) => [row.name, row.file, row.journeyIndex])).toEqual([
    ['edits a ticket', path.join('tests', 'journeys', 'edit.yaml'), 0],
  ]);
});

test('journeys usage refuses a tier below 100 journey matches, prints the count and exits non-zero', async () => {
  context.options.paths = [path.join(configDirectory, 'tests', 'journeys', 'review')];
  context.options.tier = 'common';
  await journeysUsage({ context });
  expect(errors[0]).toContain('33 journey matches');
  expect(process.exitCode).toBe(1);
  expect(logged.filter((line) => line.includes('member'))).toEqual([]);
  process.exitCode = undefined;
  context.options.tier = 'full';
  const full = await journeysUsage({ context });
  expect(full.rows.map((row) => row.name)).toEqual([
    'member closes a ticket',
    'member reopens a ticket',
  ]);
});

test('journeys usage --json prints the same rows as the text report', async () => {
  writeCoverage();
  context.options.json = true;
  const report = await journeysUsage({ context });
  const printed = JSON.parse(stdout.join(''));
  expect(printed).toEqual(JSON.parse(JSON.stringify(report)));
  expect(Object.keys(printed)).toEqual(['windowMonths', 'anchor', 'matches', 'rows', 'uncovered']);
  expect(printed.rows.map((row) => [row.name, row.tier, row.rank])).toEqual([
    ['member assigns a ticket', 'common', 1],
    ['member closes a ticket', 'edge', 2],
    ['member reopens a ticket', 'common', null],
    ['member prints a ticket', null, null],
  ]);
  expect(printed.uncovered.flows.map((flow) => flow.key)).toEqual(['bbbb2222', 'aaaa1111']);
  expect(logged).toEqual([]);
});

test('journeys usage refuses an unknown tier and a malformed usage window', async () => {
  context.options.tier = 'popular';
  await expect(journeysUsage({ context })).rejects.toThrow('--tier should be one of');
  context.options.tier = undefined;
  context.options.usageWindow = '90d';
  await expect(journeysUsage({ context })).rejects.toThrow('--usage-window takes');
});
