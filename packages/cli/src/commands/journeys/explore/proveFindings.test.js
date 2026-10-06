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

const mockRunJourney = jest.fn();
jest.unstable_mockModule('../../test/runJourney.js', () => ({ default: mockRunJourney }));

const { default: proveFindings } = await import('./proveFindings.js');

const context = { directories: { config: '/app' } };
const url = 'http://localhost:3110';
let directory;

const serverError = {
  key: 'server-error|ticket|pages/ticket.yaml:12',
  kind: 'server-error',
  severity: 'error',
};
const deadClick = { key: 'dead-click|ticket|abc', kind: 'dead-click', severity: 'warning' };
const roleRefused = { key: 'role-refused|ticket|def', kind: 'role-refused', severity: 'error' };
const environment = { key: 'environment|ticket|x', kind: 'environment', severity: 'info' };

function writeCandidate(name, steps) {
  const filePath = path.join(directory, `${name}.yaml`);
  fs.writeFileSync(filePath, YAML.stringify({ name, pageId: 'ticket', data: 'staging', steps }));
  return filePath;
}

function appErrorFailure({ key, kind = 'server-error', phase }) {
  const failure = {
    kind: 'app-error',
    message: 'Step caused an app error',
    errors: [{ kind, message: 'boom', source: 'pages/ticket.yaml:12', configKey: null, key }],
  };
  if (phase === 'open') return { phase: 'open', ...failure };
  return { index: 0, step: { click: 'save' }, ...failure };
}

beforeEach(() => {
  directory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-explore-prove-'));
});

afterEach(() => {
  fs.rmSync(directory, { recursive: true, force: true });
  jest.clearAllMocks();
});

test('an app error is proven when both runs fail with its key at a step, run in process against the walk server', async () => {
  const filePath = writeCandidate('error', [{ click: 'save' }]);
  mockRunJourney.mockResolvedValue({
    passed: false,
    failure: appErrorFailure({ key: serverError.key }),
  });
  const proof = await proveFindings({
    context,
    url,
    findings: [serverError],
    candidates: { finding: [{ key: serverError.key, path: filePath }], notCompiled: [] },
    live: false,
  });
  expect(proof.proven).toEqual([{ key: serverError.key, path: filePath }]);
  expect(proof.notProven).toEqual([]);
  expect(typeof proof.ms).toBe('number');
  expect(mockRunJourney).toHaveBeenCalledTimes(2);
  expect(mockRunJourney).toHaveBeenCalledWith({
    context,
    item: { filePath, journey: expect.objectContaining({ name: 'error', data: 'staging' }) },
    url,
  });
});

test('an app error at phase open proves its key', async () => {
  const filePath = writeCandidate('open', [{ expect: { visible: 'ticket' } }]);
  mockRunJourney.mockResolvedValue({
    passed: false,
    failure: appErrorFailure({ key: serverError.key, phase: 'open' }),
  });
  const proof = await proveFindings({
    context,
    url,
    findings: [serverError],
    candidates: { finding: [{ key: serverError.key, path: filePath }], notCompiled: [] },
    live: false,
  });
  expect(proof.proven.map((entry) => entry.key)).toEqual([serverError.key]);
});

test('a finding whose journey fails with it on only one of two runs is not-reproduced', async () => {
  const filePath = writeCandidate('flaky', [{ click: 'save' }]);
  mockRunJourney
    .mockResolvedValueOnce({ passed: false, failure: appErrorFailure({ key: serverError.key }) })
    .mockResolvedValueOnce({ passed: true });
  const proof = await proveFindings({
    context,
    url,
    findings: [serverError],
    candidates: { finding: [{ key: serverError.key, path: filePath }], notCompiled: [] },
    live: false,
  });
  expect(proof.proven).toEqual([]);
  expect(proof.notProven).toEqual([{ key: serverError.key, reason: 'not-reproduced' }]);
});

test('a failure with a different key is not-reproduced, and the second run is skipped', async () => {
  const filePath = writeCandidate('other', [{ click: 'save' }]);
  mockRunJourney.mockResolvedValue({
    passed: false,
    failure: appErrorFailure({ key: 'server-error|ticket|pages/ticket.yaml:99' }),
  });
  const proof = await proveFindings({
    context,
    url,
    findings: [serverError],
    candidates: { finding: [{ key: serverError.key, path: filePath }], notCompiled: [] },
    live: false,
  });
  expect(proof.notProven).toEqual([{ key: serverError.key, reason: 'not-reproduced' }]);
  expect(mockRunJourney).toHaveBeenCalledTimes(1);
});

test('a proof run that fails on an environment error gives environment', async () => {
  const filePath = writeCandidate('search', [{ click: 'search' }]);
  mockRunJourney.mockResolvedValue({
    passed: false,
    failure: appErrorFailure({
      key: 'environment|ticket|pages/ticket.yaml:12',
      kind: 'environment',
    }),
  });
  const proof = await proveFindings({
    context,
    url,
    findings: [serverError],
    candidates: { finding: [{ key: serverError.key, path: filePath }], notCompiled: [] },
    live: false,
  });
  expect(proof.notProven).toEqual([{ key: serverError.key, reason: 'environment' }]);
});

test('a dead click is proven by a failure at its final expect.effect step, not by an earlier failure', async () => {
  const steps = [{ click: 'help' }, { expect: { effect: true } }];
  const provenPath = writeCandidate('dead', steps);
  const earlierPath = writeCandidate('dead-earlier', steps);
  const atEffect = { index: 1, step: { expect: { effect: true } }, message: 'no effect' };
  const atClick = { index: 0, step: { click: 'help' }, message: 'not actionable' };
  mockRunJourney.mockImplementation(async ({ item }) => ({
    passed: false,
    failure: item.filePath === provenPath ? atEffect : atClick,
  }));
  const otherDeadClick = { ...deadClick, key: 'dead-click|ticket|other' };
  const proof = await proveFindings({
    context,
    url,
    findings: [deadClick, otherDeadClick],
    candidates: {
      finding: [
        { key: deadClick.key, path: provenPath },
        { key: otherDeadClick.key, path: earlierPath },
      ],
      notCompiled: [],
    },
    live: false,
  });
  expect(proof.proven).toEqual([{ key: deadClick.key, path: provenPath }]);
  expect(proof.notProven).toEqual([{ key: otherDeadClick.key, reason: 'not-reproduced' }]);
});

test('a role refusal is proven by its page root expectation failing, not by passing', async () => {
  const filePath = writeCandidate('refused', [{ expect: { visible: 'ticket' } }]);
  mockRunJourney.mockResolvedValue({
    passed: false,
    failure: {
      index: 0,
      step: { expect: { visible: 'ticket' } },
      message: 'Expected block "ticket" to be visible.',
    },
  });
  const proof = await proveFindings({
    context,
    url,
    findings: [roleRefused],
    candidates: { finding: [{ key: roleRefused.key, path: filePath }], notCompiled: [] },
    live: false,
  });
  expect(proof.proven.map((entry) => entry.key)).toEqual([roleRefused.key]);
});

test('a finding with no candidate is no-candidate and a walk environment finding is environment, with no runs', async () => {
  const proof = await proveFindings({
    context,
    url,
    findings: [deadClick, environment],
    candidates: { finding: [], notCompiled: [{ key: deadClick.key, reason: 'no-candidate' }] },
    live: false,
  });
  expect(proof.notProven).toEqual([
    { key: deadClick.key, reason: 'no-candidate' },
    { key: environment.key, reason: 'environment' },
  ]);
  expect(mockRunJourney).not.toHaveBeenCalled();
});

test('a run on live connections gives every finding live-writes and runs no journey', async () => {
  const filePath = writeCandidate('error', [{ click: 'save' }]);
  const proof = await proveFindings({
    context,
    url,
    findings: [serverError, deadClick],
    candidates: { finding: [{ key: serverError.key, path: filePath }], notCompiled: [] },
    live: true,
  });
  expect(proof.proven).toEqual([]);
  expect(proof.notProven).toEqual([
    { key: serverError.key, reason: 'live-writes' },
    { key: deadClick.key, reason: 'live-writes' },
  ]);
  expect(mockRunJourney).not.toHaveBeenCalled();
});
