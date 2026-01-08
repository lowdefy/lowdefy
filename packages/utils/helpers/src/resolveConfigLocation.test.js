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

import { describe, expect, test } from '@jest/globals';

import resolveConfigLocation from './resolveConfigLocation.js';

describe('resolveConfigLocation', () => {
  const keyMap = {
    key1: {
      key: 'root.pages[0:home].blocks[0:header:Title]',
      '~r': 'ref1',
      '~k_parent': 'key0',
    },
    key2: {
      key: 'root.pages[1:about].blocks[0:content]',
      '~r': 'ref2',
      '~k_parent': 'key0',
    },
    key3: {
      key: 'root.pages[0:home].requests[0:getData]',
      // No ~r - should default to lowdefy.yaml
      '~k_parent': 'key1',
    },
  };

  const refMap = {
    ref1: {
      path: 'pages/home.yaml',
      parent: 'ref0',
    },
    ref2: {
      path: 'pages/about.yaml',
      parent: 'ref0',
    },
  };

  test('resolves config key to location with file and path', () => {
    const result = resolveConfigLocation({
      configKey: 'key1',
      keyMap,
      refMap,
    });

    expect(result).toEqual({
      path: 'root.pages[0:home].blocks[0:header:Title]',
      file: 'pages/home.yaml',
      formatted: 'pages/home.yaml at root.pages[0:home].blocks[0:header:Title]',
    });
  });

  test('resolves different config key', () => {
    const result = resolveConfigLocation({
      configKey: 'key2',
      keyMap,
      refMap,
    });

    expect(result).toEqual({
      path: 'root.pages[1:about].blocks[0:content]',
      file: 'pages/about.yaml',
      formatted: 'pages/about.yaml at root.pages[1:about].blocks[0:content]',
    });
  });

  test('returns null when configKey is null', () => {
    const result = resolveConfigLocation({
      configKey: null,
      keyMap,
      refMap,
    });

    expect(result).toBeNull();
  });

  test('returns null when configKey is undefined', () => {
    const result = resolveConfigLocation({
      configKey: undefined,
      keyMap,
      refMap,
    });

    expect(result).toBeNull();
  });

  test('returns null when keyMap is null', () => {
    const result = resolveConfigLocation({
      configKey: 'key1',
      keyMap: null,
      refMap,
    });

    expect(result).toBeNull();
  });

  test('returns null when configKey not found in keyMap', () => {
    const result = resolveConfigLocation({
      configKey: 'nonexistent',
      keyMap,
      refMap,
    });

    expect(result).toBeNull();
  });

  test('defaults to lowdefy.yaml when refId not in refMap', () => {
    const result = resolveConfigLocation({
      configKey: 'key3',
      keyMap,
      refMap,
    });

    expect(result).toEqual({
      path: 'root.pages[0:home].requests[0:getData]',
      file: 'lowdefy.yaml',
      formatted: 'lowdefy.yaml at root.pages[0:home].requests[0:getData]',
    });
  });

  test('handles null refMap', () => {
    const result = resolveConfigLocation({
      configKey: 'key1',
      keyMap,
      refMap: null,
    });

    expect(result).toEqual({
      path: 'root.pages[0:home].blocks[0:header:Title]',
      file: 'lowdefy.yaml',
      formatted: 'lowdefy.yaml at root.pages[0:home].blocks[0:header:Title]',
    });
  });
});
