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
import { ConfigWarning } from '@lowdefy/errors';

import createHandleWarning from './createHandleWarning.js';

const mockPinoLogger = {
  warn: jest.fn(),
};

function createContext(overrides = {}) {
  return {
    logger: mockPinoLogger,
    keyMap: {},
    refMap: {},
    directories: { config: '/app' },
    seenSourceLines: new Set(),
    stage: 'dev',
    errors: [],
    ...overrides,
  };
}

beforeEach(() => {
  mockPinoLogger.warn.mockClear();
});

test('handleWarning logs warning directly', () => {
  const context = createContext();
  const handleWarning = createHandleWarning({ context });

  handleWarning({ message: 'Something looks wrong' });

  expect(mockPinoLogger.warn).toHaveBeenCalledTimes(1);
  const [warning] = mockPinoLogger.warn.mock.calls[0];
  expect(warning).toBeInstanceOf(ConfigWarning);
  expect(warning.message).toBe('Something looks wrong');
});

test('handleWarning resolves location from configKey', () => {
  const context = createContext({
    keyMap: {
      abc123: { key: 'pages.0.blocks.0', '~r': 'ref1', '~l': 42 },
    },
    refMap: {
      ref1: { path: 'pages/home.yaml' },
    },
  });
  const handleWarning = createHandleWarning({ context });

  handleWarning({ message: 'Bad block', configKey: 'abc123' });

  const [warning] = mockPinoLogger.warn.mock.calls[0];
  expect(warning.source).toBe('/app/pages/home.yaml:42');
});

test('handleWarning sets received on warning', () => {
  const context = createContext();
  const handleWarning = createHandleWarning({ context });

  handleWarning({ message: 'Wrong type', received: { type: 'Buton' } });

  const [warning] = mockPinoLogger.warn.mock.calls[0];
  expect(warning.received).toEqual({ type: 'Buton' });
});

// --- Suppression ---

test('handleWarning suppresses when ~ignoreBuildChecks is true', () => {
  const context = createContext({
    keyMap: {
      abc123: { key: 'pages.0', '~ignoreBuildChecks': true },
    },
  });
  const handleWarning = createHandleWarning({ context });

  handleWarning({ message: 'Suppressed', configKey: 'abc123' });

  expect(mockPinoLogger.warn).not.toHaveBeenCalled();
});

test('handleWarning suppresses specific checkSlug', () => {
  const context = createContext({
    keyMap: {
      abc123: { key: 'pages.0', '~ignoreBuildChecks': ['state-reference'] },
    },
  });
  const handleWarning = createHandleWarning({ context });

  handleWarning({ message: 'State ref', configKey: 'abc123', checkSlug: 'state-reference' });

  expect(mockPinoLogger.warn).not.toHaveBeenCalled();
});

test('handleWarning does not suppress non-matching checkSlug', () => {
  const context = createContext({
    keyMap: {
      abc123: { key: 'pages.0', '~ignoreBuildChecks': ['state-reference'] },
    },
  });
  const handleWarning = createHandleWarning({ context });

  handleWarning({ message: 'Link ref', configKey: 'abc123', checkSlug: 'link-reference' });

  expect(mockPinoLogger.warn).toHaveBeenCalledTimes(1);
});

// --- prodError escalation ---

test('handleWarning collects warning as error in prod mode', () => {
  const context = createContext({ stage: 'prod' });
  const handleWarning = createHandleWarning({ context });

  handleWarning({ message: 'Prod failure', prodError: true });

  expect(mockPinoLogger.warn).not.toHaveBeenCalled();
  expect(context.errors).toHaveLength(1);
  expect(context.errors[0]).toBeInstanceOf(ConfigWarning);
  expect(context.errors[0].message).toBe('Prod failure');
});

test('handleWarning does not escalate prodError in dev mode', () => {
  const context = createContext({ stage: 'dev' });
  const handleWarning = createHandleWarning({ context });

  handleWarning({ message: 'Dev warning', prodError: true });

  expect(mockPinoLogger.warn).toHaveBeenCalledTimes(1);
  expect(context.errors).toHaveLength(0);
});

test('handleWarning does not escalate when prodError is false', () => {
  const context = createContext({ stage: 'prod' });
  const handleWarning = createHandleWarning({ context });

  handleWarning({ message: 'Not escalated', prodError: false });

  expect(mockPinoLogger.warn).toHaveBeenCalledTimes(1);
  expect(context.errors).toHaveLength(0);
});

// --- Deduplication ---

test('handleWarning deduplicates by source when resolved', () => {
  const context = createContext({
    keyMap: {
      k1: { key: 'pages.0', '~r': 'r1', '~l': 10 },
      k2: { key: 'pages.1', '~r': 'r1', '~l': 10 },
    },
    refMap: {
      r1: { path: 'pages/home.yaml' },
    },
  });
  const handleWarning = createHandleWarning({ context });

  handleWarning({ message: 'Same source', configKey: 'k1' });
  handleWarning({ message: 'Same source', configKey: 'k2' });

  expect(mockPinoLogger.warn).toHaveBeenCalledTimes(1);
});

test('handleWarning deduplicates by message when source not resolved', () => {
  const context = createContext();
  const handleWarning = createHandleWarning({ context });

  handleWarning({ message: 'Same message' });
  handleWarning({ message: 'Same message' });

  expect(mockPinoLogger.warn).toHaveBeenCalledTimes(1);
});

test('handleWarning does not deduplicate different sources', () => {
  const context = createContext({
    keyMap: {
      k1: { key: 'pages.0', '~r': 'r1', '~l': 10 },
      k2: { key: 'pages.0', '~r': 'r1', '~l': 20 },
    },
    refMap: {
      r1: { path: 'pages/home.yaml' },
    },
  });
  const handleWarning = createHandleWarning({ context });

  handleWarning({ message: 'Same msg', configKey: 'k1' });
  handleWarning({ message: 'Same msg', configKey: 'k2' });

  expect(mockPinoLogger.warn).toHaveBeenCalledTimes(2);
});

// --- Missing context.seenSourceLines ---

test('handleWarning works without context.seenSourceLines (no dedup)', () => {
  const context = createContext();
  delete context.seenSourceLines;
  const handleWarning = createHandleWarning({ context });

  handleWarning({ message: 'No dedup' });
  handleWarning({ message: 'No dedup' });

  // Both logged — no dedup without seenSourceLines
  expect(mockPinoLogger.warn).toHaveBeenCalledTimes(2);
});

// --- Source null when unresolved ---

test('handleWarning has null source when location not resolved', () => {
  const context = createContext();
  const handleWarning = createHandleWarning({ context });

  handleWarning({ message: 'No location' });

  const [warning] = mockPinoLogger.warn.mock.calls[0];
  expect(warning.source).toBeNull();
});
