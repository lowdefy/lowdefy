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

import formatConfigMessage from './formatConfigMessage.js';

const mockContext = {
  keyMap: {
    key1: { key: 'pages.0.blocks.0', '~r': 'ref1', '~l': 15 },
    key2: { key: 'pages.0.blocks.1', '~r': 'ref1' },
    key3: { key: 'connections.0' },
  },
  refMap: {
    ref1: { path: 'pages/home.yaml' },
  },
  directories: {
    config: '/Users/dev/myapp',
  },
};

test('formatConfigMessage with full location info', () => {
  const result = formatConfigMessage({
    prefix: '[Config Error]',
    message: 'Block type "Buton" not found.',
    configKey: 'key1',
    context: mockContext,
  });
  expect(result).toBe(
    '[Config Error] Block type "Buton" not found.\n  pages/home.yaml:15 at pages.0.blocks.0\n  /Users/dev/myapp/pages/home.yaml:15'
  );
});

test('formatConfigMessage with warning prefix', () => {
  const result = formatConfigMessage({
    prefix: '[Config Warning]',
    message: '_state references undefined key.',
    configKey: 'key1',
    context: mockContext,
  });
  expect(result).toBe(
    '[Config Warning] _state references undefined key.\n  pages/home.yaml:15 at pages.0.blocks.0\n  /Users/dev/myapp/pages/home.yaml:15'
  );
});

test('formatConfigMessage without line number', () => {
  const result = formatConfigMessage({
    prefix: '[Config Error]',
    message: 'Connection missing.',
    configKey: 'key2',
    context: mockContext,
  });
  expect(result).toBe(
    '[Config Error] Connection missing.\n  pages/home.yaml at pages.0.blocks.1\n  /Users/dev/myapp/pages/home.yaml'
  );
});

test('formatConfigMessage without ref', () => {
  const result = formatConfigMessage({
    prefix: '[Config Error]',
    message: 'Invalid connection.',
    configKey: 'key3',
    context: mockContext,
  });
  expect(result).toBe(
    '[Config Error] Invalid connection.\n  lowdefy.yaml at connections.0\n  /Users/dev/myapp/lowdefy.yaml'
  );
});

test('formatConfigMessage without configKey', () => {
  const result = formatConfigMessage({
    prefix: '[Config Error]',
    message: 'Something went wrong.',
    configKey: null,
    context: mockContext,
  });
  expect(result).toBe('[Config Error] Something went wrong.');
});

test('formatConfigMessage without context', () => {
  const result = formatConfigMessage({
    prefix: '[Config Warning]',
    message: 'Missing field.',
    configKey: 'key1',
    context: null,
  });
  expect(result).toBe('[Config Warning] Missing field.');
});

test('formatConfigMessage with unknown configKey', () => {
  const result = formatConfigMessage({
    prefix: '[Config Error]',
    message: 'Unknown error.',
    configKey: 'unknown',
    context: mockContext,
  });
  expect(result).toBe('[Config Error] Unknown error.');
});

test('formatConfigMessage with custom prefix', () => {
  const result = formatConfigMessage({
    prefix: '[Config Info]',
    message: 'Processing complete.',
    configKey: 'key1',
    context: mockContext,
  });
  expect(result).toContain('[Config Info]');
});

test('formatConfigMessage without configDirectory', () => {
  const contextNoDir = {
    keyMap: mockContext.keyMap,
    refMap: mockContext.refMap,
    directories: {},
  };
  const result = formatConfigMessage({
    prefix: '[Config Error]',
    message: 'Error occurred.',
    configKey: 'key1',
    context: contextNoDir,
  });
  expect(result).toBe(
    '[Config Error] Error occurred.\n  pages/home.yaml:15 at pages.0.blocks.0\n  '
  );
});
