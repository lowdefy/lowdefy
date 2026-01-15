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

import formatConfigWarning from './formatConfigWarning.js';

test('formatConfigWarning with message only', () => {
  const result = formatConfigWarning({
    message: 'Test warning message',
  });
  expect(result).toBe('[Config Warning] Test warning message');
});

test('formatConfigWarning with no configKey', () => {
  const result = formatConfigWarning({
    message: 'Missing configKey',
    context: {},
  });
  expect(result).toBe('[Config Warning] Missing configKey');
});

test('formatConfigWarning with no context', () => {
  const result = formatConfigWarning({
    message: 'Missing context',
    configKey: 'pages.0.blocks.0',
  });
  expect(result).toBe('[Config Warning] Missing context');
});

test('formatConfigWarning with configKey and context but no keyMap', () => {
  const result = formatConfigWarning({
    message: 'No keyMap available',
    configKey: 'pages.0.blocks.0',
    context: {
      keyMap: null,
      refMap: {},
      directories: { config: '/app' },
    },
  });
  expect(result).toBe('[Config Warning] No keyMap available');
});

test('formatConfigWarning with valid location', () => {
  const result = formatConfigWarning({
    message: 'Undefined state reference',
    configKey: 'abc123',
    context: {
      keyMap: {
        abc123: { key: 'pages.0.blocks.0._state', '~r': 'ref1', '~l': 10 },
      },
      refMap: {
        ref1: { path: 'pages/home.yaml' },
      },
      directories: { config: '/app' },
    },
  });
  expect(result).toContain('[Config Warning] Undefined state reference');
  expect(result).toContain('pages/home.yaml:10');
});

test('formatConfigWarning with location and line number', () => {
  const result = formatConfigWarning({
    message: 'Potential typo in _payload',
    configKey: 'def456',
    context: {
      keyMap: {
        def456: { key: 'requests.0.properties._payload', '~r': 'ref2', '~l': 25 },
      },
      refMap: {
        ref2: { path: 'requests/getData.yaml' },
      },
      directories: { config: '/project' },
    },
  });
  expect(result).toContain('[Config Warning] Potential typo in _payload');
  expect(result).toContain('requests/getData.yaml:25');
});

test('formatConfigWarning includes source file info', () => {
  const result = formatConfigWarning({
    message: 'Step reference not found',
    configKey: 'ghi789',
    context: {
      keyMap: {
        ghi789: { key: 'api.endpoints.0.routine._step', '~r': 'ref3', '~l': 42 },
      },
      refMap: {
        ref3: { path: 'api/endpoints.yaml' },
      },
      directories: { config: '/app' },
    },
  });
  expect(result).toContain('[Config Warning] Step reference not found');
  expect(result).toContain('api/endpoints.yaml:42');
});

test('suppresses warning when object has ~throw: false', () => {
  const result = formatConfigWarning({
    message: '_state reference not found',
    configKey: 'key-123',
    context: {
      keyMap: {
        'key-123': {
          key: 'blocks.0.properties',
          '~r': 'ref-1',
          '~l': 15,
          '~throw': false,
        },
      },
      refMap: { 'ref-1': { path: 'pages/home.yaml' } },
      directories: { config: '/app' },
    },
  });

  expect(result).toBe('');
});
