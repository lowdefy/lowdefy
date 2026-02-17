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

import resolveConfigLocation from './resolveConfigLocation.js';

const keyMap = {
  abc123: {
    key: 'root.pages[0:home].blocks[0:header]',
    '~r': 'ref1',
    '~l': 5,
  },
  def456: {
    key: 'root.connections[0:mongodb]',
    '~r': 'ref2',
    '~l': 42,
  },
  noLine: {
    key: 'root.global',
    '~r': 'ref1',
  },
  noRef: {
    key: 'root.something',
    '~l': 10,
  },
};

const refMap = {
  ref1: { path: 'pages/home.yaml' },
  ref2: { path: 'connections/mongodb.yaml' },
};

test('resolveConfigLocation returns null for missing configKey', () => {
  expect(resolveConfigLocation({ configKey: null, keyMap, refMap })).toBeNull();
  expect(resolveConfigLocation({ configKey: undefined, keyMap, refMap })).toBeNull();
  expect(resolveConfigLocation({ configKey: '', keyMap, refMap })).toBeNull();
});

test('resolveConfigLocation returns null for missing keyMap', () => {
  expect(resolveConfigLocation({ configKey: 'abc123', keyMap: null, refMap })).toBeNull();
  expect(resolveConfigLocation({ configKey: 'abc123', keyMap: undefined, refMap })).toBeNull();
});

test('resolveConfigLocation returns null for configKey not in keyMap', () => {
  expect(resolveConfigLocation({ configKey: 'notfound', keyMap, refMap })).toBeNull();
});

test('resolveConfigLocation resolves full location with absolute path', () => {
  const result = resolveConfigLocation({
    configKey: 'abc123',
    keyMap,
    refMap,
    configDirectory: '/Users/dev/myapp',
  });

  expect(result).toEqual({
    source: '/Users/dev/myapp/pages/home.yaml:5',
    config: 'root.pages[0:home].blocks[0:header]',
  });
});

test('resolveConfigLocation handles different file paths', () => {
  const result = resolveConfigLocation({
    configKey: 'def456',
    keyMap,
    refMap,
    configDirectory: '/app',
  });

  expect(result).toEqual({
    source: '/app/connections/mongodb.yaml:42',
    config: 'root.connections[0:mongodb]',
  });
});

test('resolveConfigLocation without configDirectory uses relative path', () => {
  const result = resolveConfigLocation({
    configKey: 'abc123',
    keyMap,
    refMap,
  });

  expect(result).toEqual({
    source: 'pages/home.yaml:5',
    config: 'root.pages[0:home].blocks[0:header]',
  });
});

test('resolveConfigLocation without line number', () => {
  const result = resolveConfigLocation({
    configKey: 'noLine',
    keyMap,
    refMap,
    configDirectory: '/app',
  });

  expect(result).toEqual({
    source: '/app/pages/home.yaml',
    config: 'root.global',
  });
});

test('resolveConfigLocation defaults to lowdefy.yaml when ref not found', () => {
  const result = resolveConfigLocation({
    configKey: 'noRef',
    keyMap,
    refMap,
    configDirectory: '/app',
  });

  expect(result).toEqual({
    source: '/app/lowdefy.yaml:10',
    config: 'root.something',
  });
});

test('resolveConfigLocation with null refMap uses lowdefy.yaml', () => {
  const result = resolveConfigLocation({
    configKey: 'abc123',
    keyMap,
    refMap: null,
  });

  expect(result).toEqual({
    source: 'lowdefy.yaml:5',
    config: 'root.pages[0:home].blocks[0:header]',
  });
});
