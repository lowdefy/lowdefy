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

// checkpointStore.js reads LOWDEFY_DIRECTORY_CONFIG for where to store
// checkpoints, and lib/build/config.js (imported transitively by
// loadState.js -> getBrowser.js) reads build/config.json from
// process.cwd() at import time — one fixture dir serves both, mirroring
// screenshotPage.test.mjs / configCheckpoints.test.mjs.
const originalCwd = process.cwd();
const previousConfigDirectory = process.env.LOWDEFY_DIRECTORY_CONFIG;
const fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-state-checkpoints-test-'));
fs.mkdirSync(path.join(fixtureDir, 'build'), { recursive: true });
fs.writeFileSync(path.join(fixtureDir, 'build', 'config.json'), JSON.stringify({ basePath: '' }));
// getDevUsers.js (auth.dev.users fixtures) reads build/auth.json the same way.
fs.writeFileSync(path.join(fixtureDir, 'build', 'auth.json'), JSON.stringify({}));
process.chdir(fixtureDir);
process.env.LOWDEFY_DIRECTORY_CONFIG = fixtureDir;

// A real headless load needs an installed browser, which jest can't rely on —
// loadState's registry-only mode (the only mode under test here) never
// calls getBrowser(), but chromium is mocked anyway so importing
// getBrowser.js can never accidentally launch a real browser.
jest.unstable_mockModule('playwright-core', () => ({
  chromium: { launch: jest.fn().mockRejectedValue(new Error("Executable doesn't exist")) },
}));

const mockInspectState = jest.fn();
jest.unstable_mockModule('./inspectState.js', () => ({
  default: mockInspectState,
}));

const {
  checkpointExists,
  getStateCheckpointsRoot,
  listStateCheckpoints,
  readCheckpoint,
  writeCheckpoint,
} = await import('./checkpointStore.js');
const { publish } = await import('./devEventBus.js');
const { clearMocks, claimMockLog, getMock, listMocks, loadMocks } = await import(
  './devMockRegistry.js'
);
const { default: snapshotState } = await import('./snapshotState.js');
const { default: loadState } = await import('./loadState.js');

afterAll(() => {
  process.chdir(originalCwd);
  fs.rmSync(fixtureDir, { recursive: true, force: true });
  if (previousConfigDirectory === undefined) {
    delete process.env.LOWDEFY_DIRECTORY_CONFIG;
  } else {
    process.env.LOWDEFY_DIRECTORY_CONFIG = previousConfigDirectory;
  }
});

afterEach(() => {
  clearMocks();
});

function buildSnapshot(overrides = {}) {
  return {
    pageId: 'home',
    url: 'http://localhost:3111/home',
    state: { count: 1 },
    urlQuery: '?a=1',
    input: { fromInput: true },
    user: { id: 'u1' },
    global: { g: 1 },
    requests: {
      req1: [{ payload: { a: 1 }, response: { ok: true }, error: null, responseTime: 12 }],
    },
    apiResponses: {
      ep1: { payload: {}, response: { v: 1 } },
    },
    ...overrides,
  };
}

describe('checkpointStore', () => {
  test('writeCheckpoint writes a manifest and per-part files, including per-request/api files on disk', () => {
    const snapshot = buildSnapshot();
    const { dir, parts } = writeCheckpoint({ name: 'cp-roundtrip', snapshot, notes: 'a note' });

    expect(dir).toBe(path.join(getStateCheckpointsRoot(), 'cp-roundtrip'));
    expect(parts.sort()).toEqual(
      [
        'checkpoint.json',
        'state.json',
        'urlQuery.json',
        'inputs.json',
        'user.json',
        'global.json',
        'requests/req1.json',
        'api/ep1.json',
      ].sort()
    );
    expect(fs.existsSync(path.join(dir, 'requests', 'req1.json'))).toBe(true);
    expect(fs.existsSync(path.join(dir, 'api', 'ep1.json'))).toBe(true);

    const result = readCheckpoint({ name: 'cp-roundtrip' });
    expect(result.checkpoint.pageId).toBe('home');
    expect(result.checkpoint.url).toBe('http://localhost:3111/home');
    expect(result.checkpoint.notes).toBe('a note');
    expect(typeof result.checkpoint.capturedAt).toBe('string');
    expect(result.state).toEqual({ count: 1 });
    expect(result.urlQuery).toBe('?a=1');
    expect(result.input).toEqual({ fromInput: true });
    expect(result.user).toEqual({ id: 'u1' });
    expect(result.global).toEqual({ g: 1 });
    expect(result.requests).toEqual({
      req1: { payload: { a: 1 }, response: { ok: true }, error: null, responseTime: 12 },
    });
    expect(result.api).toEqual({
      ep1: { payload: {}, response: { v: 1 }, error: undefined, responseTime: undefined },
    });
  });

  test('writeCheckpoint throws an actionable error for an invalid checkpoint name', () => {
    expect(() => writeCheckpoint({ name: 'bad name!', snapshot: buildSnapshot() })).toThrow(
      /invalid/
    );
  });

  test('writeCheckpoint refuses to overwrite an existing checkpoint unless overwrite: true', () => {
    writeCheckpoint({ name: 'cp-overwrite', snapshot: buildSnapshot() });

    expect(() => writeCheckpoint({ name: 'cp-overwrite', snapshot: buildSnapshot() })).toThrow(
      'Checkpoint "cp-overwrite" already exists. Pass overwrite: true to replace it.'
    );

    const fewerRequests = buildSnapshot({ requests: {}, apiResponses: {} });
    const { dir } = writeCheckpoint({
      name: 'cp-overwrite',
      snapshot: fewerRequests,
      overwrite: true,
    });
    // Overwriting replaces the whole folder, so stale per-request files from
    // the first write must not linger.
    expect(fs.existsSync(path.join(dir, 'requests', 'req1.json'))).toBe(false);
  });

  test('readCheckpoint throws when the checkpoint does not exist', () => {
    expect(() => readCheckpoint({ name: 'does-not-exist' })).toThrow(
      'Checkpoint "does-not-exist" not found.'
    );
  });

  test('readCheckpoint is tolerant of missing parts', () => {
    const dir = path.join(getStateCheckpointsRoot(), 'cp-partial');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'checkpoint.json'), JSON.stringify({ pageId: 'home' }));
    // Deliberately no state.json/urlQuery.json/etc, no requests/ dir.

    const result = readCheckpoint({ name: 'cp-partial' });
    expect(result.state).toEqual({});
    expect(result.urlQuery).toBe('');
    expect(result.input).toEqual({});
    expect(result.user).toBe(null);
    expect(result.global).toEqual({});
    expect(result.requests).toEqual({});
    expect(result.api).toEqual({});
  });

  test('checkpointExists reflects whether a checkpoint folder exists', () => {
    writeCheckpoint({ name: 'cp-exists', snapshot: buildSnapshot() });
    expect(checkpointExists({ name: 'cp-exists' })).toBe(true);
    expect(checkpointExists({ name: 'cp-does-not-exist' })).toBe(false);
  });

  test('listStateCheckpoints lists checkpoints with requestCount, most recent first', async () => {
    writeCheckpoint({ name: 'cp-list-a', snapshot: buildSnapshot() });
    await new Promise((resolve) => setTimeout(resolve, 5));
    writeCheckpoint({
      name: 'cp-list-b',
      snapshot: buildSnapshot({ requests: {}, apiResponses: {} }),
    });

    const checkpoints = listStateCheckpoints();
    const a = checkpoints.find((checkpoint) => checkpoint.name === 'cp-list-a');
    const b = checkpoints.find((checkpoint) => checkpoint.name === 'cp-list-b');
    expect(a.requestCount).toBe(1);
    expect(b.requestCount).toBe(0);
    expect(checkpoints.indexOf(b)).toBeLessThan(checkpoints.indexOf(a));
  });
});

describe('devMockRegistry', () => {
  test('loadMocks + getMock replay a recorded response by pageId/requestId', () => {
    loadMocks({
      pageId: 'home',
      checkpoint: 'cp-registry',
      mocks: { req1: { response: { ok: true }, error: null } },
    });
    expect(getMock({ pageId: 'home', requestId: 'req1' })).toEqual({
      pageId: 'home',
      requestId: 'req1',
      checkpoint: 'cp-registry',
      response: { ok: true },
      error: null,
    });
    expect(getMock({ pageId: 'other', requestId: 'req1' })).toBeUndefined();
  });

  test('listMocks reports whether each entry has a response or an error', () => {
    loadMocks({
      pageId: 'home',
      mocks: {
        req1: { response: { ok: true } },
        req2: { error: new Error('boom') },
      },
    });
    const mocks = listMocks().sort((m1, m2) => m1.requestId.localeCompare(m2.requestId));
    expect(mocks).toEqual([
      { pageId: 'home', requestId: 'req1', checkpoint: null, hasResponse: true, hasError: false },
      { pageId: 'home', requestId: 'req2', checkpoint: null, hasResponse: false, hasError: true },
    ]);
  });

  test('clearMocks removes all recorded mocks', () => {
    loadMocks({ pageId: 'home', mocks: { req1: { response: { ok: true } } } });
    clearMocks();
    expect(listMocks()).toEqual([]);
    expect(getMock({ pageId: 'home', requestId: 'req1' })).toBeUndefined();
  });

  // A rebuild changes the config the responses were recorded against, so
  // replaying them past it would answer for requests that may no longer exist.
  test('a build event on the dev event bus clears the recorded mocks', () => {
    loadMocks({ pageId: 'home', checkpoint: 'cp-build', mocks: { req1: { response: { ok: 1 } } } });
    expect(listMocks()).toHaveLength(1);

    publish({ type: 'build', status: 'success', errorCount: 0, warningCount: 0 });

    expect(listMocks()).toEqual([]);
    expect(getMock({ pageId: 'home', requestId: 'req1' })).toBeUndefined();
  });

  test('a non-build event on the dev event bus leaves the recorded mocks in place', () => {
    loadMocks({ pageId: 'home', checkpoint: 'cp-keep', mocks: { req1: { response: { ok: 1 } } } });

    publish({ type: 'client_error', message: 'boom' });

    expect(listMocks()).toHaveLength(1);
  });

  test('claimMockLog is true only the first time a request is answered from a mock', () => {
    loadMocks({ pageId: 'home', checkpoint: 'cp-log', mocks: { req1: { response: { ok: 1 } } } });

    expect(claimMockLog({ pageId: 'home', requestId: 'req1' })).toBe(true);
    expect(claimMockLog({ pageId: 'home', requestId: 'req1' })).toBe(false);
    expect(claimMockLog({ pageId: 'home', requestId: 'req2' })).toBe(true);
  });
});

describe('snapshotState', () => {
  test('snapshots inspectState output into a checkpoint and returns its location', async () => {
    mockInspectState.mockResolvedValue({
      pageId: 'home',
      state: { count: 2 },
      requests: {},
      urlQuery: '',
      source: 'headless',
    });

    const result = await snapshotState({
      origin: 'http://localhost:3111',
      pageId: 'home',
      name: 'cp-snapshot',
    });

    expect(result.error).toBeUndefined();
    expect(result.name).toBe('cp-snapshot');
    expect(result.source).toBe('headless');
    expect(result.parts).toContain('state.json');

    const stored = readCheckpoint({ name: 'cp-snapshot' });
    expect(stored.state).toEqual({ count: 2 });
    expect(stored.checkpoint.url).toBe('http://localhost:3111/home');
  });

  test('returns the inspectState error instead of writing a checkpoint', async () => {
    mockInspectState.mockResolvedValue({ error: 'No live context for page "home".' });

    const result = await snapshotState({
      origin: 'http://localhost:3111',
      pageId: 'home',
      name: 'cp-snapshot-error',
    });

    expect(result).toEqual({ error: 'No live context for page "home".' });
    expect(checkpointExists({ name: 'cp-snapshot-error' })).toBe(false);
  });

  test('validates required fields before calling inspectState', async () => {
    const result = await snapshotState({ origin: 'http://localhost:3111', name: 'cp-x' });
    expect(result.error).toMatch(/requires a "pageId" string/);
    expect(mockInspectState).not.toHaveBeenCalled();
  });
});

describe('loadState', () => {
  test('registry-only mode loads recorded requests into devMockRegistry and returns a bootstrap URL', async () => {
    writeCheckpoint({
      name: 'cp-load-registry',
      snapshot: buildSnapshot({ urlQuery: '?a=1' }),
    });

    const result = await loadState({
      origin: 'http://localhost:3111',
      name: 'cp-load-registry',
      mode: 'registry-only',
    });

    expect(result.error).toBeUndefined();
    expect(result.url).toBe('http://localhost:3111/home?a=1&_checkpoint=cp-load-registry');
    expect(result.instructions).toMatch(/Open this URL/);
    expect(result.replayRequests).toBe(true);
    expect(getMock({ pageId: 'home', requestId: 'req1' })).toEqual({
      pageId: 'home',
      requestId: 'req1',
      checkpoint: 'cp-load-registry',
      response: { ok: true },
      error: null,
    });
  });

  test('replayRequests false leaves the registry empty so requests hit the real connections', async () => {
    writeCheckpoint({ name: 'cp-load-no-replay', snapshot: buildSnapshot() });
    loadMocks({
      pageId: 'home',
      checkpoint: 'stale',
      mocks: { req1: { response: { old: true } } },
    });

    const result = await loadState({
      origin: 'http://localhost:3111',
      name: 'cp-load-no-replay',
      mode: 'registry-only',
      replayRequests: false,
    });

    expect(result.error).toBeUndefined();
    expect(result.replayRequests).toBe(false);
    expect(result.instructions).toMatch(/real connections/);
    // A previous load's mocks must not survive an explicit opt-out.
    expect(listMocks()).toEqual([]);
  });

  test('rejects a non-boolean replayRequests as invalid input', async () => {
    writeCheckpoint({ name: 'cp-load-bad-replay', snapshot: buildSnapshot() });

    const result = await loadState({
      origin: 'http://localhost:3111',
      name: 'cp-load-bad-replay',
      mode: 'registry-only',
      replayRequests: 'no',
    });

    expect(result.invalidInput).toBe(true);
    expect(result.error).toMatch(/"replayRequests" must be a boolean/);
    expect(listMocks()).toEqual([]);
  });

  test('returns an error when the checkpoint does not exist', async () => {
    const result = await loadState({
      origin: 'http://localhost:3111',
      name: 'does-not-exist',
      mode: 'registry-only',
    });
    expect(result).toEqual({ error: 'Checkpoint "does-not-exist" not found.' });
  });

  test('rejects a user in registry-only mode as invalid input', async () => {
    writeCheckpoint({
      name: 'cp-load-registry-user',
      snapshot: buildSnapshot({ urlQuery: '' }),
    });

    const result = await loadState({
      origin: 'http://localhost:3111',
      name: 'cp-load-registry-user',
      mode: 'registry-only',
      user: { roles: ['admin'] },
    });

    expect(result.invalidInput).toBe(true);
    expect(result.error).toMatch(/cannot apply "user" in "registry-only" mode/);
    expect(result.url).toBeUndefined();
  });
});
