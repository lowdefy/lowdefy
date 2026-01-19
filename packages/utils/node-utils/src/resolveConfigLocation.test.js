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

import path from 'path';
import resolveConfigLocation from './resolveConfigLocation.js';

const mockKeyMap = {
  key1: { key: 'pages.0.blocks.0', '~r': 'ref1', '~l': 15 },
  key2: { key: 'pages.0.blocks.1', '~r': 'ref1' },
  key3: { key: 'connections.0' },
};

const mockRefMap = {
  ref1: { path: 'pages/home.yaml' },
};

test('resolves location with full info', () => {
  const result = resolveConfigLocation({
    configKey: 'key1',
    keyMap: mockKeyMap,
    refMap: mockRefMap,
    configDirectory: '/Users/dev/myapp',
  });
  expect(result).toEqual({
    source: 'pages/home.yaml:15',
    config: 'pages.0.blocks.0',
    link: path.resolve('/Users/dev/myapp', 'pages/home.yaml') + ':15',
  });
});

test('resolves location without line number', () => {
  const result = resolveConfigLocation({
    configKey: 'key2',
    keyMap: mockKeyMap,
    refMap: mockRefMap,
    configDirectory: '/Users/dev/myapp',
  });
  expect(result).toEqual({
    source: 'pages/home.yaml',
    config: 'pages.0.blocks.1',
    link: path.resolve('/Users/dev/myapp', 'pages/home.yaml'),
  });
});

test('resolves location without ref (defaults to lowdefy.yaml)', () => {
  const result = resolveConfigLocation({
    configKey: 'key3',
    keyMap: mockKeyMap,
    refMap: mockRefMap,
    configDirectory: '/Users/dev/myapp',
  });
  expect(result).toEqual({
    source: 'lowdefy.yaml',
    config: 'connections.0',
    link: path.resolve('/Users/dev/myapp', 'lowdefy.yaml'),
  });
});

test('returns null for unknown configKey', () => {
  const result = resolveConfigLocation({
    configKey: 'unknown',
    keyMap: mockKeyMap,
    refMap: mockRefMap,
  });
  expect(result).toBeNull();
});

test('returns null when keyMap is null', () => {
  const result = resolveConfigLocation({
    configKey: 'key1',
    keyMap: null,
    refMap: mockRefMap,
  });
  expect(result).toBeNull();
});

test('resolves location without configDirectory', () => {
  const result = resolveConfigLocation({
    configKey: 'key1',
    keyMap: mockKeyMap,
    refMap: mockRefMap,
  });
  expect(result).toEqual({
    source: 'pages/home.yaml:15',
    config: 'pages.0.blocks.0',
    link: null,
  });
});
