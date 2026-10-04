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

import buildExploreReport from './buildExploreReport.js';
import formatExploreReport from './formatExploreReport.js';
import readExploreRuns from './readExploreRuns.js';

let configDirectory;

beforeEach(() => {
  configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-explore-runs-'));
});

afterEach(() => {
  fs.rmSync(configDirectory, { recursive: true, force: true });
});

function walkedRun() {
  return {
    dataName: 'staging',
    policy: { name: 'seeded' },
    costs: { calls: 0, failedCalls: 0, inputTokens: 0, outputTokens: 0, usd: 0, estimatedUsd: 0 },
    walkMs: 12000,
    stopped: null,
    notRun: [{ pageId: 'invoices', user: 'member', reason: 'budget', walks: 2 }],
    confirmations: [{ key: 'k', status: 'confirmed' }],
    logs: [
      {
        walk: 'walk-1',
        pageId: 'ticket',
        user: 'admin',
        open: { ms: 1800, dataMs: 900, pageMs: 900 },
        closeMs: 100,
        stopReason: 'finding',
        steps: [
          { durations: { decideMs: 0, actMs: 400, observeMs: 100 } },
          { durations: { decideMs: 0, actMs: 1400, observeMs: 100 } },
        ],
        findings: [],
      },
      {
        walk: 'walk-2',
        pageId: 'tickets',
        user: 'member',
        open: { ms: 1000, dataMs: 50, pageMs: 950 },
        closeMs: 80,
        stopReason: 'access-changed',
        steps: [],
        findings: [],
      },
    ],
  };
}

test('the report counts what ran and its timings, and readExploreRuns maps the run to its PR', () => {
  const findings = [
    {
      key: 'k',
      kind: 'action-error',
      severity: 'error',
      status: 'confirmed',
      message: 'CallAPI failed',
      pageId: 'ticket',
      source: 'pages/ticket.yaml:88',
      walks: ['walk-1'],
      users: ['admin'],
    },
  ];
  const report = buildExploreReport({
    run: '20261004T120000Z-ab12cd',
    revisions: { pr: { number: 2531 }, base: 'aaa', head: 'bbb', dirty: false },
    scope: { pages: [{ pageId: 'ticket' }], appWide: [], uncompared: [], removedPages: [] },
    walked: walkedRun(),
    findings,
    candidates: { finding: ['f.yaml'], coverage: [], droppedExpectations: 0 },
    trace: { path: '.lowdefy/traces/explorer/2026-10-04/x.jsonl', bytes: 2048 },
    startedAt: '2026-10-04T12:00:00.000Z',
    finishedAt: '2026-10-04T12:05:00.000Z',
    budgetMs: 1200000,
  });
  expect(report.ran).toEqual({ pages: 2, targets: 2, walks: 2, confirmations: 1, steps: 2 });
  expect(report.timings.step).toEqual({
    meanMs: 1000,
    p90Ms: 1500,
    actMs: 900,
    observeMs: 100,
    decideMs: 0,
  });
  expect(report.timings.walk).toEqual({ meanMs: 1490, dataMs: 475, openMs: 925, closeMs: 90 });
  expect(report.accessChanged).toEqual([{ pageId: 'tickets', user: 'member' }]);
  expect(report.findings).toEqual({ confirmed: 1, unconfirmed: 0, deadClicks: 0, environment: 0 });
  const lines = formatExploreReport({ report, findings });
  expect(lines).toEqual(
    expect.arrayContaining([
      'Not run   invoices × member: budget',
      'Access    changed in this PR: tickets no longer admits member',
      'Findings  1 confirmed, 0 unconfirmed, 0 dead clicks',
      '  ERROR action-error  ticket  CallAPI failed  pages/ticket.yaml:88  (1 walk, admin)',
    ])
  );

  const runDirectory = path.join(configDirectory, '.lowdefy', 'explore', report.run);
  fs.mkdirSync(runDirectory, { recursive: true });
  fs.writeFileSync(path.join(runDirectory, 'report.json'), JSON.stringify(report));
  fs.mkdirSync(path.join(configDirectory, '.lowdefy', 'explore', 'trees'));
  expect(readExploreRuns({ configDirectory })).toEqual([
    {
      run: '20261004T120000Z-ab12cd',
      pr: { number: 2531 },
      base: 'aaa',
      head: 'bbb',
      finishedAt: '2026-10-04T12:05:00.000Z',
    },
  ]);
});
