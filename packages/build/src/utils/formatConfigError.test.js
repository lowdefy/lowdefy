/*
  Copyright 2020-2024 Lowdefy, Inc

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

import formatConfigError from './formatConfigError.js';

test('formatConfigError with message only', () => {
  const result = formatConfigError({
    message: 'Test error message',
  });
  expect(result).toBe('[Config Error] Test error message');
});

test('formatConfigError with no configKey', () => {
  const result = formatConfigError({
    message: 'Missing configKey',
    context: {},
  });
  expect(result).toBe('[Config Error] Missing configKey');
});

test('formatConfigError with no context', () => {
  const result = formatConfigError({
    message: 'Missing context',
    configKey: 'pages.0.blocks.0',
  });
  expect(result).toBe('[Config Error] Missing context');
});

test('formatConfigError with configKey and context but no keyMap', () => {
  const result = formatConfigError({
    message: 'No keyMap available',
    configKey: 'pages.0.blocks.0',
    context: {
      keyMap: null,
      refMap: {},
      directories: { config: '/app' },
    },
  });
  expect(result).toBe('[Config Error] No keyMap available');
});

test('formatConfigError with valid location', () => {
  const result = formatConfigError({
    message: 'Invalid block type',
    configKey: 'abc123',
    context: {
      keyMap: {
        abc123: { key: 'pages.0.blocks.0.type', '~r': 'ref1', '~l': 10 },
      },
      refMap: {
        ref1: { path: 'pages/home.yaml' },
      },
      directories: { config: '/app' },
    },
  });
  expect(result).toContain('[Config Error] Invalid block type');
  expect(result).toContain('pages/home.yaml:10');
});

test('formatConfigError with location and line number', () => {
  const result = formatConfigError({
    message: 'Duplicate id',
    configKey: 'def456',
    context: {
      keyMap: {
        def456: { key: 'pages.0.id', '~r': 'ref2', '~l': 5 },
      },
      refMap: {
        ref2: { path: 'pages/dashboard.yaml' },
      },
      directories: { config: '/project' },
    },
  });
  expect(result).toContain('[Config Error] Duplicate id');
  expect(result).toContain('pages/dashboard.yaml:5');
});

test('formatConfigError includes source file info', () => {
  const result = formatConfigError({
    message: 'Connection not found',
    configKey: 'ghi789',
    context: {
      keyMap: {
        ghi789: { key: 'connections.0.id', '~r': 'ref3', '~l': 3 },
      },
      refMap: {
        ref3: { path: 'connections/mongodb.yaml' },
      },
      directories: { config: '/app' },
    },
  });
  expect(result).toContain('[Config Error] Connection not found');
  expect(result).toContain('connections/mongodb.yaml:3');
});

test('suppresses error when object has ~ignoreBuildCheck: true', () => {
  const result = formatConfigError({
    message: 'Block type not found',
    configKey: 'key-123',
    context: {
      keyMap: {
        'key-123': {
          key: 'blocks.0',
          '~r': 'ref-1',
          '~l': 10,
          '~ignoreBuildCheck': true,
        },
      },
      refMap: { 'ref-1': { path: 'pages/home.yaml' } },
      directories: { config: '/app' },
    },
  });

  expect(result).toBe('');
});

test('shows error when object has ~ignoreBuildCheck: false', () => {
  const result = formatConfigError({
    message: 'Block type not found',
    configKey: 'key-123',
    context: {
      keyMap: {
        'key-123': {
          key: 'blocks.0',
          '~r': 'ref-1',
          '~l': 10,
          '~ignoreBuildCheck': false, // Explicitly false - should NOT suppress
        },
      },
      refMap: { 'ref-1': { path: 'pages/home.yaml' } },
      directories: { config: '/app' },
    },
  });

  expect(result).toContain('[Config Error]');
  expect(result).toContain('Block type not found');
});

test('shows error when ~ignoreBuildCheck property not present', () => {
  const result = formatConfigError({
    message: 'Block type not found',
    configKey: 'key-123',
    context: {
      keyMap: {
        'key-123': {
          key: 'blocks.0',
          '~r': 'ref-1',
          '~l': 10,
          // No ~ignoreBuildCheck property - should validate normally
        },
      },
      refMap: { 'ref-1': { path: 'pages/home.yaml' } },
      directories: { config: '/app' },
    },
  });

  expect(result).toContain('[Config Error]');
});
