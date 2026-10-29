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

import fs from 'node:fs';
import fsPromises from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';

import { vi, afterEach, beforeEach, expect, test } from 'vitest';

// This sink is the sole writer of `error.handled`. Two callers read the flag and
// neither can set it for itself: runRoutine's catch guards on `!error.handled` to
// avoid logging a nested error twice, and the browser's handleError skips the
// round-trip to /api/client-error when it is set. runRoutine deliberately gave up
// its own assignment on the strength of this function, so the tests below pin the
// assignment and — more importantly — its position ahead of everything that can
// throw.

const keyMap = {
  key_0: { s: 'root', p: 'key_root', r: 'ref_0', l: 1 },
  key_1: { s: '.pages[0:home]', p: 'key_0', r: 'ref_1', l: 5 },
};
const refMap = { ref_0: { path: 'lowdefy.yaml' }, ref_1: { path: 'pages/home.yaml' } };

let buildDirectory;

function writeGzippedMaps() {
  fs.writeFileSync(
    path.join(buildDirectory, 'keyMap.json.gz'),
    zlib.gzipSync(JSON.stringify(keyMap))
  );
  fs.writeFileSync(
    path.join(buildDirectory, 'refMap.json.gz'),
    zlib.gzipSync(JSON.stringify(refMap))
  );
}

// Each test loads the sink afresh, so readMaps' per-process load starts unmade.
// The error classes come from the same load, so the sink's instanceof checks
// see them.
async function loadFresh() {
  vi.resetModules();
  const { default: createHandleError } = await import('./createHandleError.js');
  const errors = await import('@lowdefy/errors');
  return { createHandleError, errors };
}

function testContext({ logger, configDirectory } = {}) {
  return {
    buildDirectory,
    configDirectory,
    logger: logger ?? { error: vi.fn(), warn: vi.fn() },
    readConfigFile: vi.fn(async () => null),
  };
}

function mapReads(readFile) {
  return readFile.mock.calls
    .map(([filePath]) => path.basename(String(filePath)))
    .filter((name) => name.startsWith('keyMap.json') || name.startsWith('refMap.json'));
}

beforeEach(() => {
  console.error = vi.fn();
  buildDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-e2e-handle-error-'));
});

afterEach(() => {
  vi.restoreAllMocks();
  fs.rmSync(buildDirectory, { recursive: true, force: true });
});

test('handleError marks the error handled and resolves its location from the gzipped maps', async () => {
  writeGzippedMaps();
  const {
    createHandleError,
    errors: { ConfigError },
  } = await loadFresh();
  const context = testContext();
  const handleError = createHandleError({ context });
  const error = new ConfigError('Bad config.', { configKey: 'key_1' });

  await handleError(error);

  expect(error.handled).toBe(true);
  expect(error.source).toBe('pages/home.yaml:5');
  expect(error.config).toBe('root.pages[0:home]');
  expect(context.logger.error).toHaveBeenCalledWith(error);
  expect(context.readConfigFile).not.toHaveBeenCalled();
});

test('handleError marks a LowdefyInternalError handled even though it never gets a source', async () => {
  // The Decision 7 case. Location resolution is deliberately skipped for an
  // internal error, so `source` stays undefined - which is why the client's
  // already-logged gate reads `handled` and not `source`. Keyed on source, this
  // error was POSTed back to /api/client-error and logged a second time.
  writeGzippedMaps();
  const {
    createHandleError,
    errors: { LowdefyInternalError },
  } = await loadFresh();
  const context = testContext();
  const readFile = vi.spyOn(fsPromises, 'readFile');
  const handleError = createHandleError({ context });
  const error = new LowdefyInternalError('Unexpected condition.');

  await handleError(error);

  expect(error.handled).toBe(true);
  expect(error.source).toBeUndefined();
  expect(mapReads(readFile)).toEqual([]);
  expect(context.readConfigFile).not.toHaveBeenCalled();
  expect(context.logger.error).toHaveBeenCalledWith(error);
});

test('handleError marks the error handled before it logs, so a throwing logger cannot skip the flag', async () => {
  writeGzippedMaps();
  const {
    createHandleError,
    errors: { ConfigError },
  } = await loadFresh();
  const logger = {
    error: vi.fn(() => {
      throw new Error('Log drain unreachable.');
    }),
    warn: vi.fn(),
  };
  const context = testContext({ logger });
  const handleError = createHandleError({ context });
  const error = new ConfigError('Bad config.', { configKey: 'key_1' });

  await handleError(error);

  // The sink swallows its own failure - reaching it is what makes the error
  // already-logged, so the flag must survive the log call failing. Were it set
  // after the log, this error would cross the wire unflagged and be logged a
  // second time from the browser.
  expect(error.handled).toBe(true);
  expect(logger.error).toHaveBeenCalled();
  expect(console.error).toHaveBeenCalled();
});

test('handleError marks the error handled when the maps cannot be read', async () => {
  writeGzippedMaps();
  fs.writeFileSync(path.join(buildDirectory, 'keyMap.json.gz'), 'not gzip');
  const {
    createHandleError,
    errors: { ConfigError },
  } = await loadFresh();
  const context = testContext();
  const handleError = createHandleError({ context });
  const error = new ConfigError('Bad config.', { configKey: 'key_1' });

  await handleError(error);

  expect(error.handled).toBe(true);
  // ConfigError's constructor initialises source to null; resolution failing
  // leaves it there rather than assigning.
  expect(error.source).toBeNull();
  expect(context.logger.error).toHaveBeenCalledWith(error);
  expect(context.logger.warn).toHaveBeenCalledTimes(1);
});

test('handleError on a build with no maps logs every error without a location and reads for the maps once', async () => {
  const {
    createHandleError,
    errors: { ConfigError },
  } = await loadFresh();
  const context = testContext();
  const readFile = vi.spyOn(fsPromises, 'readFile');
  const handleError = createHandleError({ context });

  for (let i = 0; i < 100; i += 1) {
    const error = new ConfigError('Bad config.', { configKey: 'key_1' });
    await handleError(error);
    expect(error.source).toBeNull();
  }

  expect(context.logger.error).toHaveBeenCalledTimes(100);
  expect(console.error).not.toHaveBeenCalled();
  expect(mapReads(readFile).sort()).toEqual(['keyMap.json.gz', 'refMap.json.gz']);
  expect(context.readConfigFile).not.toHaveBeenCalled();
  expect(context.logger.warn).not.toHaveBeenCalled();
});

test('handleError marks a plain Error handled', async () => {
  const { createHandleError } = await loadFresh();
  const context = testContext();
  const handleError = createHandleError({ context });
  const error = new Error('Something broke.');

  await handleError(error);

  expect(error.handled).toBe(true);
});
