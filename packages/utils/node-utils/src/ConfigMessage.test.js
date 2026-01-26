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

import ConfigMessage from './ConfigMessage.js';

const mockContext = {
  keyMap: {
    testKey: {
      key: 'root.pages[0].blocks[0]',
      '~r': 'ref1',
      '~l': 10,
    },
    suppressedKey: {
      key: 'root.pages[0].blocks[1]',
      '~r': 'ref1',
      '~l': 20,
      '~ignoreBuildChecks': true,
    },
    keyWithoutRef: {
      key: 'root.pages[0].blocks[2]',
      '~l': 30,
    },
  },
  refMap: {
    ref1: { path: 'pages/test.yaml' },
  },
  directories: {
    config: '/app',
  },
};

describe('ConfigMessage.shouldSuppress', () => {
  test('returns false when configKey is not in keyMap', () => {
    expect(ConfigMessage.shouldSuppress({ configKey: 'nonexistent', keyMap: mockContext.keyMap })).toBe(false);
  });

  test('returns false when keyMap is undefined', () => {
    expect(ConfigMessage.shouldSuppress({ configKey: 'testKey', keyMap: undefined })).toBe(false);
  });

  test('returns false when configKey is undefined', () => {
    expect(ConfigMessage.shouldSuppress({ configKey: undefined, keyMap: mockContext.keyMap })).toBe(false);
  });

  test('returns false when ~ignoreBuildChecks is not set', () => {
    expect(ConfigMessage.shouldSuppress({ configKey: 'testKey', keyMap: mockContext.keyMap })).toBe(false);
  });

  test('returns true when ~ignoreBuildChecks is true', () => {
    expect(ConfigMessage.shouldSuppress({ configKey: 'suppressedKey', keyMap: mockContext.keyMap })).toBe(true);
  });
});

describe('ConfigMessage.format', () => {
  test('formats message with prefix and location from configKey', () => {
    const result = ConfigMessage.format({
      prefix: '[Test]',
      message: 'Test message.',
      configKey: 'testKey',
      context: mockContext,
    });

    expect(result).toContain('[Test]');
    expect(result).toContain('Test message.');
    expect(result).toContain('pages/test.yaml:10');
    expect(result).toContain('root.pages[0].blocks[0]');
  });

  test('returns empty string when suppressed', () => {
    const result = ConfigMessage.format({
      prefix: '[Test]',
      message: 'Suppressed message.',
      configKey: 'suppressedKey',
      context: mockContext,
    });

    expect(result).toBe('');
  });

  test('formats without location when no context', () => {
    const result = ConfigMessage.format({
      prefix: '[Test]',
      message: 'No context message.',
    });

    expect(result).toBe('[Test] No context message.');
  });

  test('formats with operatorLocation', () => {
    const result = ConfigMessage.format({
      prefix: '[Test]',
      message: 'Operator error.',
      operatorLocation: { ref: 'ref1', line: 15 },
      context: mockContext,
    });

    expect(result).toContain('[Test]');
    expect(result).toContain('Operator error.');
    expect(result).toContain('pages/test.yaml:15');
  });

  test('formats with operatorLocation without line number', () => {
    const result = ConfigMessage.format({
      prefix: '[Test]',
      message: 'Operator error.',
      operatorLocation: { ref: 'ref1' },
      context: mockContext,
    });

    expect(result).toContain('[Test]');
    expect(result).toContain('Operator error.');
    expect(result).toContain('pages/test.yaml');
    expect(result).not.toContain(':undefined');
  });

  test('formats with raw filePath and lineNumber', () => {
    const result = ConfigMessage.format({
      prefix: '[Test]',
      message: 'File error.',
      filePath: 'config/test.yaml',
      lineNumber: 25,
      configDirectory: '/app',
    });

    expect(result).toContain('[Test]');
    expect(result).toContain('File error.');
    expect(result).toContain('config/test.yaml:25');
  });

  test('formats with raw filePath without lineNumber', () => {
    const result = ConfigMessage.format({
      prefix: '[Test]',
      message: 'File error.',
      filePath: 'config/test.yaml',
      configDirectory: '/app',
    });

    expect(result).toContain('[Test]');
    expect(result).toContain('File error.');
    expect(result).toContain('config/test.yaml');
    expect(result).not.toContain(':undefined');
  });

  test('falls back to lowdefy.yaml when ref not found in refMap', () => {
    const result = ConfigMessage.format({
      prefix: '[Test]',
      message: 'Unknown ref.',
      operatorLocation: { ref: 'unknown', line: 5 },
      context: mockContext,
    });

    expect(result).toContain('lowdefy.yaml:5');
  });
});
