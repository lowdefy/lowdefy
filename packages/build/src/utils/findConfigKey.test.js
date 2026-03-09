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

import findConfigKey from './findConfigKey.js';

test('returns root configKey when path is empty', () => {
  const components = {
    '~k': 'root-key',
    pages: [],
  };
  const result = findConfigKey({ components, instancePath: [] });
  expect(result).toBe('root-key');
});

test('returns root configKey when no deeper key exists', () => {
  const components = {
    '~k': 'root-key',
    global: {
      title: 'Test',
    },
  };
  const result = findConfigKey({ components, instancePath: ['global'] });
  expect(result).toBe('root-key');
});

test('returns deepest configKey found in path', () => {
  const components = {
    '~k': 'root-key',
    pages: [
      {
        '~k': 'page-key',
        id: 'home',
        blocks: [
          {
            '~k': 'block-key',
            id: 'button',
          },
        ],
      },
    ],
  };
  const result = findConfigKey({ components, instancePath: ['pages', '0', 'blocks', '0'] });
  expect(result).toBe('block-key');
});

test('returns intermediate configKey when deeper object has no key', () => {
  const components = {
    '~k': 'root-key',
    pages: [
      {
        '~k': 'page-key',
        id: 'home',
        properties: {
          title: 'Home',
        },
      },
    ],
  };
  const result = findConfigKey({ components, instancePath: ['pages', '0', 'properties', 'title'] });
  expect(result).toBe('page-key');
});

test('handles array indices correctly', () => {
  const components = {
    '~k': 'root-key',
    connections: [
      { '~k': 'conn-0-key', id: 'conn1' },
      { '~k': 'conn-1-key', id: 'conn2' },
    ],
  };
  const result = findConfigKey({ components, instancePath: ['connections', '1'] });
  expect(result).toBe('conn-1-key');
});

test('returns undefined when components has no configKey', () => {
  const components = {
    pages: [],
  };
  const result = findConfigKey({ components, instancePath: [] });
  expect(result).toBeUndefined();
});

test('handles null in path gracefully', () => {
  const components = {
    '~k': 'root-key',
    pages: null,
  };
  const result = findConfigKey({ components, instancePath: ['pages', '0'] });
  expect(result).toBe('root-key');
});

test('handles undefined in path gracefully', () => {
  const components = {
    '~k': 'root-key',
    pages: [{ '~k': 'page-key' }],
  };
  const result = findConfigKey({ components, instancePath: ['pages', '0', 'nonexistent', 'deep'] });
  expect(result).toBe('page-key');
});

test('handles deeply nested structure', () => {
  const components = {
    '~k': 'root-key',
    pages: [
      {
        '~k': 'page-key',
        blocks: [
          {
            '~k': 'block-key',
            areas: {
              content: {
                '~k': 'area-key',
                blocks: [
                  {
                    '~k': 'nested-block-key',
                    events: {
                      onClick: [
                        {
                          '~k': 'action-key',
                          id: 'action1',
                        },
                      ],
                    },
                  },
                ],
              },
            },
          },
        ],
      },
    ],
  };
  const result = findConfigKey({
    components,
    instancePath: [
      'pages',
      '0',
      'blocks',
      '0',
      'areas',
      'content',
      'blocks',
      '0',
      'events',
      'onClick',
      '0',
    ],
  });
  expect(result).toBe('action-key');
});
