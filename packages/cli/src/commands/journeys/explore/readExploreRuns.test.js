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
    targets: [
      { pageId: 'ticket', user: 'admin', roles: ['admin'] },
      { pageId: 'tickets', user: 'member', roles: ['member'] },
    ],
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
      status: 'proven',
      candidate: 'f.yaml',
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
    proof: { ms: 4000, live: false },
    candidates: { finding: ['f.yaml'], coverage: [], droppedExpectations: 0 },
    trace: { path: '.lowdefy/traces/explorer/2026-10-04/x.jsonl', bytes: 2048 },
    startedAt: '2026-10-04T12:00:00.000Z',
    finishedAt: '2026-10-04T12:05:00.000Z',
    budgetMs: 1200000,
  });
  expect(report.ran).toEqual({ pages: 2, targets: 2, walks: 2, steps: 2 });
  expect(report.findings).toEqual({ proven: findings, notProven: {} });
  expect(report.proof).toEqual({ ms: 4000, live: false });
  expect(report.timings.step).toEqual({
    meanMs: 1000,
    p90Ms: 1500,
    actMs: 900,
    observeMs: 100,
    decideMs: 0,
  });
  expect(report.timings.walk).toEqual({ meanMs: 1490, dataMs: 475, openMs: 925, closeMs: 90 });
  expect(report.accessChanged).toEqual([{ pageId: 'tickets', user: 'member' }]);
  expect(report.charter).toBeNull();
  expect(report.pruned).toEqual({ pruned: [], keptEdited: [] });
  const lines = formatExploreReport({ report });
  expect(lines.some((line) => line.startsWith('Charter'))).toBe(false);
  expect(lines.some((line) => line.startsWith('Pruned'))).toBe(false);
  const pruning = formatExploreReport({
    report: {
      ...report,
      pruned: {
        pruned: ['tests/journeys/_candidates/explorer/a', 'tests/journeys/_candidates/explorer/b'],
        keptEdited: ['tests/journeys/_candidates/explorer/c'],
      },
    },
  });
  expect(pruning).toContain(
    'Pruned    2 candidate folders older than 14 days; kept 1 folder with edited files'
  );
  expect(lines).toEqual(
    expect.arrayContaining([
      'Not run   invoices × member: budget',
      'Access    changed in this PR: tickets no longer admits member',
      'Findings  1 proven, 0 not proven',
      '  ERROR action-error  ticket  CallAPI failed  pages/ticket.yaml:88  (1 walk, admin)  → f.yaml',
      'Proofs    4.0 s, outside the budget',
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

test('the report records the charter that steered the run, and the summary prints it', () => {
  const report = buildExploreReport({
    run: '20261004T120000Z-ab12cd',
    revisions: { pr: null, base: null, head: 'bbb', dirty: false },
    charter: { goal: 'Try edge input on the invoice form.' },
    scope: { pages: [{ pageId: 'ticket' }], appWide: [], uncompared: [], removedPages: [] },
    walked: walkedRun(),
    findings: [],
    proof: { ms: 0, live: false },
    candidates: { finding: [], coverage: [], droppedExpectations: 0 },
    trace: null,
    startedAt: '2026-10-04T12:00:00.000Z',
    finishedAt: '2026-10-04T12:05:00.000Z',
    budgetMs: 1200000,
  });
  expect(report.charter).toEqual({ goal: 'Try edge input on the invoice form.' });
  expect(report.base).toBeNull();
  const lines = formatExploreReport({ report });
  expect(lines[1]).toEqual('Charter   Try edge input on the invoice form.');
});

test('a --charters run reports each charter with its pages, roles and walks, and the summary names the charters that hit each finding', () => {
  const walked = walkedRun();
  walked.targets = [
    { pageId: 'ticket', user: 'admin', roles: ['admin'], charter: 0 },
    { pageId: 'ticket', user: 'admin', roles: ['admin'], charter: 1 },
    { pageId: 'tickets', user: 'member', roles: ['member'], charter: 1 },
    { pageId: 'tickets', user: null, roles: [], charter: 2 },
  ];
  walked.logs = walked.logs.map((log, index) => ({ ...log, charter: index }));
  walked.notRun = [
    { pageId: 'tickets', user: 'guest', charter: 2, reason: 'budget', walks: 5 },
    { pageId: 'invoices', reason: 'no-charter' },
  ];
  const charters = [
    { goal: 'Try edge input on the ticket form.', pages: ['ticket'] },
    { goal: 'Try error paths.' },
    { goal: 'Try the ticket list as a guest.', pages: ['tickets'] },
  ];
  const findings = [
    {
      key: 'k',
      kind: 'action-error',
      severity: 'error',
      status: 'proven',
      candidate: 'f.yaml',
      message: 'CallAPI failed',
      pageId: 'ticket',
      source: 'pages/ticket.yaml:88',
      walks: ['walk-1', 'walk-2'],
      users: ['admin'],
      charters: [charters[0].goal, charters[1].goal],
    },
    {
      key: 'd',
      kind: 'dead-click',
      severity: 'warning',
      status: 'not-proven',
      reason: 'not-reproduced',
      message: 'Clicking help did nothing.',
      pageId: 'tickets',
      source: null,
      walks: ['walk-2'],
      users: ['member'],
      charters: [charters[1].goal],
    },
  ];
  const report = buildExploreReport({
    run: '20261004T120000Z-ab12cd',
    revisions: { pr: null, base: null, head: 'bbb', dirty: false },
    charters,
    scope: { pages: [{ pageId: 'ticket' }], appWide: [], uncompared: [], removedPages: [] },
    walked,
    findings,
    proof: { ms: 2000, live: false },
    candidates: { finding: ['f.yaml'], coverage: [], droppedExpectations: 0 },
    trace: null,
    startedAt: '2026-10-04T12:00:00.000Z',
    finishedAt: '2026-10-04T12:05:00.000Z',
    budgetMs: 1200000,
  });
  expect(report.charter).toBeNull();
  expect(report.charters).toEqual([
    { goal: charters[0].goal, pages: ['ticket'], roles: ['admin'], walks: 1 },
    { goal: charters[1].goal, pages: ['ticket', 'tickets'], roles: ['admin', 'member'], walks: 1 },
    { goal: charters[2].goal, pages: ['tickets'], roles: ['default'], walks: 0 },
  ]);
  expect(report.findings.proven.map((finding) => finding.key)).toEqual(['k']);
  expect(Object.keys(report.findings.notProven)).toEqual(['not-reproduced']);
  const lines = formatExploreReport({ report });
  expect(lines.slice(1, 5)).toEqual([
    'Charters  3, one run',
    '  1. Try edge input on the ticket form.  (ticket × admin; 1 walk)',
    '  2. Try error paths.  (ticket, tickets × admin, member; 1 walk)',
    '  3. Try the ticket list as a guest.  (tickets × default; 0 walks)',
  ]);
  const findingsAt = lines.findIndex((line) => line.startsWith('Findings'));
  expect(lines.slice(findingsAt, findingsAt + 7)).toEqual([
    'Findings  1 proven, 1 not proven',
    '  ERROR action-error  ticket  CallAPI failed  pages/ticket.yaml:88  (2 walks, admin)  → f.yaml',
    '      charter: Try edge input on the ticket form.',
    '      charter: Try error paths.',
    'Not proven, its journey did not fail with it twice: 1 finding',
    '  WARNING dead-click  tickets  Clicking help did nothing.    (1 walk, member)',
    '      charter: Try error paths.',
  ]);
  expect(lines).toContain(
    'Not run   tickets × guest (charter 3): budget   invoices: no charter walks it'
  );
});
