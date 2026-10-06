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

import { jest } from '@jest/globals';
import YAML from 'yaml';

import validateJourney from '../../test/validateJourney.js';

const actualNodeUtils = await import('@lowdefy/node-utils/index.js');
const mockReadRecordings = jest.fn();
const mockCompileTrace = jest.fn();
jest.unstable_mockModule('@lowdefy/node-utils', () => ({
  ...actualNodeUtils,
  compileTrace: mockCompileTrace,
  readRecordings: mockReadRecordings,
}));

const { default: compileWalks } = await import('./compileWalks.js');

const run = '20261004T120000Z-ab12cd';
const scope = {
  base: 'base-sha',
  pages: [
    {
      pageId: 'ticket',
      blocks: [
        { blockId: 'assign_submit', change: 'added' },
        { blockId: 'old', change: 'removed' },
      ],
    },
  ],
};
let configDirectory;

function at(seconds) {
  return new Date(Date.UTC(2026, 9, 4, 12, 0, seconds)).toISOString();
}

// A trace record of one walk. `step` is what the mocked compiler makes of it,
// and `segment` splits a walk's records the way an uncaused pageview does.
function record({ walk, t, step, segment = 0 }) {
  return {
    session: `session-${walk}`,
    source: 'explorer',
    run: { id: run, journey: walk },
    t,
    step,
    segment,
  };
}

// The compiler, reduced to what compileWalks relies on: filters.until cuts
// records by time, each session segment is a candidate through
// prepareCandidate, and segments carry their hash and last_seen.
function fakeCompileTrace({ records, filters = {}, prepareCandidate }) {
  const kept = records.filter(
    (entry) => filters.until === undefined || Date.parse(entry.t) <= filters.until
  );
  const groups = new Map();
  kept.forEach((entry) => {
    const id = `${entry.session}-${entry.segment}`;
    if (!groups.has(id)) groups.set(id, []);
    groups.get(id).push(entry);
  });
  const segments = [];
  const candidates = [];
  groups.forEach((group, id) => {
    const hash = `${id}-${group.length}`;
    segments.push({ hash, session: group[0].session, last_seen: group[group.length - 1].t });
    const prepared = prepareCandidate({
      journey: {
        name: `ticket recorded ${hash}`,
        pageId: 'ticket',
        user: { roles: ['agent'] },
        steps: group.map((entry) => entry.step).filter((step) => step !== undefined),
      },
      origin: { source: 'explorer', sequence_hash: hash },
      comments: new Map(),
      sessions: [group[0].session],
    });
    if (prepared === null) return;
    candidates.push({
      fileName: `ticket-${hash}.yaml`,
      contents: `# ${JSON.stringify(prepared.origin)}\n${YAML.stringify(prepared.journey)}`,
      hash,
      journey: prepared.journey,
      origin: prepared.origin,
    });
  });
  return { candidates, segments };
}

const errorFinding = {
  kind: 'action-error',
  severity: 'error',
  message: 'CallAPI failed',
  pageId: 'ticket',
  source: 'pages/ticket.yaml:88',
  key: 'action-error|ticket|pages/ticket.yaml:88',
  step: 1,
};
const deadClick = {
  kind: 'dead-click',
  severity: 'warning',
  message: 'Clicking help did nothing.',
  pageId: 'ticket',
  source: null,
  key: 'dead-click|ticket|abc123',
  step: 0,
};
const roleRefused = {
  kind: 'role-refused',
  severity: 'error',
  message: 'Page "ticket" admits roles [agent] but sent the walk to home.',
  pageId: 'ticket',
  source: null,
  key: 'role-refused|ticket|def456',
};

function walkLog({ walk, user = 'agent_amy', findings = [], steps = [] }) {
  return { walk, pageId: 'ticket', user, roles: ['agent'], steps, findings };
}

function logStep({ index, startedAt, step }) {
  return { index, startedAt, step };
}

function compile(overrides = {}) {
  return compileWalks({
    configDirectory,
    run,
    pr: { number: 2531 },
    scope,
    buildDirectory: undefined,
    logs: [],
    dataName: 'staging',
    snapshot: false,
    knownTextFor: () => ({ has: () => false }),
    ...overrides,
  });
}

function readCandidate(filePath) {
  const contents = fs.readFileSync(filePath, 'utf8');
  return { contents, journey: YAML.parse(contents) };
}

const runDirectory = () =>
  path.join(configDirectory, 'tests', 'journeys', '_candidates', 'explorer', run);

beforeEach(() => {
  configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-explore-compile-'));
  mockCompileTrace.mockImplementation(fakeCompileTrace);
});

afterEach(() => {
  fs.rmSync(configDirectory, { recursive: true, force: true });
  jest.clearAllMocks();
});

test('an error walk compiles into the run findings directory with its data set, user and finding key', () => {
  mockReadRecordings.mockReturnValue([
    record({ walk: 'walk-1', t: at(1), step: { fill: { blockId: 'title', value: 'A title' } } }),
    record({ walk: 'walk-1', t: at(2), step: { click: 'assign_submit' } }),
  ]);
  const result = compile({ logs: [walkLog({ walk: 'walk-1', findings: [errorFinding] })] });
  expect(result.notCompiled).toEqual([]);
  expect(result.finding).toEqual([{ key: errorFinding.key, path: expect.any(String) }]);
  expect(path.dirname(result.finding[0].path)).toBe(path.join(runDirectory(), 'findings'));
  const { contents, journey } = readCandidate(result.finding[0].path);
  expect(journey).toEqual({
    name: 'ticket recorded session-walk-1-0-2',
    pageId: 'ticket',
    data: 'staging',
    user: 'agent_amy',
    steps: [{ fill: { blockId: 'title', value: 'A title' } }, { click: 'assign_submit' }],
  });
  expect(contents).toContain(
    JSON.stringify({
      run,
      pr: 2531,
      walks: ['walk-1'],
      finding: {
        key: errorFinding.key,
        kind: 'action-error',
        message: 'CallAPI failed',
        source: 'pages/ticket.yaml:88',
      },
    })
  );
  expect(validateJourney({ journey })).toEqual({ valid: true });
  expect(mockReadRecordings).toHaveBeenCalledWith({ configDirectory, source: 'explorer', run });
});

test('a dead click mid-walk is cut where the next step started and ends in expect.effect', () => {
  mockReadRecordings.mockReturnValue([
    record({ walk: 'walk-1', t: at(1), step: { click: 'help' } }),
    record({ walk: 'walk-1', t: at(3), step: { click: 'assign_submit' } }),
  ]);
  const result = compile({
    logs: [
      walkLog({
        walk: 'walk-1',
        findings: [deadClick],
        steps: [
          logStep({ index: 0, startedAt: at(0), step: { click: { blockId: 'help' } } }),
          logStep({ index: 1, startedAt: at(2), step: { click: { blockId: 'assign_submit' } } }),
        ],
      }),
    ],
  });
  expect(result.notCompiled).toEqual([]);
  const { journey } = readCandidate(result.finding[0].path);
  expect(journey.steps).toEqual([{ click: 'help' }, { expect: { effect: true } }]);
  expect(validateJourney({ journey })).toEqual({ valid: true });
});

test('a dead click on the last step of a walk keeps every record of the walk', () => {
  mockReadRecordings.mockReturnValue([
    record({ walk: 'walk-1', t: at(1), step: { fill: { blockId: 'title', value: 'A title' } } }),
    record({ walk: 'walk-1', t: at(3), step: { click: { blockId: 'help', text: 'Help' } } }),
  ]);
  const result = compile({
    logs: [
      walkLog({
        walk: 'walk-1',
        findings: [{ ...deadClick, step: 1 }],
        steps: [
          logStep({ index: 0, startedAt: at(0), step: { fill: { blockId: 'title', value: 'A' } } }),
          logStep({ index: 1, startedAt: at(2), step: { click: { blockId: 'help' } } }),
        ],
      }),
    ],
  });
  const { journey } = readCandidate(result.finding[0].path);
  expect(journey.steps).toEqual([
    { fill: { blockId: 'title', value: 'A title' } },
    { click: { blockId: 'help', text: 'Help' } },
    { expect: { effect: true } },
  ]);
});

test('a dead click whose compiled journey does not end on that click is no-candidate', () => {
  // The click the walk sent left no record before the next step started.
  mockReadRecordings.mockReturnValue([
    record({ walk: 'walk-1', t: at(1), step: { fill: { blockId: 'title', value: 'A title' } } }),
    record({ walk: 'walk-1', t: at(5), step: { click: 'assign_submit' } }),
  ]);
  const result = compile({
    logs: [
      walkLog({
        walk: 'walk-1',
        findings: [{ ...deadClick, step: 1 }],
        steps: [
          logStep({ index: 0, startedAt: at(0), step: { fill: { blockId: 'title', value: 'A' } } }),
          logStep({ index: 1, startedAt: at(2), step: { click: { blockId: 'help' } } }),
          logStep({ index: 2, startedAt: at(4), step: { click: { blockId: 'assign_submit' } } }),
        ],
      }),
    ],
  });
  expect(result.finding).toEqual([]);
  expect(result.notCompiled).toEqual([{ key: deadClick.key, reason: 'no-candidate' }]);
  expect(fs.existsSync(path.join(runDirectory(), 'findings'))).toBe(false);
});

test('a role refused at open is written as the one-step page root journey', () => {
  mockReadRecordings.mockReturnValue([]);
  const result = compile({ logs: [walkLog({ walk: 'walk-1', findings: [roleRefused] })] });
  const { contents, journey } = readCandidate(result.finding[0].path);
  expect(journey).toEqual({
    name: 'ticket explorer role-refused at open',
    pageId: 'ticket',
    data: 'staging',
    user: 'agent_amy',
    steps: [{ expect: { visible: 'ticket' } }],
  });
  expect(contents).toContain('lowdefy test');
  expect(contents).toContain(`key: ${roleRefused.key}`);
  expect(validateJourney({ journey })).toEqual({ valid: true });
});

test('two walks that hit one key give one candidate, from the first walk', () => {
  mockReadRecordings.mockReturnValue([
    record({ walk: 'walk-1', t: at(1), step: { click: 'assign_submit' } }),
    record({ walk: 'walk-2', t: at(5), step: { fill: { blockId: 'title', value: 'B' } } }),
    record({ walk: 'walk-2', t: at(6), step: { click: 'assign_submit' } }),
  ]);
  const result = compile({
    logs: [
      walkLog({ walk: 'walk-1', findings: [errorFinding] }),
      walkLog({ walk: 'walk-2', user: 'agent_bob', findings: [errorFinding] }),
    ],
  });
  expect(result.finding).toHaveLength(1);
  const { contents, journey } = readCandidate(result.finding[0].path);
  expect(journey.user).toBe('agent_amy');
  expect(journey.steps).toEqual([{ click: 'assign_submit' }]);
  expect(contents).toContain('"walks":["walk-1"]');
  expect(fs.readdirSync(path.join(runDirectory(), 'findings'))).toHaveLength(1);
});

test('a walk split into segments compiles only the last segment', () => {
  mockReadRecordings.mockReturnValue([
    record({ walk: 'walk-1', t: at(1), step: { click: 'old' } }),
    record({ walk: 'walk-1', t: at(9), step: { click: 'assign_submit' }, segment: 1 }),
  ]);
  const result = compile({ logs: [walkLog({ walk: 'walk-1', findings: [errorFinding] })] });
  const { journey } = readCandidate(result.finding[0].path);
  expect(journey.steps).toEqual([{ click: 'assign_submit' }]);
});

test('two keys compiled from one walk get a file each', () => {
  mockReadRecordings.mockReturnValue([
    record({ walk: 'walk-1', t: at(1), step: { click: 'assign_submit' } }),
  ]);
  const serverError = {
    ...errorFinding,
    kind: 'server-error',
    key: 'server-error|ticket|pages/ticket.yaml:12',
  };
  const result = compile({
    logs: [walkLog({ walk: 'walk-1', findings: [errorFinding, serverError] })],
  });
  expect(result.finding.map((entry) => entry.key)).toEqual([errorFinding.key, serverError.key]);
  expect(new Set(result.finding.map((entry) => entry.path)).size).toBe(2);
});

test('walks with no provable finding compile into the run directory, only candidates touching the change kept', () => {
  mockReadRecordings.mockReturnValue([
    record({ walk: 'walk-1', t: at(1), step: { click: 'assign_submit' } }),
    record({ walk: 'walk-2', t: at(2), step: { click: 'assign_submit' } }),
    record({ walk: 'walk-3', t: at(3), step: { click: 'old' } }),
    record({ walk: 'walk-4', t: at(4), step: { click: 'assign_submit' } }),
  ]);
  const environment = {
    kind: 'environment',
    severity: 'info',
    message: '$search is not supported',
    pageId: 'ticket',
    key: 'environment|ticket|x',
    step: 0,
  };
  const result = compile({
    logs: [
      walkLog({ walk: 'walk-1', findings: [errorFinding] }),
      walkLog({ walk: 'walk-2' }),
      walkLog({ walk: 'walk-3' }),
      walkLog({ walk: 'walk-4', findings: [environment] }),
    ],
  });
  expect(result.coverage).toEqual([
    path.join(runDirectory(), 'ticket-session-walk-2-0-1.yaml'),
    path.join(runDirectory(), 'ticket-session-walk-4-0-1.yaml'),
  ]);
  expect(fs.readFileSync(result.coverage[0], 'utf8')).toContain('"walks":["walk-2"]');
  expect(result.finding.map((entry) => entry.key)).toEqual([errorFinding.key]);
});

test('two runs write two directories, neither touching the other', () => {
  mockReadRecordings.mockReturnValue([
    record({ walk: 'walk-1', t: at(1), step: { click: 'assign_submit' } }),
  ]);
  const logs = [walkLog({ walk: 'walk-1', findings: [errorFinding] })];
  const first = compile({ logs });
  const secondRun = '20261004T130000Z-ef34gh';
  const second = compile({ logs, run: secondRun });
  const explorer = path.join(configDirectory, 'tests', 'journeys', '_candidates', 'explorer');
  expect(fs.readdirSync(explorer).sort()).toEqual([run, secondRun]);
  expect(first.finding[0].path.startsWith(path.join(explorer, run))).toBe(true);
  expect(second.finding[0].path.startsWith(path.join(explorer, secondRun))).toBe(true);
  expect(fs.existsSync(first.finding[0].path)).toBe(true);
});

test('on a snapshot data set, an expectation holding a snapshot value is dropped before writing', () => {
  mockReadRecordings.mockReturnValue([
    record({ walk: 'walk-1', t: at(1), step: { click: 'assign_submit' } }),
    record({
      walk: 'walk-1',
      t: at(2),
      step: { expect: { state: { path: 'customer', equals: 'Staging Customer Ltd' } } },
    }),
    record({ walk: 'walk-2', t: at(3), step: { click: 'assign_submit' } }),
    record({
      walk: 'walk-2',
      t: at(4),
      step: { expect: { state: { path: 'customer', equals: 'Staging Customer Ltd' } } },
    }),
  ]);
  const result = compile({
    snapshot: true,
    logs: [walkLog({ walk: 'walk-1', findings: [errorFinding] }), walkLog({ walk: 'walk-2' })],
  });
  expect(result.droppedExpectations).toBe(2);
  [result.finding[0].path, ...result.coverage].forEach((file) => {
    expect(fs.readFileSync(file, 'utf8')).not.toContain('Staging Customer Ltd');
  });
});
