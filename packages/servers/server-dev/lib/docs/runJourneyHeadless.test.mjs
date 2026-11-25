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

import { vi, beforeEach, expect, test } from 'vitest';

const mockRunHeadlessJourney = vi.fn();
vi.doMock('@lowdefy/journey-headless', () => ({ runHeadlessJourney: mockRunHeadlessJourney }));
const mockCreateDevServerHost = vi.fn(async () => ({ host: true }));
vi.doMock('./createDevServerHost.js', () => ({ default: mockCreateDevServerHost }));
const mockResolveJourneyDataSet = vi.fn();
vi.doMock('./dataSets/resolveJourneyDataSet.js', () => ({ default: mockResolveJourneyDataSet }));
vi.doMock('./readDevAuthMode.js', () => ({
  default: () => ({ authConfigured: false, mockUserActive: false }),
}));
const mockBuildPageIfNeeded = vi.fn(async () => ({}));
vi.doMock('../server/jitPageBuilder.js', () => ({ default: mockBuildPageIfNeeded }));
vi.doMock('./readBuildArtifact.js', () => ({
  default: ({ name }) =>
    name === 'routes.json' ? [{ pageId: 'form' }, { pageId: 'other' }] : null,
}));
// The plugin connection map lives in a running server's build directory.
vi.doMock('./readConnectionPlugins.js', () => ({
  default: async () => ({ AxiosHttp: { requests: { AxiosHttp: async () => null } } }),
}));
const mockOpenDataSession = vi.fn();
vi.doMock('@lowdefy/test-utils/dataSets', async (importOriginal) => ({
  ...(await importOriginal()),
  getDataStore: vi.fn(async () => ({})),
  openDataSession: mockOpenDataSession,
}));
vi.doMock('./collectExercised.js', () => ({
  default: async ({ snapshots, observed }) => ({ snapshots, events: observed.events }),
}));

const { default: runJourneyHeadless } = await import('./runJourneyHeadless.js');

const readConfigFile = async () => ({});
const origin = 'http://localhost:3227';

beforeEach(() => {
  mockRunHeadlessJourney.mockReset();
  mockCreateDevServerHost.mockClear();
  mockResolveJourneyDataSet.mockReset();
  mockResolveJourneyDataSet.mockResolvedValue({ user: { roles: ['admin'] } });
});

test('runJourneyHeadless answers browserOnly for a journey that needs a browser, before loading any data', async () => {
  const result = await runJourneyHeadless({
    origin,
    pageId: 'form',
    steps: [{ click: 'save' }, { screenshot: 'after' }],
    readConfigFile,
  });
  expect(result).toEqual({
    pageId: 'form',
    browserOnly: {
      index: 1,
      step: { screenshot: 'after' },
      reason: 'step "screenshot" needs a browser',
    },
    steps: [],
  });
  expect(mockResolveJourneyDataSet).not.toHaveBeenCalled();
  expect(mockRunHeadlessJourney).not.toHaveBeenCalled();
});

test('runJourneyHeadless refuses a journey with no pageId and a step that needs a page', async () => {
  expect(await runJourneyHeadless({ origin, steps: [{ click: 'save' }], readConfigFile })).toEqual({
    error:
      'runJourney requires a "pageId" string: step 0 (click) needs a page. Received undefined.',
    refused: true,
  });
});

test('runJourneyHeadless runs on the dev host and answers in the browser runner shape, with what it exercised', async () => {
  mockRunHeadlessJourney.mockImplementation(async ({ onTrace }) => {
    onTrace({
      scope: 'page',
      pageId: 'form',
      blockId: 'save',
      eventName: 'onClick',
      actions: [{ id: 'save_request' }],
    });
    return { pageId: 'form', passed: true, steps: [{ index: 0, status: 'ok' }], state: { a: 1 } };
  });
  const result = await runJourneyHeadless({
    origin,
    pageId: 'form',
    steps: [{ click: 'save' }],
    state: true,
    readConfigFile,
    by: 'test',
  });
  expect(mockCreateDevServerHost).toHaveBeenCalledWith(
    expect.objectContaining({ origin, user: { roles: ['admin'] }, session: undefined })
  );
  expect(mockRunHeadlessJourney).toHaveBeenCalledWith(
    expect.objectContaining({
      host: { host: true },
      journey: expect.objectContaining({ pageId: 'form', steps: [{ click: 'save' }] }),
      stepTimeout: 5000,
    })
  );
  expect(result).toEqual({
    pageId: 'form',
    passed: true,
    steps: [{ index: 0, status: 'ok' }],
    screenshots: [],
    state: { a: 1 },
    exercised: {
      snapshots: [expect.objectContaining({ pagePaths: [] })],
      events: [
        {
          scope: 'page',
          pageId: 'form',
          blockId: 'save',
          eventName: 'onClick',
          actionIds: ['save_request'],
        },
      ],
    },
    calls: [],
    headless: true,
  });
});

test('runJourneyHeadless keeps detached on a detached call it records, so variants can leave it out', async () => {
  mockRunHeadlessJourney.mockResolvedValueOnce({
    pageId: 'form',
    passed: true,
    steps: [],
    state: {},
    calls: [
      {
        actor: 'main',
        kind: 'endpoint',
        pageId: 'form',
        endpointId: 'save',
        payload: { _id: 'a' },
        status: 200,
        success: true,
        response: { ok: true },
      },
      {
        actor: 'main',
        kind: 'endpoint',
        endpointId: 'notify',
        detached: true,
        payload: { _id: 'a' },
        status: null,
        success: null,
        response: null,
        error: null,
      },
    ],
  });
  const result = await runJourneyHeadless({
    origin,
    pageId: 'form',
    steps: [{ click: 'save' }],
    readConfigFile,
  });
  expect(result.calls).toEqual([
    {
      actor: 'main',
      kind: 'endpoint',
      pageId: 'form',
      endpointId: 'save',
      payload: { _id: 'a' },
      status: 200,
      success: true,
    },
    {
      actor: 'main',
      kind: 'endpoint',
      endpointId: 'notify',
      payload: { _id: 'a' },
      status: null,
      success: null,
      detached: true,
    },
  ]);
});

test('runJourneyHeadless answers a failure, and a browser-only step the runner reached', async () => {
  mockRunHeadlessJourney.mockResolvedValueOnce({
    pageId: 'form',
    passed: false,
    steps: [],
    state: {},
    failure: { index: 0, message: 'Block "save" is not visible.' },
  });
  const failed = await runJourneyHeadless({
    origin,
    pageId: 'form',
    steps: [{ click: 'save' }],
    readConfigFile,
  });
  expect(failed.passed).toBe(false);
  expect(failed.failure).toEqual({ index: 0, message: 'Block "save" is not visible.' });
  mockRunHeadlessJourney.mockResolvedValueOnce({
    pageId: 'form',
    browserOnly: { index: 0, step: { click: 'save' }, reason: 'DownloadFile needs the browser.' },
    steps: [{ index: 0, status: 'browser-only' }],
  });
  const browserOnly = await runJourneyHeadless({
    origin,
    pageId: 'form',
    steps: [{ click: 'save' }],
    readConfigFile,
  });
  expect(browserOnly).toEqual({
    pageId: 'form',
    browserOnly: { index: 0, step: { click: 'save' }, reason: 'DownloadFile needs the browser.' },
    steps: [{ index: 0, status: 'browser-only' }],
  });
});

test('runJourneyHeadless builds the pages the journey names before it runs, as the page route would', async () => {
  mockBuildPageIfNeeded.mockClear();
  mockRunHeadlessJourney.mockResolvedValue({ pageId: 'form', passed: true, steps: [], state: {} });
  await runJourneyHeadless({
    origin,
    pageId: 'form',
    steps: [
      { request: { pageId: 'other', requestId: 'load' } },
      { expect: { status: 200 } },
      { goto: 'missing' },
    ],
    readConfigFile,
  });
  expect(mockBuildPageIfNeeded.mock.calls.map(([args]) => args.pageId)).toEqual(['form', 'other']);
});

test('runJourneyHeadless refuses an answer stub on a connection type the app does not have, before the data set loads', async () => {
  mockResolveJourneyDataSet.mockResolvedValue({ dataSet: { name: 'stubs' }, user: 'finance' });
  const result = await runJourneyHeadless({
    origin,
    data: 'stubs',
    steps: [{ call: { endpoint: 'price_run' } }],
    stubs: [{ connectionType: 'Knex', requestType: 'KnexRaw', answer: [] }],
    readConfigFile,
  });
  expect(result).toEqual({
    error:
      'Journey "stubs[0]": Connection type "Knex" is not used by this app. Its connection types are "AxiosHttp".',
    refused: true,
  });
  expect(mockOpenDataSession).not.toHaveBeenCalled();
  expect(mockRunHeadlessJourney).not.toHaveBeenCalled();
});

test('runJourneyHeadless refuses hold and expect.sunk on a journey with no data set, as lowdefy test does', async () => {
  expect(
    await runJourneyHeadless({
      origin,
      steps: [{ hold: { requestId: 'claim_run' } }, { call: { endpoint: 'approve_run' } }],
      readConfigFile,
    })
  ).toEqual({
    error:
      'Step 0: "hold" needs a data set: its gate lives on the journey\'s data session. Give the journey a "data".',
    refused: true,
  });
  expect(
    await runJourneyHeadless({
      origin,
      steps: [{ call: { endpoint: 'price_run' } }],
      stubs: [{ requestId: 'save_price', fail: 'Down' }],
      readConfigFile,
    })
  ).toEqual({
    error:
      'Journey "stubs" need a data set: stubs and forced failures live on the journey\'s data session. Give the journey a "data".',
    refused: true,
  });
  expect(mockResolveJourneyDataSet).not.toHaveBeenCalled();
  expect(mockRunHeadlessJourney).not.toHaveBeenCalled();
});

// The user "none" refusal on a data set guards a run that signs in through a page: a journey with
// no pageId opens none, so it asks for no refusal.
test('runJourneyHeadless tells resolveJourneyDataSet whether the journey opens a page', async () => {
  mockRunHeadlessJourney.mockResolvedValue({ pageId: null, passed: true, steps: [] });
  mockResolveJourneyDataSet.mockResolvedValue({ user: 'none' });
  await runJourneyHeadless({
    origin,
    user: 'none',
    steps: [{ webhook: { endpoint: 'events', body: {} } }, { expect: { status: 200 } }],
    readConfigFile,
  });
  await runJourneyHeadless({
    origin,
    pageId: 'form',
    user: 'none',
    steps: [{ click: 'save' }],
    readConfigFile,
  });
  expect(mockResolveJourneyDataSet.mock.calls.map(([args]) => args.opensPage)).toEqual([
    false,
    true,
  ]);
});
