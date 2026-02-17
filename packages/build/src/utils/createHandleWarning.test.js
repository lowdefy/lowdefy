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

import { ConfigWarning } from '@lowdefy/errors';

import createHandleWarning from './createHandleWarning.js';
import createTestLogger from '../test-utils/createTestLogger.js';

function createContext(overrides = {}) {
  const { logger, lines } = createTestLogger();
  return {
    context: {
      logger,
      keyMap: {},
      refMap: {},
      directories: { config: '/app' },
      seenSourceLines: new Set(),
      stage: 'dev',
      errors: [],
      ...overrides,
    },
    lines,
  };
}

test('handleWarning logs warning directly', () => {
  const { context, lines } = createContext();
  const handleWarning = createHandleWarning({ context });

  handleWarning(new ConfigWarning({ message: 'Something looks wrong' }));

  expect(lines).toHaveLength(1);
  expect(lines[0].msg).toBe('Something looks wrong');
  expect(lines[0].err.name).toBe('ConfigWarning');
});

test('handleWarning resolves location from configKey', () => {
  const { context, lines } = createContext({
    keyMap: {
      abc123: { key: 'pages.0.blocks.0', '~r': 'ref1', '~l': 42 },
    },
    refMap: {
      ref1: { path: 'pages/home.yaml' },
    },
  });
  const handleWarning = createHandleWarning({ context });

  handleWarning(new ConfigWarning({ message: 'Bad block', configKey: 'abc123' }));

  expect(lines[0].err.source).toBe('/app/pages/home.yaml:42');
});

test('handleWarning sets received on warning', () => {
  const { context, lines } = createContext();
  const handleWarning = createHandleWarning({ context });

  handleWarning(new ConfigWarning({ message: 'Wrong type', received: { type: 'Buton' } }));

  expect(lines[0].err.received).toEqual({ type: 'Buton' });
});

// --- Suppression ---

test('handleWarning suppresses when ~ignoreBuildChecks is true', () => {
  const { context, lines } = createContext({
    keyMap: {
      abc123: { key: 'pages.0', '~ignoreBuildChecks': true },
    },
  });
  const handleWarning = createHandleWarning({ context });

  handleWarning(new ConfigWarning({ message: 'Suppressed', configKey: 'abc123' }));

  expect(lines).toHaveLength(0);
});

test('handleWarning suppresses specific checkSlug', () => {
  const { context, lines } = createContext({
    keyMap: {
      abc123: { key: 'pages.0', '~ignoreBuildChecks': ['state-reference'] },
    },
  });
  const handleWarning = createHandleWarning({ context });

  handleWarning(
    new ConfigWarning({ message: 'State ref', configKey: 'abc123', checkSlug: 'state-reference' })
  );

  expect(lines).toHaveLength(0);
});

test('handleWarning does not suppress non-matching checkSlug', () => {
  const { context, lines } = createContext({
    keyMap: {
      abc123: { key: 'pages.0', '~ignoreBuildChecks': ['state-reference'] },
    },
  });
  const handleWarning = createHandleWarning({ context });

  handleWarning(
    new ConfigWarning({ message: 'Link ref', configKey: 'abc123', checkSlug: 'link-reference' })
  );

  expect(lines).toHaveLength(1);
});

// --- prodError escalation ---

test('handleWarning collects warning as error in prod mode', () => {
  const { context, lines } = createContext({ stage: 'prod' });
  const handleWarning = createHandleWarning({ context });

  handleWarning(new ConfigWarning({ message: 'Prod failure', prodError: true }));

  expect(lines).toHaveLength(0);
  expect(context.errors).toHaveLength(1);
  expect(context.errors[0]).toBeInstanceOf(ConfigWarning);
  expect(context.errors[0].message).toBe('Prod failure');
});

test('handleWarning does not escalate prodError in dev mode', () => {
  const { context, lines } = createContext({ stage: 'dev' });
  const handleWarning = createHandleWarning({ context });

  handleWarning(new ConfigWarning({ message: 'Dev warning', prodError: true }));

  expect(lines).toHaveLength(1);
  expect(context.errors).toHaveLength(0);
});

test('handleWarning does not escalate when prodError is false', () => {
  const { context, lines } = createContext({ stage: 'prod' });
  const handleWarning = createHandleWarning({ context });

  handleWarning(new ConfigWarning({ message: 'Not escalated', prodError: false }));

  expect(lines).toHaveLength(1);
  expect(context.errors).toHaveLength(0);
});

// --- Deduplication ---

test('handleWarning deduplicates by source when resolved', () => {
  const { context, lines } = createContext({
    keyMap: {
      k1: { key: 'pages.0', '~r': 'r1', '~l': 10 },
      k2: { key: 'pages.1', '~r': 'r1', '~l': 10 },
    },
    refMap: {
      r1: { path: 'pages/home.yaml' },
    },
  });
  const handleWarning = createHandleWarning({ context });

  handleWarning(new ConfigWarning({ message: 'Same source', configKey: 'k1' }));
  handleWarning(new ConfigWarning({ message: 'Same source', configKey: 'k2' }));

  expect(lines).toHaveLength(1);
});

test('handleWarning deduplicates by message when source not resolved', () => {
  const { context, lines } = createContext();
  const handleWarning = createHandleWarning({ context });

  handleWarning(new ConfigWarning({ message: 'Same message' }));
  handleWarning(new ConfigWarning({ message: 'Same message' }));

  expect(lines).toHaveLength(1);
});

test('handleWarning does not deduplicate different sources', () => {
  const { context, lines } = createContext({
    keyMap: {
      k1: { key: 'pages.0', '~r': 'r1', '~l': 10 },
      k2: { key: 'pages.0', '~r': 'r1', '~l': 20 },
    },
    refMap: {
      r1: { path: 'pages/home.yaml' },
    },
  });
  const handleWarning = createHandleWarning({ context });

  handleWarning(new ConfigWarning({ message: 'Same msg', configKey: 'k1' }));
  handleWarning(new ConfigWarning({ message: 'Same msg', configKey: 'k2' }));

  expect(lines).toHaveLength(2);
});

// --- Missing context.seenSourceLines ---

test('handleWarning works without context.seenSourceLines (no dedup)', () => {
  const { context, lines } = createContext();
  delete context.seenSourceLines;
  const handleWarning = createHandleWarning({ context });

  handleWarning(new ConfigWarning({ message: 'No dedup' }));
  handleWarning(new ConfigWarning({ message: 'No dedup' }));

  // Both logged — no dedup without seenSourceLines
  expect(lines).toHaveLength(2);
});

// --- Source null when unresolved ---

test('handleWarning has null source when location not resolved', () => {
  const { context, lines } = createContext();
  const handleWarning = createHandleWarning({ context });

  handleWarning(new ConfigWarning({ message: 'No location' }));

  expect(lines[0].err.source).toBeNull();
});
