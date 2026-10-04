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

import confirmFinding from './confirmFinding.js';

const run = '20261004T120000Z-ab12cd';
const target = { pageId: 'ticket', user: 'member', roles: ['member'], matrixListed: false };
const options = { data: 'staging', liveData: false, allowExternal: [] };
const finding = {
  kind: 'action-error',
  severity: 'error',
  key: 'action-error|ticket|pages/ticket.yaml:88',
  step: 1,
};
const log = {
  walk: 'walk-3',
  steps: [
    { index: 0, step: { fill: { blockId: 'title', value: 'Explorer title 0' } } },
    { index: 1, step: { click: { blockId: 'assign_submit', text: 'Assign' } } },
    { index: 2, step: { click: { blockId: 'later' } } },
  ],
  findings: [finding],
};

function createClient({ stepFindings = [[], []], openFindings = [], stepStatus = 200 } = {}) {
  const queue = [...stepFindings];
  return {
    open: jest.fn(async () => ({
      status: 200,
      body: { walkId: 'replay-walk', observation: {}, findings: openFindings },
    })),
    step: jest.fn(async () => ({
      status: stepStatus,
      body: { result: { status: 'ok' }, findings: queue.shift() ?? [], observation: {} },
    })),
    close: jest.fn(async () => ({ status: 200 })),
  };
}

test('a finding the replay reproduces at its step is confirmed; the replay records nothing under its own walk id', async () => {
  const client = createClient({ stepFindings: [[], [finding]] });
  const result = await confirmFinding({ client, run, log, finding, target, options });
  expect(result).toEqual(
    expect.objectContaining({ status: 'confirmed', replay: 'walk-3-confirm' })
  );
  expect(client.open).toHaveBeenCalledWith(
    expect.objectContaining({
      walk: 'walk-3-confirm',
      record: false,
      run,
      user: 'member',
      data: 'staging',
    })
  );
  expect(client.step.mock.calls.map(([call]) => call.step)).toEqual([
    log.steps[0].step,
    log.steps[1].step,
  ]);
  expect(client.close).toHaveBeenCalledWith({ walkId: 'replay-walk' });
});

test('a finding the replay does not reproduce (an error that fires on alternate loads) is unconfirmed', async () => {
  const client = createClient({ stepFindings: [[], []] });
  const result = await confirmFinding({ client, run, log, finding, target, options });
  expect(result.status).toBe('unconfirmed');
  expect(client.step).toHaveBeenCalledTimes(2);
});

test('a replay that cannot take a recorded step leaves the finding unconfirmed and still closes', async () => {
  const client = createClient({ stepStatus: 400 });
  expect((await confirmFinding({ client, run, log, finding, target, options })).status).toBe(
    'unconfirmed'
  );
  expect(client.close).toHaveBeenCalledTimes(1);
});

test('a finding from the open is confirmed by opening again', async () => {
  const roleRefused = {
    kind: 'role-refused',
    severity: 'error',
    key: 'role-refused|ticket|message:1',
  };
  const client = createClient({ openFindings: [roleRefused] });
  const result = await confirmFinding({
    client,
    run,
    log: { walk: 'walk-1', steps: [], findings: [roleRefused] },
    finding: roleRefused,
    target,
    options,
  });
  expect(result.status).toBe('confirmed');
  expect(client.step).not.toHaveBeenCalled();
});
