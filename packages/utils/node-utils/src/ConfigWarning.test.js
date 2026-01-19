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
import ConfigWarning from './ConfigWarning.js';

const mockContext = {
  stage: 'dev',
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

const mockProdContext = {
  ...mockContext,
  stage: 'prod',
};

describe('ConfigWarning.format', () => {
  test('formats with [Config Warning] prefix', () => {
    const result = ConfigWarning.format({
      message: 'Warning message.',
      configKey: 'testKey',
      context: mockContext,
    });

    expect(result).toContain('[Config Warning]');
    expect(result).toContain('Warning message.');
    expect(result).toContain('pages/test.yaml:10');
  });

  test('returns empty string when suppressed', () => {
    const result = ConfigWarning.format({
      message: 'Suppressed warning.',
      configKey: 'suppressedKey',
      context: mockContext,
    });

    expect(result).toBe('');
  });

  test('formats without location when no context', () => {
    const result = ConfigWarning.format({
      message: 'No context warning.',
    });

    expect(result).toBe('[Config Warning] No context warning.');
  });

  test('formats with operatorLocation', () => {
    const result = ConfigWarning.format({
      message: 'Operator warning.',
      operatorLocation: { ref: 'ref1', line: 15 },
      context: mockContext,
    });

    expect(result).toContain('[Config Warning]');
    expect(result).toContain('Operator warning.');
    expect(result).toContain('pages/test.yaml:15');
  });

  test('formats with raw filePath and lineNumber', () => {
    const result = ConfigWarning.format({
      message: 'File warning.',
      filePath: 'config/test.yaml',
      lineNumber: 25,
      configDirectory: '/app',
    });

    expect(result).toContain('[Config Warning]');
    expect(result).toContain('File warning.');
    expect(result).toContain('config/test.yaml:25');
  });

  test('throws ConfigError in prod mode when prodError is true', () => {
    expect(() =>
      ConfigWarning.format({
        message: 'Prod error.',
        configKey: 'testKey',
        context: mockProdContext,
        prodError: true,
      })
    ).toThrow(ConfigError);
  });

  test('returns warning in dev mode even when prodError is true', () => {
    const result = ConfigWarning.format({
      message: 'Dev warning.',
      configKey: 'testKey',
      context: mockContext,
      prodError: true,
    });

    expect(result).toContain('[Config Warning]');
    expect(result).toContain('Dev warning.');
  });

  test('returns warning in prod mode when prodError is false', () => {
    const result = ConfigWarning.format({
      message: 'Prod warning.',
      configKey: 'testKey',
      context: mockProdContext,
      prodError: false,
    });

    expect(result).toContain('[Config Warning]');
    expect(result).toContain('Prod warning.');
  });

  test('returns warning in prod mode when prodError is undefined', () => {
    const result = ConfigWarning.format({
      message: 'Prod warning.',
      configKey: 'testKey',
      context: mockProdContext,
    });

    expect(result).toContain('[Config Warning]');
    expect(result).toContain('Prod warning.');
  });
});
