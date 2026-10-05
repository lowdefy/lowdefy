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

const mockCompileWalks = jest.fn();
const mockRunJourney = jest.fn();
jest.unstable_mockModule('@lowdefy/node-utils', () => ({
  collectKnownText: () => ({ has: () => false }),
  listRecordingFiles: () => [],
}));
jest.unstable_mockModule('./compileWalks.js', () => ({ default: mockCompileWalks }));
jest.unstable_mockModule('../../test/runJourney.js', () => ({ default: mockRunJourney }));

const { default: finishRun } = await import('./finishRun.js');

const run = '20261004T120000Z-ab12cd';
const url = 'http://localhost:3110';
let configDirectory;
let runDirectory;
let infoLines;

const errorFinding = {
  kind: 'action-error',
  severity: 'error',
  message: 'CallAPI "assign" failed',
  pageId: 'ticket',
  source: 'pages/ticket.yaml:88',
  key: 'action-error|ticket|pages/ticket.yaml:88',
  step: 1,
};
const flakyFinding = {
  ...errorFinding,
  kind: 'server-error',
  message: 'Timed out',
  key: 'server-error|ticket|pages/ticket.yaml:12',
};
const deadClick = {
  kind: 'dead-click',
  severity: 'warning',
  message: 'Clicking help did nothing.',
  pageId: 'ticket',
  source: null,
  key: 'dead-click|ticket|abc',
  step: 0,
};

function walkLog({ walk, findings }) {
  return {
    walk,
    pageId: 'ticket',
    user: 'member',
    roles: ['member'],
    open: { ms: 100, dataMs: 10, pageMs: 50 },
    closeMs: 5,
    stopReason: 'finding',
    steps: [
      {
        index: 0,
        startedAt: new Date().toISOString(),
        durations: { decideMs: 1, actMs: 2, observeMs: 3 },
        screenshot: null,
      },
    ],
    findings,
  };
}

function walked({ logs, stopped = null }) {
  return {
    logs,
    dataName: 'staging',
    dataSet: null,
    policy: { name: 'seeded' },
    costs: {
      calls: 0,
      failedCalls: 0,
      inputTokens: 0,
      outputTokens: 0,
      usd: 0,
      estimatedUsd: 0,
    },
    walkMs: 1000,
    stopped,
    notRun: [],
  };
}

function candidatePath(name) {
  return path.join(
    configDirectory,
    'tests',
    'journeys',
    '_candidates',
    'explorer',
    run,
    'findings',
    `${name}.yaml`
  );
}

function writeCandidate(name, steps) {
  const filePath = candidatePath(name);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, YAML.stringify({ name, pageId: 'ticket', data: 'staging', steps }));
  return filePath;
}

function finish({ logs, stopped, options = {} }) {
  return finishRun({
    context: {
      directories: { config: configDirectory },
      logger: { info: (line) => infoLines.push(line) },
    },
    options: { liveData: false, allowExternal: [], budgetMs: 60000, json: false, ...options },
    run,
    runDirectory,
    revisions: { pr: null, base: 'base', head: 'head', dirty: false },
    scope: { pages: [], appWide: false, uncompared: [], removedPages: [] },
    walked: walked({ logs, stopped }),
    buildDirectory: undefined,
    url,
    startedAt: new Date().toISOString(),
  });
}

beforeEach(() => {
  configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-explore-finish-'));
  runDirectory = path.join(configDirectory, '.lowdefy', 'explore', run);
  fs.mkdirSync(path.join(runDirectory, 'screenshots'), { recursive: true });
  fs.writeFileSync(path.join(runDirectory, 'walks.jsonl'), '{}\n');
  fs.writeFileSync(path.join(runDirectory, 'screenshots', 'walk-1-1.png'), 'png');
  infoLines = [];
  mockCompileWalks.mockImplementation(() => ({
    finding: [
      { key: errorFinding.key, path: writeCandidate('error', [{ click: 'assign' }]) },
      { key: flakyFinding.key, path: writeCandidate('flaky', [{ click: 'save' }]) },
    ],
    notCompiled: [{ key: deadClick.key, reason: 'no-candidate' }],
    coverage: [],
    droppedExpectations: 0,
  }));
  mockRunJourney.mockImplementation(async ({ item }) => {
    if (item.journey.name === 'error') {
      return {
        passed: false,
        failure: {
          index: 0,
          step: { click: 'assign' },
          kind: 'app-error',
          errors: [{ kind: 'action-error', key: errorFinding.key }],
        },
      };
    }
    return { passed: true };
  });
});

afterEach(() => {
  fs.rmSync(configDirectory, { recursive: true, force: true });
  jest.clearAllMocks();
});

test('finishRun proves findings after compiling, deletes unproven candidates and keeps walk logs and screenshots', async () => {
  const logs = [
    walkLog({ walk: 'walk-1', findings: [deadClick, flakyFinding] }),
    walkLog({ walk: 'walk-2', findings: [errorFinding] }),
  ];
  const report = await finish({ logs });
  expect(fs.existsSync(candidatePath('error'))).toBe(true);
  expect(fs.existsSync(candidatePath('flaky'))).toBe(false);
  expect(fs.existsSync(path.join(runDirectory, 'walks.jsonl'))).toBe(true);
  expect(fs.existsSync(path.join(runDirectory, 'screenshots', 'walk-1-1.png'))).toBe(true);
  expect(mockRunJourney).toHaveBeenCalledTimes(3);
  mockRunJourney.mock.calls.forEach(([args]) => expect(args.url).toBe(url));

  expect(report.findings.proven.map((finding) => [finding.key, finding.candidate])).toEqual([
    [
      errorFinding.key,
      path.join('tests', 'journeys', '_candidates', 'explorer', run, 'findings', 'error.yaml'),
    ],
  ]);
  expect(
    Object.entries(report.findings.notProven).map(([reason, group]) => [
      reason,
      group.map((finding) => finding.key),
    ])
  ).toEqual([
    ['not-reproduced', [flakyFinding.key]],
    ['no-candidate', [deadClick.key]],
  ]);
  expect(report.candidates.finding).toEqual([
    path.join('tests', 'journeys', '_candidates', 'explorer', run, 'findings', 'error.yaml'),
  ]);
  expect(report.proof).toEqual({ ms: expect.any(Number), live: false });

  const findings = JSON.parse(fs.readFileSync(path.join(runDirectory, 'findings.json'), 'utf8'));
  expect(findings.map(({ key, status, reason }) => [key, status, reason])).toEqual([
    [errorFinding.key, 'proven', undefined],
    [flakyFinding.key, 'not-proven', 'not-reproduced'],
    [deadClick.key, 'not-proven', 'no-candidate'],
  ]);
  const written = JSON.parse(fs.readFileSync(path.join(runDirectory, 'report.json'), 'utf8'));
  expect(written.findings.proven[0].key).toBe(errorFinding.key);

  expect(infoLines).toContain('Findings  1 proven, 2 not proven');
  expect(infoLines.find((line) => line.startsWith('Proofs    '))).toMatch(
    /^Proofs {4}\d+\.\d s, outside the budget$/
  );
  expect(infoLines.findIndex((line) => line.startsWith('Not proven, its journey'))).toBeGreaterThan(
    infoLines.findIndex((line) => line.includes(errorFinding.message))
  );
});

test('a run whose walks ran out of budget still proves every finding', async () => {
  const logs = [walkLog({ walk: 'walk-1', findings: [errorFinding, flakyFinding] })];
  const report = await finish({ logs, stopped: { reason: 'budget' } });
  expect(report.budget.stopped).toEqual({ reason: 'budget' });
  expect(report.findings.proven.map((finding) => finding.key)).toEqual([errorFinding.key]);
  expect(report.findings.notProven['not-reproduced'].map((finding) => finding.key)).toEqual([
    flakyFinding.key,
  ]);
});

test('a run on live connections proves nothing, deletes every finding candidate and says to rerun on a data set', async () => {
  const logs = [walkLog({ walk: 'walk-1', findings: [errorFinding] })];
  const report = await finish({ logs, options: { liveData: true } });
  expect(mockRunJourney).not.toHaveBeenCalled();
  expect(report.findings.proven).toEqual([]);
  expect(report.findings.notProven['live-writes'].map((finding) => finding.key)).toEqual([
    errorFinding.key,
  ]);
  expect(report.proof.live).toBe(true);
  expect(fs.existsSync(path.dirname(candidatePath('error')))).toBe(false);
  expect(infoLines.find((line) => line.startsWith('Proofs    '))).toContain(
    'Rerun on a data set (--data <name>)'
  );
});
