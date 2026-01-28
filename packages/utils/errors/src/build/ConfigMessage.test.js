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

import ConfigMessage, { VALID_CHECK_SLUGS } from './ConfigMessage.js';

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
  withParent: {
    key: 'root.pages[0:home].blocks[0:header].properties',
    '~r': 'ref1',
    '~l': 10,
    '~k_parent': 'parentWithIgnore',
  },
  parentWithIgnore: {
    key: 'root.pages[0:home].blocks[0:header]',
    '~r': 'ref1',
    '~l': 5,
    '~ignoreBuildChecks': true,
  },
  parentWithPartialIgnore: {
    key: 'root.pages[0:home]',
    '~r': 'ref1',
    '~l': 1,
    '~ignoreBuildChecks': ['state-refs', 'link-refs'],
  },
  childOfPartial: {
    key: 'root.pages[0:home].blocks',
    '~r': 'ref1',
    '~l': 20,
    '~k_parent': 'parentWithPartialIgnore',
  },
};

const refMap = {
  ref1: { path: 'pages/home.yaml' },
  ref2: { path: 'connections/mongodb.yaml' },
};

describe('VALID_CHECK_SLUGS', () => {
  test('exports valid check slugs', () => {
    expect(VALID_CHECK_SLUGS['state-refs']).toBeDefined();
    expect(VALID_CHECK_SLUGS['payload-refs']).toBeDefined();
    expect(VALID_CHECK_SLUGS['link-refs']).toBeDefined();
    expect(VALID_CHECK_SLUGS['request-refs']).toBeDefined();
    expect(VALID_CHECK_SLUGS['types']).toBeDefined();
    expect(VALID_CHECK_SLUGS['schema']).toBeDefined();
  });
});

describe('ConfigMessage.shouldSuppress', () => {
  test('returns false for missing configKey', () => {
    expect(ConfigMessage.shouldSuppress({ configKey: null, keyMap })).toBe(false);
    expect(ConfigMessage.shouldSuppress({ configKey: undefined, keyMap })).toBe(false);
  });

  test('returns false for missing keyMap', () => {
    expect(ConfigMessage.shouldSuppress({ configKey: 'abc123', keyMap: null })).toBe(false);
  });

  test('returns false for configKey not in keyMap', () => {
    expect(ConfigMessage.shouldSuppress({ configKey: 'notfound', keyMap })).toBe(false);
  });

  test('returns false for entry without ignoreBuildChecks', () => {
    expect(ConfigMessage.shouldSuppress({ configKey: 'abc123', keyMap })).toBe(false);
  });

  test('returns true when parent has ignoreBuildChecks: true', () => {
    expect(ConfigMessage.shouldSuppress({ configKey: 'withParent', keyMap })).toBe(true);
  });

  test('returns true when entry itself has ignoreBuildChecks: true', () => {
    expect(ConfigMessage.shouldSuppress({ configKey: 'parentWithIgnore', keyMap })).toBe(true);
  });

  test('returns true when parent has matching checkSlug in array', () => {
    expect(
      ConfigMessage.shouldSuppress({
        configKey: 'childOfPartial',
        keyMap,
        checkSlug: 'state-refs',
      })
    ).toBe(true);

    expect(
      ConfigMessage.shouldSuppress({
        configKey: 'childOfPartial',
        keyMap,
        checkSlug: 'link-refs',
      })
    ).toBe(true);
  });

  test('returns false when parent has non-matching checkSlug', () => {
    expect(
      ConfigMessage.shouldSuppress({
        configKey: 'childOfPartial',
        keyMap,
        checkSlug: 'types',
      })
    ).toBe(false);
  });
});

describe('ConfigMessage.format', () => {
  test('formats message without location', () => {
    const result = ConfigMessage.format({
      prefix: '[Config Error]',
      message: 'Test error',
    });
    expect(result).toBe('[Config Error] Test error');
  });

  test('formats message with configKey and context (mode 1)', () => {
    const result = ConfigMessage.format({
      prefix: '[Config Error]',
      message: 'Invalid block',
      configKey: 'abc123',
      context: { keyMap, refMap },
    });
    expect(result).toBe('pages/home.yaml:5\n[Config Error] Invalid block');
  });

  test('formats message with operatorLocation (mode 2)', () => {
    const result = ConfigMessage.format({
      prefix: '[Config Warning]',
      message: 'Deprecated operator',
      operatorLocation: { ref: 'ref1', line: 15 },
      context: { refMap },
    });
    expect(result).toBe('pages/home.yaml:15\n[Config Warning] Deprecated operator');
  });

  test('formats message with raw filePath and lineNumber (mode 3)', () => {
    const result = ConfigMessage.format({
      prefix: '[Config Error]',
      message: 'YAML parse error',
      filePath: 'lowdefy.yaml',
      lineNumber: 42,
    });
    expect(result).toBe('lowdefy.yaml:42\n[Config Error] YAML parse error');
  });

  test('formats message with filePath only (no line number)', () => {
    const result = ConfigMessage.format({
      prefix: '[Config Error]',
      message: 'File not found',
      filePath: 'config.yaml',
    });
    expect(result).toBe('config.yaml\n[Config Error] File not found');
  });

  test('returns empty string when suppressed', () => {
    const result = ConfigMessage.format({
      prefix: '[Config Warning]',
      message: 'State reference not found',
      configKey: 'withParent',
      context: { keyMap, refMap },
      checkSlug: 'state-refs',
    });
    expect(result).toBe('');
  });

  test('uses configDirectory from context', () => {
    const result = ConfigMessage.format({
      prefix: '[Config Error]',
      message: 'Test',
      filePath: 'test.yaml',
      lineNumber: 1,
      context: { directories: { config: '/app' } },
    });
    expect(result).toBe('test.yaml:1\n[Config Error] Test');
  });

  test('uses explicit configDirectory over context', () => {
    const result = ConfigMessage.format({
      prefix: '[Config Error]',
      message: 'Test',
      filePath: 'test.yaml',
      lineNumber: 1,
      configDirectory: '/explicit',
      context: { directories: { config: '/context' } },
    });
    expect(result).toBe('test.yaml:1\n[Config Error] Test');
  });
});

describe('ConfigMessage._resolveOperatorLocation', () => {
  test('resolves location from ref and line', () => {
    const result = ConfigMessage._resolveOperatorLocation({
      operatorLocation: { ref: 'ref1', line: 25 },
      refMap,
    });
    expect(result).toEqual({
      source: 'pages/home.yaml:25',
      link: '',
    });
  });

  test('includes configDirectory in link', () => {
    const result = ConfigMessage._resolveOperatorLocation({
      operatorLocation: { ref: 'ref1', line: 25 },
      refMap,
      configDirectory: '/app',
    });
    expect(result.link).toBe('/app/pages/home.yaml:25');
  });

  test('defaults to lowdefy.yaml when ref not found', () => {
    const result = ConfigMessage._resolveOperatorLocation({
      operatorLocation: { ref: 'notfound', line: 10 },
      refMap,
    });
    expect(result.source).toBe('lowdefy.yaml:10');
  });

  test('handles missing line number', () => {
    const result = ConfigMessage._resolveOperatorLocation({
      operatorLocation: { ref: 'ref1' },
      refMap,
    });
    expect(result.source).toBe('pages/home.yaml');
  });
});

describe('ConfigMessage._resolveRawLocation', () => {
  test('resolves location from filePath and lineNumber', () => {
    const result = ConfigMessage._resolveRawLocation({
      filePath: 'config.yaml',
      lineNumber: 15,
    });
    expect(result).toEqual({
      source: 'config.yaml:15',
      link: '',
    });
  });

  test('includes configDirectory in link', () => {
    const result = ConfigMessage._resolveRawLocation({
      filePath: 'config.yaml',
      lineNumber: 15,
      configDirectory: '/myapp',
    });
    expect(result.link).toBe('/myapp/config.yaml:15');
  });

  test('handles missing line number', () => {
    const result = ConfigMessage._resolveRawLocation({
      filePath: 'config.yaml',
    });
    expect(result.source).toBe('config.yaml');
  });
});
