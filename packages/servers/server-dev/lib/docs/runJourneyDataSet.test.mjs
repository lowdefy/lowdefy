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
import { buildPagePath } from '@lowdefy/helpers';

const mockOpenPage = jest.fn();
const mockGetBrowser = jest.fn();
jest.unstable_mockModule('./getBrowser.js', () => ({
  getBrowser: mockGetBrowser,
  openPage: mockOpenPage,
  buildPageUrl: ({ origin, pageId, path, pathParams }) =>
    `${origin}/${buildPagePath({ pageId, path, pathParams })}`,
}));
// The route table the skeleton build writes; a page it does not hold has no pattern.
const mockReadPagePath = jest.fn(() => undefined);
jest.unstable_mockModule('./readPagePath.js', () => ({ default: mockReadPagePath }));
const mockResolveJourneyDataSet = jest.fn();
jest.unstable_mockModule('./dataSets/resolveJourneyDataSet.js', () => ({
  default: mockResolveJourneyDataSet,
}));
const mockOpenDataSession = jest.fn();
jest.unstable_mockModule('./dataSets/openDataSession.js', () => ({
  default: mockOpenDataSession,
}));
const mockGetDataStore = jest.fn();
jest.unstable_mockModule('./dataSets/getDataStore.js', () => ({ default: mockGetDataStore }));
jest.unstable_mockModule('./readDevAuthMode.js', () => ({
  default: () => ({ authConfigured: true, mockUserActive: false }),
}));
jest.unstable_mockModule('./collectExercised.js', () => ({ default: async () => ({}) }));

jest.unstable_mockModule('./observe/waitForClientErrorReports.js', () => ({
  default: async () => {},
}));

const { default: runJourney } = await import('./runJourney.js');

const origin = 'http://localhost:3227';
const dataSet = {
  name: 'sample',
  fixtures: { tickets: [{ _id: 't1' }, { _id: 't2' }], companies: [{ _id: 'c1' }] },
  users: { outsider: { id: 'u_9', roles: ['admin'], organizationId: 'org_b' } },
  warnings: ['Connections "a" and "b" both name collection "events" in different databases.'],
};

let order;
let close;

function createPage() {
  globalThis.window = {
    lowdefy: {
      pageId: 'tickets',
      contexts: {
        'page:tickets': {
          state: {},
          requests: {},
          websockets: {},
          _internal: { onInitDone: true, onInitAsyncDone: true, RootSlots: { map: {} } },
        },
      },
    },
  };
  return {
    evaluate: jest.fn(async (fn, arg) => fn(arg)),
    waitForFunction: jest.fn(async () => {}),
    waitForTimeout: jest.fn(async () => {}),
    url: () => `${origin}/tickets`,
    isClosed: () => false,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  order = [];
  close = jest.fn(async () => {
    order.push('session.close');
  });
  mockGetBrowser.mockResolvedValue({});
  mockGetDataStore.mockResolvedValue({ client: {}, uri: 'mongodb://memory/' });
  mockOpenDataSession.mockResolvedValue({ id: 'session1', cookie: 'session1', close });
  mockResolveJourneyDataSet.mockResolvedValue({ dataSet, user: { id: 'u_1', roles: ['admin'] } });
  mockOpenPage.mockImplementation(async () => ({
    context: {
      close: jest.fn(async () => {
        order.push('context.close');
      }),
    },
    page: createPage(),
    ready: true,
    leftOrigin: [],
  }));
});

test('runJourney refuses a data set problem before any browser opens', async () => {
  mockResolveJourneyDataSet.mockResolvedValue({ error: 'Data set "x" declares no user "y".' });
  const result = await runJourney({
    origin,
    pageId: 'tickets',
    steps: [],
    data: 'x',
    user: 'y',
  });
  expect(result).toEqual({ error: 'Data set "x" declares no user "y".', refused: true });
  expect(mockGetBrowser).not.toHaveBeenCalled();
  expect(mockOpenDataSession).not.toHaveBeenCalled();
});

test('runJourney passes data, user and the auth mode to the data set resolver', async () => {
  await runJourney({ origin, pageId: 'tickets', steps: [], data: 'sample', user: 'owner' });
  expect(mockResolveJourneyDataSet).toHaveBeenCalledWith(
    expect.objectContaining({
      data: 'sample',
      user: 'owner',
      authConfigured: true,
      mockUserActive: false,
    })
  );
});

test('runJourney opens a data session, gives every actor its cookie and data set users, and carries data and warnings', async () => {
  const result = await runJourney({
    origin,
    pageId: 'tickets',
    steps: [{ as: 'outsider' }],
    data: 'sample',
    user: 'owner',
  });
  expect(mockOpenDataSession).toHaveBeenCalledWith({ dataSet });
  expect(mockOpenPage.mock.calls.map(([options]) => [options.user, options.dataCookie])).toEqual([
    [{ id: 'u_1', roles: ['admin'] }, 'session1'],
    [dataSet.users.outsider, 'session1'],
  ]);
  expect(result.passed).toBe(true);
  expect(result.data).toEqual({
    name: 'sample',
    loadMs: expect.any(Number),
    documents: 3,
  });
  expect(result.warnings).toEqual(dataSet.warnings);
});

test('runJourney closes the data session after every actor, even when a step throws', async () => {
  mockOpenPage
    .mockImplementationOnce(async () => ({
      context: {
        close: jest.fn(async () => {
          order.push('context.close');
        }),
      },
      page: createPage(),
      ready: true,
      leftOrigin: [],
    }))
    .mockImplementationOnce(async () => {
      throw new Error('browser crashed');
    });
  const result = await runJourney({
    origin,
    pageId: 'tickets',
    steps: [{ as: 'outsider' }],
    data: 'sample',
  });
  expect(result.passed).toBe(false);
  expect(order).toEqual(['context.close', 'session.close']);
});

test('runJourney closes the data session when the journey errors out', async () => {
  mockOpenPage.mockRejectedValue(new Error('navigation failed'));
  const result = await runJourney({ origin, pageId: 'tickets', steps: [], data: 'sample' });
  expect(result.error).toMatch('navigation failed');
  expect(close).toHaveBeenCalledTimes(1);
});

test('runJourney refuses a data set that fails to load, with no browser context opened', async () => {
  mockOpenDataSession.mockRejectedValue(
    new Error('Data set "staging-sample" fixture tickets[0] breaks unique index "number_1".')
  );
  const result = await runJourney({ origin, pageId: 'tickets', steps: [], data: 'sample' });
  expect(result).toEqual({
    error: 'Data set "staging-sample" fixture tickets[0] breaks unique index "number_1".',
    refused: true,
  });
  expect(mockOpenPage).not.toHaveBeenCalled();
});

test('runJourney reports a data store that cannot start as a run error, not a refusal', async () => {
  mockGetDataStore.mockRejectedValue(new Error('download failed'));
  const result = await runJourney({ origin, pageId: 'tickets', steps: [], data: 'sample' });
  expect(result).toEqual({ error: 'Could not start the journey data store: download failed' });
});

test('runJourney opens no data session for a journey without data', async () => {
  mockResolveJourneyDataSet.mockResolvedValue({ user: undefined });
  const result = await runJourney({ origin, pageId: 'tickets', steps: [] });
  expect(mockOpenDataSession).not.toHaveBeenCalled();
  expect(mockOpenPage.mock.calls[0][0].dataCookie).toBeUndefined();
  expect(result.data).toBeUndefined();
});

test('runJourney fails the step that sent a data set journey to another host of the dev server', async () => {
  const leftOrigin = [];
  mockOpenPage
    .mockImplementationOnce(async () => ({
      context: { close: jest.fn(async () => {}) },
      page: createPage(),
      ready: true,
      leftOrigin: [],
    }))
    .mockImplementationOnce(async () => {
      leftOrigin.push('http://127.0.0.1:3227/api/page/tickets');
      return {
        context: { close: jest.fn(async () => {}) },
        page: createPage(),
        ready: true,
        leftOrigin,
      };
    });
  const result = await runJourney({
    origin,
    pageId: 'tickets',
    steps: [{ as: 'outsider' }, { as: 'main' }],
    data: 'sample',
  });
  expect(result.passed).toBe(false);
  expect(result.failure).toEqual({
    index: 0,
    step: { as: 'outsider' },
    expected: `every request to stay on ${origin}`,
    actual: 'http://127.0.0.1:3227/api/page/tickets',
    message: `Journey left its origin ${origin} for http://127.0.0.1:3227/api/page/tickets; a data set journey must stay on one host of the dev server.`,
  });
  expect(result.steps.map((step) => step.status)).toEqual(['failed', 'skipped']);
  expect(close).toHaveBeenCalledTimes(1);
});

test('runJourney opens the data session before it fetches the browser', async () => {
  mockOpenDataSession.mockImplementation(async () => {
    order.push('openDataSession');
    return { id: 'session1', cookie: 'session1', close };
  });
  mockGetBrowser.mockImplementation(async () => {
    order.push('getBrowser');
    return {};
  });
  await runJourney({ origin, pageId: 'tickets', steps: [], data: 'sample' });
  expect(order.slice(0, 2)).toEqual(['openDataSession', 'getBrowser']);
});

test('runJourney closes the data session when no browser can be fetched', async () => {
  mockGetBrowser.mockRejectedValue(new Error("Executable doesn't exist"));
  const result = await runJourney({ origin, pageId: 'tickets', steps: [], data: 'sample' });
  expect(result.error).toMatch(/No Chromium available/);
  expect(close).toHaveBeenCalledTimes(1);
  expect(mockOpenPage).not.toHaveBeenCalled();
});
