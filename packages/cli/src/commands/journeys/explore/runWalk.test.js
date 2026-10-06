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

import createSeededPolicy from './createSeededPolicy.js';
import createWalkProgress from './createWalkProgress.js';
import runWalk from './runWalk.js';

const run = '20261004T120000Z-ab12cd';
const knownText = { has: () => true, findIn: () => null };

function candidate(blockId, kind = 'click') {
  return {
    id: blockId,
    kind,
    target: { blockId },
    blockType: 'Button',
    blockIds: [blockId],
    label: blockId,
  };
}

function observation({ shape = 's1', blocks = ['save', 'cancel', 'next'], ...rest } = {}) {
  return {
    pageId: 'tickets',
    url: '/tickets',
    ready: true,
    shape,
    candidates: blocks.map((blockId) => candidate(blockId)),
    excluded: {},
    ...rest,
  };
}

function okStep({ findings = [], observation: next = observation(), status = 'ok' } = {}) {
  return {
    status: 200,
    body: { result: { status, durationMs: 40 }, findings, observation: next },
  };
}

function createClient({ open, steps = [] } = {}) {
  const queue = [...steps];
  return {
    open: jest.fn(
      async () =>
        open ?? {
          status: 200,
          body: {
            walkId: 'server-walk',
            observation: observation(),
            admitted: true,
            findings: [],
            timings: { dataMs: 5, pageMs: 30 },
          },
        }
    ),
    step: jest.fn(async () => queue.shift() ?? okStep()),
    close: jest.fn(async () => ({ status: 200, body: { closed: true } })),
  };
}

function walk({
  client,
  policy = createSeededPolicy(),
  steps = 3,
  shouldStop = () => null,
  scopePage,
  decisionContext = { title: 'Add ticket assignment', body: '' },
  charter,
}) {
  return runWalk({
    client,
    run,
    walkId: 'walk-1',
    walkIndex: 0,
    target: { pageId: 'tickets', user: 'member', roles: ['member'], matrixListed: false },
    scopePage: scopePage ?? { pageId: 'tickets', blocks: [], authChanged: false },
    options: { steps, data: 'staging', liveData: false, allowExternal: [] },
    policy,
    progress: createWalkProgress(),
    decisionContext,
    charter,
    knownTextFor: () => knownText,
    fixtures: {},
    shouldStop,
    costs: { add: jest.fn() },
  });
}

test('a walk stops at its step limit and closes', async () => {
  const client = createClient();
  const log = await walk({ client, steps: 3 });
  expect(log.stopReason).toBe('steps');
  expect(log.steps).toHaveLength(3);
  expect(client.open).toHaveBeenCalledWith({
    pageId: 'tickets',
    run,
    walk: 'walk-1',
    record: true,
    roles: ['member'],
    roleMatrixListed: false,
    user: 'member',
    data: 'staging',
  });
  expect(client.close).toHaveBeenCalledWith({ walkId: 'server-walk' });
  expect(log.open).toEqual(expect.objectContaining({ dataMs: 5, pageMs: 30, redirected: false }));
  expect(log.steps[0]).toEqual(
    expect.objectContaining({
      index: 0,
      startedAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
      shape: 's1',
      step: { click: expect.any(Object) },
      result: { status: 'ok', durationMs: 40 },
      durations: expect.objectContaining({ actMs: 40 }),
    })
  );
});

test('a charter walk sends the charter in the policy state, with no change on a head-only run', async () => {
  const states = [];
  const policy = {
    name: 'model',
    modelId: 'test/model',
    lowestRelevance: 'unrelated to the charter',
    choose: async ({ state, options }) => {
      states.push(state);
      return { asked: true, optionId: Object.keys(options)[0], relevance: 'serves the charter' };
    },
  };
  const log = await walk({
    client: createClient(),
    policy,
    steps: 2,
    decisionContext: null,
    charter: { goal: 'Try error paths on the ticket form.' },
  });
  expect(log.stopReason).toBe('steps');
  expect(states).toHaveLength(2);
  states.forEach((state) => {
    expect(state.charter).toEqual({ goal: 'Try error paths on the ticket form.' });
    expect(state.change).toBeUndefined();
  });
});

test('a walk is exhausted when no candidate is left after the within-walk rule', async () => {
  const client = createClient({ steps: [okStep(), okStep()] });
  // Two candidates on one unchanging shape: each is taken once, then nothing is left.
  client.open.mockResolvedValue({
    status: 200,
    body: {
      walkId: 'server-walk',
      observation: observation({ blocks: ['save', 'cancel'] }),
      admitted: true,
      findings: [],
    },
  });
  client.step.mockImplementation(async () =>
    okStep({ observation: observation({ blocks: ['save', 'cancel'] }) })
  );
  const log = await walk({ client, steps: 10 });
  expect(log.stopReason).toBe('exhausted');
  expect(log.steps).toHaveLength(2);
});

test('a model policy walk stops off-topic after the lowest relevance on two steps running', async () => {
  const client = createClient();
  let calls = 0;
  const policy = {
    name: 'model',
    modelId: 'test/model',
    lowestRelevance: 'unrelated to the change',
    choose: async ({ options }) => {
      calls += 1;
      return {
        asked: true,
        optionId: Object.keys(options)[0],
        relevance: calls === 1 ? null : 'unrelated to the change',
      };
    },
  };
  const log = await walk({ client, policy, steps: 10 });
  expect(log.stopReason).toBe('off-topic');
  expect(log.steps).toHaveLength(2);
});

test('an error finding stops the walk; a dead click is kept and the walk goes on', async () => {
  const deadClick = { kind: 'dead-click', severity: 'warning', key: 'dead' };
  const serverError = { kind: 'server-error', severity: 'error', key: 'boom' };
  const client = createClient({
    steps: [okStep({ findings: [deadClick] }), okStep({ findings: [serverError] })],
  });
  const log = await walk({ client, steps: 10 });
  expect(log.stopReason).toBe('finding');
  expect(log.steps).toHaveLength(2);
  expect(log.findings).toEqual([deadClick, serverError]);
});

test('a walk stops left-app when the page is no longer an app page', async () => {
  const client = createClient({
    steps: [okStep({ observation: { pageId: null, url: null, leftApp: true, candidates: [] } })],
  });
  const log = await walk({ client, steps: 10 });
  expect(log.stopReason).toBe('left-app');
  expect(log.steps).toHaveLength(1);
});

test('a step the runner reports failed stops the walk as step-failed, not as a finding', async () => {
  const client = createClient({ steps: [okStep({ status: 'failed' })] });
  const log = await walk({ client, steps: 10 });
  expect(log.stopReason).toBe('step-failed');
  expect(log.findings).toEqual([]);
});

test('a budget or cost stop ends the walk after the step in flight and still closes it', async () => {
  for (const reason of ['budget', 'cost']) {
    const client = createClient();
    let checks = 0;
    const log = await walk({
      client,
      steps: 10,
      shouldStop: () => {
        checks += 1;
        return checks > 1 ? reason : null;
      },
    });
    expect(log.stopReason).toBe(reason);
    expect(log.steps).toHaveLength(1);
    expect(client.close).toHaveBeenCalledTimes(1);
  }
});

test('a step that finds the walk gone (404) stops it as server-restarted', async () => {
  const client = createClient({ steps: [{ status: 404, body: { error: 'No open walk' } }] });
  const log = await walk({ client, steps: 10 });
  expect(log.stopReason).toBe('server-restarted');
});

test('a redirect at open is refused, or access-changed when the PR changed the page auth and the head refuses the role', async () => {
  const redirected = observation({ pageId: 'home', redirected: true });
  const refused = createClient({
    open: {
      status: 200,
      body: { walkId: 'w', observation: redirected, admitted: true, findings: [] },
    },
  });
  expect((await walk({ client: refused })).stopReason).toBe('refused');
  const changed = createClient({
    open: {
      status: 200,
      body: { walkId: 'w', observation: redirected, admitted: false, findings: [] },
    },
  });
  const log = await walk({
    client: changed,
    scopePage: { pageId: 'tickets', blocks: [], authChanged: true },
  });
  expect(log.stopReason).toBe('access-changed');
  expect(changed.step).not.toHaveBeenCalled();
  expect(changed.close).toHaveBeenCalledTimes(1);
});

test('a role-refused finding at open stops the walk as a finding', async () => {
  const finding = { kind: 'role-refused', severity: 'error', key: 'role' };
  const client = createClient({
    open: {
      status: 200,
      body: {
        walkId: 'w',
        observation: observation({ redirected: true }),
        admitted: true,
        findings: [finding],
      },
    },
  });
  const log = await walk({ client });
  expect(log.stopReason).toBe('finding');
  expect(log.findings).toEqual([finding]);
});

test('a walk the dev server refuses to open throws, so the run stops', async () => {
  const client = createClient({ open: { status: 400, body: { error: 'Name a data set' } } });
  await expect(walk({ client })).rejects.toThrow('Name a data set');
});

test('each model answer is added to the cost tracker', async () => {
  const client = createClient();
  const costs = { add: jest.fn() };
  const policy = {
    name: 'model',
    lowestRelevance: 'unrelated to the change',
    choose: async ({ options }) => ({
      asked: true,
      optionId: Object.keys(options)[0],
      relevance: 'exercises the change',
      cost: { usd: 0.001, estimated: false },
    }),
  };
  await runWalk({
    client,
    run,
    walkId: 'walk-1',
    walkIndex: 0,
    target: { pageId: 'tickets', user: null, roles: [], matrixListed: false },
    scopePage: { pageId: 'tickets', blocks: [], authChanged: false },
    options: { steps: 2, data: null, liveData: false, allowExternal: [] },
    policy,
    progress: createWalkProgress(),
    decisionContext: { title: null, body: '' },
    knownTextFor: () => knownText,
    fixtures: {},
    shouldStop: () => null,
    costs,
  });
  expect(costs.add).toHaveBeenCalledTimes(2);
  expect(client.open.mock.calls[0][0].user).toBeUndefined();
});
