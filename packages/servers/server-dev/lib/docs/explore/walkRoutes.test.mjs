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

const mockGetBrowser = jest.fn();
const mockAcquireBrowserSlot = jest.fn();
const mockOpenJourney = jest.fn();
const mockOpenDataSession = jest.fn();
const mockIsWriteRequestsAllowed = jest.fn();
const mockReadConnectionArtifacts = jest.fn();
const mockObserveWalkPage = jest.fn();
const mockRunObservedStep = jest.fn();

jest.unstable_mockModule('../getBrowser.js', () => ({ getBrowser: mockGetBrowser }));
jest.unstable_mockModule('../acquireBrowserSlot.js', () => ({
  default: mockAcquireBrowserSlot,
}));
jest.unstable_mockModule('../openJourney.js', () => ({ default: mockOpenJourney }));
jest.unstable_mockModule('../dataSets/getDataStore.js', () => ({ default: async () => ({}) }));
jest.unstable_mockModule('../dataSets/openDataSession.js', () => ({
  default: mockOpenDataSession,
}));
jest.unstable_mockModule('../readDevAuthMode.js', () => ({
  default: () => ({ authConfigured: false, mockUserActive: false }),
}));
jest.unstable_mockModule('../isWriteRequestsAllowed.js', () => ({
  default: mockIsWriteRequestsAllowed,
}));
jest.unstable_mockModule('../dataSets/readConnectionArtifacts.js', () => ({
  default: mockReadConnectionArtifacts,
}));
jest.unstable_mockModule('../dataSets/resolveJourneyDataSet.js', () => ({
  default: async ({ data, user }) =>
    data === undefined
      ? { user }
      : { dataSet: { name: data, users: { member: { id: 'u_1' } }, fixtures: {} }, user },
}));
jest.unstable_mockModule('./observeWalkPage.js', () => ({ default: mockObserveWalkPage }));
jest.unstable_mockModule('./runObservedStep.js', () => ({ default: mockRunObservedStep }));
jest.unstable_mockModule('./saveWalkScreenshot.js', () => ({
  default: async ({ walk, index }) =>
    `.lowdefy/explore/${walk.run}/screenshots/${walk.journey}-${index}.png`,
}));

const { default: openWalk } = await import('./openWalk.js');
const { default: stepWalk } = await import('./stepWalk.js');
const { default: closeWalk } = await import('./closeWalk.js');
const { getWalk, listWalks } = await import('./walkSessions.js');

const run = '20261004T101500Z-ab12cd';
const origin = 'http://localhost:3111';
const observation = {
  pageId: 'home',
  url: '/home',
  ready: true,
  shape: '3fa1c09e',
  candidates: [
    {
      id: 'c0',
      kind: 'click',
      target: { blockId: 'save_button', text: 'Save' },
      blockIds: ['save_button'],
    },
    { id: 'c1', kind: 'fill', target: { blockId: 'name_input' }, blockIds: ['name_input'] },
  ],
  excluded: {},
};

let actors;
let session;
let slot;

function quietWindow(overrides = {}) {
  return {
    since: 0,
    until: 1,
    urlBefore: 'http://localhost:3111/home',
    urlAfter: 'http://localhost:3111/home',
    emits: [{ blockId: 'save_button', eventName: 'onClick', success: true, failure: null }],
    mutationCount: 2,
    pageErrors: [],
    requests: [],
    responses: [],
    errors: [],
    ...overrides,
  };
}

function openBody(overrides = {}) {
  return {
    pageId: 'home',
    user: 'member',
    data: 'explore',
    run,
    walk: 'walk-1',
    record: true,
    ...overrides,
  };
}

beforeEach(() => {
  actors = {
    current: () => ({ page: {} }),
    flushRecordings: jest.fn(async () => {}),
    closeAll: jest.fn(async () => {}),
  };
  session = { cookie: 'session-cookie', close: jest.fn(async () => {}) };
  slot = { release: jest.fn() };
  mockGetBrowser.mockResolvedValue({});
  mockAcquireBrowserSlot.mockResolvedValue(slot);
  mockOpenDataSession.mockResolvedValue(session);
  mockOpenJourney.mockImplementation(async () => ({ journey: { actors } }));
  mockIsWriteRequestsAllowed.mockResolvedValue(false);
  mockReadConnectionArtifacts.mockResolvedValue({ fixture_db: { type: 'MongoDBCollection' } });
  mockObserveWalkPage.mockResolvedValue(observation);
  mockRunObservedStep.mockResolvedValue({
    result: { index: 0, status: 'ok', durationMs: 12 },
    window: quietWindow(),
  });
});

afterEach(async () => {
  await Promise.all(listWalks().map((walk) => closeWalk({ walkId: walk.walkId })));
  jest.clearAllMocks();
});

test('openWalk opens a recorded walk on a fresh data session and returns its first observation', async () => {
  const { status, body } = await openWalk({ body: openBody(), origin });
  expect(status).toBe(200);
  expect(body.observation).toEqual(observation);
  expect(mockOpenJourney).toHaveBeenCalledWith(
    expect.objectContaining({
      pageId: 'home',
      dataCookie: 'session-cookie',
      users: { member: { id: 'u_1' } },
      recording: { source: 'explorer', run: { id: run, by: 'explorer', journey: 'walk-1' } },
    })
  );
  expect(getWalk(body.walkId)).toEqual(expect.objectContaining({ run, journey: 'walk-1' }));
});

test('openWalk with record false marks the recording to record nothing, so the walk still claims its errors', async () => {
  await openWalk({ body: openBody({ record: false, walk: 'walk-1-confirm' }), origin });
  expect(mockOpenJourney.mock.calls[0][0].recording).toEqual({
    source: 'explorer',
    run: { id: run, by: 'explorer', journey: 'walk-1-confirm' },
    record: false,
  });
});

test('openWalk answers 409 for a third concurrent walk and for a walk of the run that is already open', async () => {
  expect((await openWalk({ body: openBody({ walk: 'walk-1' }), origin })).status).toBe(200);
  expect((await openWalk({ body: openBody({ walk: 'walk-1' }), origin })).status).toBe(409);
  expect((await openWalk({ body: openBody({ walk: 'walk-2' }), origin })).status).toBe(200);
  const third = await openWalk({ body: openBody({ walk: 'walk-3' }), origin });
  expect(third.status).toBe(409);
  expect(third.body.error).toMatch(/2 walks are already open/);
});

test("openWalk lets only two of three walks opened at once register, and frees the refused one's browser slot", async () => {
  const results = await Promise.all(
    ['walk-1', 'walk-2', 'walk-3'].map((walk) => openWalk({ body: openBody({ walk }), origin }))
  );
  expect(results.map((result) => result.status).sort()).toEqual([200, 200, 409]);
  expect(listWalks()).toHaveLength(2);
  expect(slot.release).toHaveBeenCalledTimes(1);
});

test('openWalk refuses a walk without data on an app with a MongoDBCollection connection unless live data is allowed', async () => {
  const refused = await openWalk({ body: openBody({ data: undefined, user: undefined }), origin });
  expect(refused.status).toBe(400);
  expect(refused.body.error).toMatch(/Name a data set/);
  expect(refused.body.error).toMatch(/cli\.agentTools\.allowWriteRequests: true/);

  const notOptedIn = await openWalk({
    body: openBody({ data: undefined, user: undefined, liveData: true }),
    origin,
  });
  expect(notOptedIn.status).toBe(400);
  expect(notOptedIn.body.error).toMatch(/allowWriteRequests/);

  mockIsWriteRequestsAllowed.mockResolvedValue(true);
  const allowed = await openWalk({
    body: openBody({ data: undefined, user: undefined, liveData: true }),
    origin,
  });
  expect(allowed.status).toBe(200);
  expect(mockOpenJourney.mock.calls[0][0].dataCookie).toBeUndefined();
  expect(mockGetBrowser).toHaveBeenCalledTimes(1);
});

test('openWalk opens without a data set on an app with no MongoDBCollection connection', async () => {
  mockReadConnectionArtifacts.mockResolvedValue({ api: { type: 'AxiosHttp' } });
  const { status } = await openWalk({
    body: openBody({ data: undefined, user: undefined }),
    origin,
  });
  expect(status).toBe(200);
});

test('openWalk refuses a non-empty allowExternal unless the app opted in to write requests', async () => {
  const refused = await openWalk({ body: openBody({ allowExternal: ['mailer'] }), origin });
  expect(refused.status).toBe(400);
  expect(refused.body.error).toMatch(/reaching mailer need cli\.agentTools\.allowWriteRequests/);
  expect(mockGetBrowser).not.toHaveBeenCalled();
  mockIsWriteRequestsAllowed.mockResolvedValue(true);
  expect((await openWalk({ body: openBody({ allowExternal: ['mailer'] }), origin })).status).toBe(
    200
  );
});

test('openWalk answers 400 for a malformed body before anything opens', async () => {
  expect((await openWalk({ body: openBody({ run: 'nope' }), origin })).status).toBe(400);
  expect((await openWalk({ body: openBody({ record: 'yes' }), origin })).status).toBe(400);
  expect((await openWalk({ body: null, origin })).status).toBe(400);
  expect(mockGetBrowser).not.toHaveBeenCalled();
});

test('openWalk closes the data session and frees the slot when the page fails to open', async () => {
  mockOpenJourney.mockRejectedValue(new Error('Navigation timeout'));
  const { status, body } = await openWalk({ body: openBody(), origin });
  expect(status).toBe(502);
  expect(body.error).toMatch(/Navigation timeout/);
  expect(session.close).toHaveBeenCalledTimes(1);
  expect(slot.release).toHaveBeenCalledTimes(1);
  expect(listWalks()).toEqual([]);
});

test('stepWalk runs an offered step through the runner and returns the result and the new observation', async () => {
  const { body: opened } = await openWalk({ body: openBody(), origin });
  const next = { ...observation, shape: 'aaaa0000' };
  mockObserveWalkPage.mockResolvedValue(next);
  const step = { fill: { blockId: 'name_input', value: 'Explorer name 0' } };
  const { status, body } = await stepWalk({ walkId: opened.walkId, body: { step } });
  expect(status).toBe(200);
  expect(body).toEqual({
    result: { status: 'ok', durationMs: 12 },
    findings: [],
    observation: next,
  });
  expect(mockRunObservedStep).toHaveBeenCalledWith({
    walk: expect.objectContaining({ walkId: opened.walkId }),
    step,
  });
  expect(getWalk(opened.walkId).typed).toEqual(['Explorer name 0']);
});

test('stepWalk refuses a step that matches no offered candidate, as one sent with curl', async () => {
  const { body: opened } = await openWalk({ body: openBody(), origin });
  const { status, body } = await stepWalk({
    walkId: opened.walkId,
    body: { step: { click: { blockId: 'send_invite' } } },
  });
  expect(status).toBe(400);
  expect(body.error).toMatch(/matches no control the walk offered/);
  expect(mockRunObservedStep).not.toHaveBeenCalled();
  const malformed = await stepWalk({ walkId: opened.walkId, body: { step: { goto: 'x' } } });
  expect(malformed.status).toBe(400);
});

test('stepWalk reports a failed step with its failure', async () => {
  const { body: opened } = await openWalk({ body: openBody(), origin });
  const failure = { index: 0, message: 'Timeout waiting for save_button' };
  mockRunObservedStep.mockResolvedValue({
    result: { index: 0, status: 'failed', durationMs: 5000 },
    failure,
    window: quietWindow({ emits: [], mutationCount: 0 }),
  });
  const { body } = await stepWalk({
    walkId: opened.walkId,
    body: { step: { click: { text: 'Save', blockId: 'save_button' } } },
  });
  expect(body.result).toEqual({ status: 'failed', durationMs: 5000, failure });
});

test('stepWalk returns the findings of the step window with the step index, and a screenshot on an error finding', async () => {
  const { body: opened } = await openWalk({ body: openBody(), origin });
  mockRunObservedStep.mockResolvedValueOnce({
    result: { index: 0, status: 'ok', durationMs: 20 },
    window: quietWindow({ emits: [], mutationCount: 0 }),
  });
  const dead = await stepWalk({
    walkId: opened.walkId,
    body: { step: { click: { blockId: 'save_button', text: 'Save' } } },
  });
  expect(dead.body.findings).toEqual([
    expect.objectContaining({ kind: 'dead-click', severity: 'warning', pageId: 'home', step: 0 }),
  ]);
  expect(dead.body.screenshot).toBeUndefined();

  mockRunObservedStep.mockResolvedValueOnce({
    result: { index: 0, status: 'ok', durationMs: 20 },
    window: quietWindow({
      errors: [{ store: 'server', message: 'Boom', source: 'pages/home.yaml:12' }],
    }),
  });
  const failed = await stepWalk({
    walkId: opened.walkId,
    body: { step: { click: { blockId: 'save_button', text: 'Save' } } },
  });
  expect(failed.body.findings).toEqual([
    expect.objectContaining({
      kind: 'server-error',
      severity: 'error',
      source: 'pages/home.yaml:12',
      step: 1,
      key: 'server-error|home|pages/home.yaml:12',
    }),
  ]);
  expect(failed.body.screenshot).toBe(`.lowdefy/explore/${run}/screenshots/walk-1-1.png`);
});

test('closeWalk flushes the recorder, closes the actors and the data session and frees the slot; a step after it gets 404', async () => {
  const { body: opened } = await openWalk({ body: openBody(), origin });
  expect(await closeWalk({ walkId: opened.walkId })).toEqual({
    status: 200,
    body: { closed: true },
  });
  expect(actors.flushRecordings).toHaveBeenCalledTimes(1);
  expect(actors.closeAll).toHaveBeenCalledTimes(1);
  expect(session.close).toHaveBeenCalledTimes(1);
  expect(slot.release).toHaveBeenCalledTimes(1);
  expect(actors.flushRecordings.mock.invocationCallOrder[0]).toBeLessThan(
    actors.closeAll.mock.invocationCallOrder[0]
  );
  expect(actors.closeAll.mock.invocationCallOrder[0]).toBeLessThan(
    session.close.mock.invocationCallOrder[0]
  );
  const step = await stepWalk({
    walkId: opened.walkId,
    body: { step: { click: { blockId: 'save_button', text: 'Save' } } },
  });
  expect(step.status).toBe(404);
  expect((await closeWalk({ walkId: opened.walkId })).status).toBe(404);
});

test('closeWalk does not flush a walk that records nothing', async () => {
  const { body: opened } = await openWalk({ body: openBody({ record: false }), origin });
  await closeWalk({ walkId: opened.walkId });
  expect(actors.flushRecordings).not.toHaveBeenCalled();
  expect(actors.closeAll).toHaveBeenCalledTimes(1);
});

test('a walk idle past its idle time closes itself', async () => {
  const { body: opened } = await openWalk({ body: openBody(), origin, idleMs: 20 });
  await new Promise((resolve) => setTimeout(resolve, 80));
  expect(getWalk(opened.walkId)).toBe(null);
  expect(session.close).toHaveBeenCalledTimes(1);
  expect(slot.release).toHaveBeenCalledTimes(1);
});

test('a step keeps a walk from idling out while it runs, and restarts its idle time', async () => {
  const { body: opened } = await openWalk({ body: openBody(), origin, idleMs: 60 });
  mockRunObservedStep.mockImplementation(async () => {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return { result: { index: 0, status: 'ok', durationMs: 100 }, window: quietWindow() };
  });
  const { status } = await stepWalk({
    walkId: opened.walkId,
    body: { step: { click: { blockId: 'save_button', text: 'Save' } } },
    idleMs: 60,
  });
  expect(status).toBe(200);
  expect(getWalk(opened.walkId)).not.toBe(null);
});
