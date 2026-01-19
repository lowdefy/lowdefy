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

import ConfigError from './ConfigError.js';

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
      '~ignoreBuildCheck': true,
    },
  },
  refMap: {
    ref1: { path: 'pages/test.yaml' },
  },
  directories: {
    config: '/app',
  },
};

describe('ConfigError instance', () => {
  test('creates error with formatted message', () => {
    const error = new ConfigError({
      message: 'Test error message.',
      configKey: 'testKey',
      context: mockContext,
    });

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ConfigError);
    expect(error.name).toBe('ConfigError');
    expect(error.message).toContain('[Config Error]');
    expect(error.message).toContain('Test error message.');
    expect(error.suppressed).toBe(false);
  });

  test('sets suppressed to true when ~ignoreBuildCheck is true', () => {
    const error = new ConfigError({
      message: 'This should be suppressed.',
      configKey: 'suppressedKey',
      context: mockContext,
    });

    expect(error.suppressed).toBe(true);
    expect(error.message).toBe('');
  });

  test('works without context', () => {
    const error = new ConfigError({
      message: 'Error without context.',
    });

    expect(error.message).toContain('[Config Error]');
    expect(error.message).toContain('Error without context.');
    expect(error.suppressed).toBe(false);
  });

  test('can be thrown and caught as ConfigError', () => {
    expect(() => {
      throw new ConfigError({
        message: 'Thrown error.',
        configKey: 'testKey',
        context: mockContext,
      });
    }).toThrow(ConfigError);
  });

  test('can be caught as Error', () => {
    expect(() => {
      throw new ConfigError({
        message: 'Thrown error.',
        configKey: 'testKey',
        context: mockContext,
      });
    }).toThrow(Error);
  });
});

describe('ConfigError.format', () => {
  test('formats message with [Config Error] prefix and location', () => {
    const result = ConfigError.format({
      message: 'Test message.',
      configKey: 'testKey',
      context: mockContext,
    });

    expect(result).toContain('[Config Error]');
    expect(result).toContain('Test message.');
    expect(result).toContain('pages/test.yaml:10');
    expect(result).toContain('root.pages[0].blocks[0]');
  });

  test('returns empty string when suppressed', () => {
    const result = ConfigError.format({
      message: 'Suppressed message.',
      configKey: 'suppressedKey',
      context: mockContext,
    });

    expect(result).toBe('');
  });

  test('formats without location when no context', () => {
    const result = ConfigError.format({
      message: 'No context message.',
    });

    expect(result).toBe('[Config Error] No context message.');
  });

  test('formats with operatorLocation', () => {
    const result = ConfigError.format({
      message: 'Operator error.',
      operatorLocation: { ref: 'ref1', line: 15 },
      context: mockContext,
    });

    expect(result).toContain('[Config Error]');
    expect(result).toContain('Operator error.');
    expect(result).toContain('pages/test.yaml:15');
  });

  test('formats with raw filePath and lineNumber', () => {
    const result = ConfigError.format({
      message: 'File error.',
      filePath: 'config/test.yaml',
      lineNumber: 25,
      configDirectory: '/app',
    });

    expect(result).toContain('[Config Error]');
    expect(result).toContain('File error.');
    expect(result).toContain('config/test.yaml:25');
  });
});

describe('ConfigError with error parameter (YAML parse errors)', () => {
  test('creates ConfigError from YAML parse error with line number', () => {
    const yamlError = new Error('Invalid YAML at line 5, column 3');

    const error = new ConfigError({
      error: yamlError,
      filePath: 'lowdefy.yaml',
      configDirectory: '/app',
    });

    expect(error).toBeInstanceOf(ConfigError);
    expect(error.message).toContain('[Config Error]');
    expect(error.message).toContain('Could not parse YAML.');
    expect(error.message).toContain('Invalid YAML at line 5, column 3');
    expect(error.message).toContain('lowdefy.yaml:5');
  });

  test('creates ConfigError from YAML parse error without line number in message', () => {
    const yamlError = new Error('Unexpected end of file');

    const error = new ConfigError({
      error: yamlError,
      filePath: 'lowdefy.yaml',
      configDirectory: '/app',
    });

    expect(error).toBeInstanceOf(ConfigError);
    expect(error.message).toContain('[Config Error]');
    expect(error.message).toContain('Could not parse YAML.');
    expect(error.message).toContain('Unexpected end of file');
    expect(error.message).toContain('lowdefy.yaml');
  });
});
