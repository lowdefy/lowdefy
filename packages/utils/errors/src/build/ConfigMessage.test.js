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

describe('ConfigMessage.resolveLocation', () => {
  test('returns null for missing configKey', () => {
    const result = ConfigMessage.resolveLocation({
      configKey: null,
      context: { keyMap, refMap },
    });
    expect(result).toBeNull();
  });

  test('returns null for missing keyMap in context', () => {
    const result = ConfigMessage.resolveLocation({
      configKey: 'abc123',
      context: { refMap },
    });
    expect(result).toBeNull();
  });

  test('resolves location from configKey', () => {
    const result = ConfigMessage.resolveLocation({
      configKey: 'abc123',
      context: { keyMap, refMap, directories: { config: '/app' } },
    });
    expect(result).toEqual({
      source: 'pages/home.yaml:5',
      config: 'root.pages[0:home].blocks[0:header]',
      link: '/app/pages/home.yaml:5',
    });
  });
});

describe('ConfigMessage.resolveOperatorLocation', () => {
  test('returns null for missing operatorLocation', () => {
    const result = ConfigMessage.resolveOperatorLocation({
      operatorLocation: null,
      context: { refMap },
    });
    expect(result).toBeNull();
  });

  test('resolves location from ref and line', () => {
    const result = ConfigMessage.resolveOperatorLocation({
      operatorLocation: { ref: 'ref1', line: 25 },
      context: { refMap },
    });
    expect(result).toEqual({
      source: 'pages/home.yaml:25',
      link: null,
    });
  });

  test('includes configDirectory in link', () => {
    const result = ConfigMessage.resolveOperatorLocation({
      operatorLocation: { ref: 'ref1', line: 25 },
      context: { refMap, directories: { config: '/app' } },
    });
    expect(result.link).toBe('/app/pages/home.yaml:25');
  });

  test('defaults to lowdefy.yaml when ref not found', () => {
    const result = ConfigMessage.resolveOperatorLocation({
      operatorLocation: { ref: 'notfound', line: 10 },
      context: { refMap },
    });
    expect(result.source).toBe('lowdefy.yaml:10');
  });

  test('handles missing line number', () => {
    const result = ConfigMessage.resolveOperatorLocation({
      operatorLocation: { ref: 'ref1' },
      context: { refMap },
    });
    expect(result.source).toBe('pages/home.yaml');
  });
});

describe('ConfigMessage.resolveRawLocation', () => {
  test('resolves location from filePath and lineNumber', () => {
    const result = ConfigMessage.resolveRawLocation({
      filePath: 'config.yaml',
      lineNumber: 15,
    });
    expect(result).toEqual({
      source: 'config.yaml:15',
      link: null,
    });
  });

  test('includes configDirectory in link', () => {
    const result = ConfigMessage.resolveRawLocation({
      filePath: 'config.yaml',
      lineNumber: 15,
      configDirectory: '/myapp',
    });
    expect(result.link).toBe('/myapp/config.yaml:15');
  });

  test('handles missing line number', () => {
    const result = ConfigMessage.resolveRawLocation({
      filePath: 'config.yaml',
    });
    expect(result.source).toBe('config.yaml');
  });
});
