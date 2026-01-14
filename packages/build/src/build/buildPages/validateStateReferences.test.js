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

import { jest } from '@jest/globals';

import validateStateReferences from './validateStateReferences.js';
import testContext from '../../test/testContext.js';

const mockLogWarn = jest.fn();

const logger = {
  warn: mockLogWarn,
};

beforeEach(() => {
  mockLogWarn.mockReset();
});

test('validateStateReferences no warnings for valid references', () => {
  const context = testContext({ logger });
  const page = {
    pageId: 'page_1',
    blockId: 'page_1',
    areas: {
      content: {
        blocks: [
          {
            blockId: 'myInput',
            type: 'TextInput',
          },
        ],
      },
    },
    properties: {
      title: {
        _state: 'myInput',
      },
    },
  };
  validateStateReferences({ page, context });
  expect(mockLogWarn).not.toHaveBeenCalled();
});

test('validateStateReferences warns for undefined top-level state key', () => {
  const context = testContext({ logger });
  const page = {
    pageId: 'page_1',
    blockId: 'page_1',
    properties: {
      title: {
        _state: 'undefinedKey',
      },
    },
  };
  validateStateReferences({ page, context });
  expect(mockLogWarn).toHaveBeenCalledTimes(1);
  expect(mockLogWarn.mock.calls[0][0]).toContain('_state references "undefinedKey" on page "page_1"');
  expect(mockLogWarn.mock.calls[0][0]).toContain('no input block with id "undefinedKey" exists');
});

test('validateStateReferences warns for nested path with undefined top-level key', () => {
  const context = testContext({ logger });
  const page = {
    pageId: 'page_1',
    blockId: 'page_1',
    properties: {
      title: {
        _state: 'user.profile.name',
      },
    },
  };
  validateStateReferences({ page, context });
  expect(mockLogWarn).toHaveBeenCalledTimes(1);
  expect(mockLogWarn.mock.calls[0][0]).toContain('_state references "user" on page "page_1"');
  expect(mockLogWarn.mock.calls[0][0]).toContain('no input block with id "user" exists');
});

test('validateStateReferences allows nested path with valid top-level key', () => {
  const context = testContext({ logger });
  const page = {
    pageId: 'page_1',
    blockId: 'page_1',
    areas: {
      content: {
        blocks: [
          {
            blockId: 'user',
            type: 'TextInput',
          },
        ],
      },
    },
    properties: {
      title: {
        _state: 'user.profile.name',
      },
    },
  };
  validateStateReferences({ page, context });
  expect(mockLogWarn).not.toHaveBeenCalled();
});

test('validateStateReferences handles object param format', () => {
  const context = testContext({ logger });
  const page = {
    pageId: 'page_1',
    blockId: 'page_1',
    properties: {
      title: {
        _state: {
          key: 'undefinedKey.nested',
          default: 'fallback',
        },
      },
    },
  };
  validateStateReferences({ page, context });
  expect(mockLogWarn).toHaveBeenCalledTimes(1);
  expect(mockLogWarn.mock.calls[0][0]).toContain('_state references "undefinedKey" on page "page_1"');
});

test('validateStateReferences handles array index in path', () => {
  const context = testContext({ logger });
  const page = {
    pageId: 'page_1',
    blockId: 'page_1',
    areas: {
      content: {
        blocks: [
          {
            blockId: 'items',
            type: 'List',
          },
        ],
      },
    },
    properties: {
      title: {
        _state: 'items[0].name',
      },
    },
  };
  validateStateReferences({ page, context });
  expect(mockLogWarn).not.toHaveBeenCalled();
});

test('validateStateReferences collects blockIds from nested areas', () => {
  const context = testContext({ logger });
  const page = {
    pageId: 'page_1',
    blockId: 'page_1',
    areas: {
      content: {
        blocks: [
          {
            blockId: 'container',
            type: 'Container',
            areas: {
              content: {
                blocks: [
                  {
                    blockId: 'nestedInput',
                    type: 'TextInput',
                  },
                ],
              },
            },
          },
        ],
      },
    },
    properties: {
      title: {
        _state: 'nestedInput',
      },
    },
  };
  validateStateReferences({ page, context });
  expect(mockLogWarn).not.toHaveBeenCalled();
});

test('validateStateReferences finds references in nested properties', () => {
  const context = testContext({ logger });
  const page = {
    pageId: 'page_1',
    blockId: 'page_1',
    areas: {
      content: {
        blocks: [
          {
            blockId: 'button',
            type: 'Button',
            properties: {
              disabled: {
                _state: 'undefinedField',
              },
            },
          },
        ],
      },
    },
  };
  validateStateReferences({ page, context });
  expect(mockLogWarn).toHaveBeenCalledTimes(1);
  expect(mockLogWarn.mock.calls[0][0]).toContain('_state references "undefinedField" on page "page_1"');
  expect(mockLogWarn.mock.calls[0][0]).toContain('Check for typos');
});

test('validateStateReferences deduplicates warnings for same key', () => {
  const context = testContext({ logger });
  const page = {
    pageId: 'page_1',
    blockId: 'page_1',
    properties: {
      field1: { _state: 'missing' },
      field2: { _state: 'missing' },
      field3: { _state: 'missing.nested' },
    },
  };
  validateStateReferences({ page, context });
  // Should only warn once for "missing" even though it's used 3 times
  expect(mockLogWarn).toHaveBeenCalledTimes(1);
  expect(mockLogWarn.mock.calls[0][0]).toContain('_state references "missing"');
});

test('validateStateReferences allows state keys set by SetState in page events', () => {
  const context = testContext({ logger });
  const page = {
    pageId: 'page_1',
    blockId: 'page_1',
    events: {
      onMount: [
        {
          id: 'initialize',
          type: 'SetState',
          params: {
            selector_options: [
              { label: 'Option 1', value: 'opt1' },
              { label: 'Option 2', value: 'opt2' },
            ],
          },
        },
      ],
    },
    areas: {
      content: {
        blocks: [
          {
            blockId: 'mySelector',
            type: 'Selector',
            properties: {
              options: {
                _state: 'selector_options',
              },
            },
          },
        ],
      },
    },
  };
  validateStateReferences({ page, context });
  expect(mockLogWarn).not.toHaveBeenCalled();
});

test('validateStateReferences allows state keys set by SetState in block events', () => {
  const context = testContext({ logger });
  const page = {
    pageId: 'page_1',
    blockId: 'page_1',
    areas: {
      content: {
        blocks: [
          {
            blockId: 'button',
            type: 'Button',
            events: {
              onClick: [
                {
                  id: 'setData',
                  type: 'SetState',
                  params: {
                    clickData: { clicked: true },
                  },
                },
              ],
            },
          },
          {
            blockId: 'display',
            type: 'Paragraph',
            properties: {
              content: {
                _state: 'clickData.clicked',
              },
            },
          },
        ],
      },
    },
  };
  validateStateReferences({ page, context });
  expect(mockLogWarn).not.toHaveBeenCalled();
});

test('validateStateReferences handles SetState with nested path keys', () => {
  const context = testContext({ logger });
  const page = {
    pageId: 'page_1',
    blockId: 'page_1',
    events: {
      onMount: [
        {
          id: 'setNested',
          type: 'SetState',
          params: {
            'user.profile.name': 'John',
          },
        },
      ],
    },
    properties: {
      title: {
        _state: 'user.profile.name',
      },
    },
  };
  validateStateReferences({ page, context });
  expect(mockLogWarn).not.toHaveBeenCalled();
});

test('validateStateReferences handles SetState with array bracket notation', () => {
  const context = testContext({ logger });
  const page = {
    pageId: 'page_1',
    blockId: 'page_1',
    events: {
      onMount: [
        {
          id: 'setArray',
          type: 'SetState',
          params: {
            'items[0].value': 'first',
          },
        },
      ],
    },
    properties: {
      content: {
        _state: 'items[0].value',
      },
    },
  };
  validateStateReferences({ page, context });
  expect(mockLogWarn).not.toHaveBeenCalled();
});

test('validateStateReferences allows both input blocks and SetState keys', () => {
  const context = testContext({ logger });
  const page = {
    pageId: 'page_1',
    blockId: 'page_1',
    events: {
      onMount: [
        {
          id: 'setDefaults',
          type: 'SetState',
          params: {
            config: { theme: 'dark' },
          },
        },
      ],
    },
    areas: {
      content: {
        blocks: [
          {
            blockId: 'username',
            type: 'TextInput',
          },
        ],
      },
    },
    properties: {
      field1: { _state: 'username' },
      field2: { _state: 'config.theme' },
    },
  };
  validateStateReferences({ page, context });
  expect(mockLogWarn).not.toHaveBeenCalled();
});

test('validateStateReferences still warns for truly undefined keys with SetState present', () => {
  const context = testContext({ logger });
  const page = {
    pageId: 'page_1',
    blockId: 'page_1',
    events: {
      onMount: [
        {
          id: 'setData',
          type: 'SetState',
          params: {
            validKey: 'value',
          },
        },
      ],
    },
    properties: {
      title: {
        _state: 'typoKey',
      },
    },
  };
  validateStateReferences({ page, context });
  expect(mockLogWarn).toHaveBeenCalledTimes(1);
  expect(mockLogWarn.mock.calls[0][0]).toContain('_state references "typoKey"');
});
