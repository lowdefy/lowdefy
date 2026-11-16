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
