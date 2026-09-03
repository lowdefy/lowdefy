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

import { jest } from '@jest/globals';

import { get } from '@lowdefy/helpers';
import buildPages from '../../full/buildPages.js';
import testContext from '../../../test-utils/testContext.js';

const mockLogWarn = jest.fn();
const mockLog = jest.fn();

const logger = {
  warn: mockLogWarn,
  log: mockLog,
};

const auth = {
  public: true,
};

const context = testContext({ logger });

// Context with blockMetas for "did you mean" hint tests
const contextWithMetas = testContext({ logger });
contextWithMetas.blockMetas = {
  Input: {
    cssKeys: {
      element: 'The element.',
      header: 'The header.',
      body: 'The body.',
    },
  },
};

beforeEach(() => {
  mockLogWarn.mockReset();
  mockLog.mockReset();
});

test('normalizeClassAndStyles wraps flat style as style.block', () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        type: 'Container',
        auth,
        blocks: [
          {
            id: 'block_1',
            type: 'Input',
            style: { marginTop: 20 },
          },
        ],
      },
    ],
  };
  const res = buildPages({ components, context });
  expect(get(res, 'pages.0.slots.content.blocks.0.style')).toEqual({
    block: { marginTop: 20 },
  });
  expect(get(res, 'pages.0.slots.content.blocks.0.styles')).toBeUndefined();
});

test('normalizeClassAndStyles converts class string to object', () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        type: 'Container',
        auth,
        blocks: [
          {
            id: 'block_1',
            type: 'Input',
            class: 'shadow-lg',
          },
        ],
      },
    ],
  };
  const res = buildPages({ components, context });
  expect(get(res, 'pages.0.slots.content.blocks.0.class')).toEqual({
    block: 'shadow-lg',
  });
});

test('normalizeClassAndStyles converts class array to object', () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        type: 'Container',
        auth,
        blocks: [
          {
            id: 'block_1',
            type: 'Input',
            class: ['shadow-lg', 'p-4'],
          },
        ],
      },
    ],
  };
  const res = buildPages({ components, context });
  expect(get(res, 'pages.0.slots.content.blocks.0.class')).toEqual({
    block: ['shadow-lg', 'p-4'],
  });
});

test('normalizeClassAndStyles keeps class object with plain keys unchanged', () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        type: 'Container',
        auth,
        blocks: [
          {
            id: 'block_1',
            type: 'Input',
            class: { block: 'a', header: 'b' },
          },
        ],
      },
    ],
  };
  const res = buildPages({ components, context });
  expect(get(res, 'pages.0.slots.content.blocks.0.class')).toEqual({
    block: 'a',
    header: 'b',
  });
});

test('normalizeClassAndStyles strips / prefix from class object keys', () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        type: 'Container',
        auth,
        blocks: [
          {
            id: 'block_1',
            type: 'Input',
            class: { '.block': 'a', '.element': 'b' },
          },
        ],
      },
    ],
  };
  const res = buildPages({ components, context });
  expect(get(res, 'pages.0.slots.content.blocks.0.class')).toEqual({
    block: 'a',
    element: 'b',
  });
});

test('normalizeClassAndStyles moves properties.style to style.element', () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        type: 'Container',
        auth,
        blocks: [
          {
            id: 'block_1',
            type: 'Input',
            properties: {
              title: 'Test',
              style: { color: 'red' },
            },
          },
        ],
      },
    ],
  };
  const res = buildPages({ components, context });
  expect(get(res, 'pages.0.slots.content.blocks.0.style')).toEqual({
    element: { color: 'red' },
  });
  expect(get(res, 'pages.0.slots.content.blocks.0.styles')).toBeUndefined();
  expect(get(res, 'pages.0.slots.content.blocks.0.properties.style')).toBeUndefined();
  expect(get(res, 'pages.0.slots.content.blocks.0.properties.title')).toEqual('Test');
});

test('normalizeClassAndStyles handles / prefixed keys in style', () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        type: 'Container',
        auth,
        blocks: [
          {
            id: 'block_1',
            type: 'Input',
            style: { '.element': { color: 'red' }, '.block': { marginTop: 20 } },
          },
        ],
      },
    ],
  };
  const res = buildPages({ components, context });
  expect(get(res, 'pages.0.slots.content.blocks.0.style')).toEqual({
    element: { color: 'red' },
    block: { marginTop: 20 },
  });
});


test('normalizeClassAndStyles merges properties.style and /element (/element overrides)', () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        type: 'Container',
        auth,
        blocks: [
          {
            id: 'block_1',
            type: 'Input',
            properties: {
              style: { color: 'red', fontSize: 14 },
            },
            style: { '.element': { fontSize: 16, fontWeight: 'bold' } },
          },
        ],
      },
    ],
  };
  const res = buildPages({ components, context });
  expect(get(res, 'pages.0.slots.content.blocks.0.style')).toEqual({
    element: { color: 'red', fontSize: 16, fontWeight: 'bold' },
  });
  expect(get(res, 'pages.0.slots.content.blocks.0.properties.style')).toBeUndefined();
});

test('normalizeClassAndStyles throws ConfigError for responsive breakpoint keys in style', () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        type: 'Container',
        auth,
        blocks: [
          {
            id: 'block_1',
            type: 'Input',
            style: { sm: { padding: 5 }, marginTop: 20 },
          },
        ],
      },
    ],
  };
  expect(() => buildPages({ components, context })).toThrow(
    'Responsive breakpoint keys (sm) in "style" are no longer supported'
  );
});

test('normalizeClassAndStyles does not modify block without style, class, or styles', () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        type: 'Container',
        auth,
        blocks: [
          {
            id: 'block_1',
            type: 'Input',
            properties: { title: 'Test' },
          },
        ],
      },
    ],
  };
  const res = buildPages({ components, context });
  expect(get(res, 'pages.0.slots.content.blocks.0.style')).toBeUndefined();
  expect(get(res, 'pages.0.slots.content.blocks.0.styles')).toBeUndefined();
  expect(get(res, 'pages.0.slots.content.blocks.0.class')).toBeUndefined();
});

test('normalizeClassAndStyles throws for nested object in flat style', () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        type: 'Container',
        auth,
        blocks: [
          {
            id: 'block_1',
            type: 'Input',
            style: { color: 'red', hover: { color: 'blue' } },
          },
        ],
      },
    ],
  };
  expect(() => buildPages({ components, context })).toThrow(
    'Style property "hover" has a nested object value'
  );
});

test('normalizeClassAndStyles throws for nested object in /block slot', () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        type: 'Container',
        auth,
        blocks: [
          {
            id: 'block_1',
            type: 'Input',
            style: { '.block': { color: 'red', typography: { fontSize: 14 } } },
          },
        ],
      },
    ],
  };
  expect(() => buildPages({ components, context })).toThrow(
    'Style property "typography" has a nested object value'
  );
});

test('normalizeClassAndStyles throws for nested object in /element slot', () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        type: 'Container',
        auth,
        blocks: [
          {
            id: 'block_1',
            type: 'Input',
            style: { '.element': { padding: 10, wrapper: { margin: 5 } } },
          },
        ],
      },
    ],
  };
  expect(() => buildPages({ components, context })).toThrow(
    'Style property "wrapper" has a nested object value'
  );
});

test('normalizeClassAndStyles allows operator object as style value', () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        type: 'Container',
        auth,
        blocks: [
          {
            id: 'block_1',
            type: 'Input',
            style: { '.block': { color: { _state: 'theme.color' } } },
          },
        ],
      },
    ],
  };
  const res = buildPages({ components, context });
  expect(get(res, 'pages.0.slots.content.blocks.0.style')).toEqual({
    block: { color: { _state: 'theme.color' } },
  });
});

test('normalizeClassAndStyles allows operator as entire slot value', () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        type: 'Container',
        auth,
        blocks: [
          {
            id: 'block_1',
            type: 'Input',
            style: {
              '.block': {
                _if: { test: true, then: { color: 'red' }, else: { color: 'blue' } },
              },
            },
          },
        ],
      },
    ],
  };
  const res = buildPages({ components, context });
  expect(get(res, 'pages.0.slots.content.blocks.0.style')).toEqual({
    block: { _if: { test: true, then: { color: 'red' }, else: { color: 'blue' } } },
  });
});

test('normalizeClassAndStyles does not treat _id as an operator in style validation', () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        type: 'Container',
        auth,
        blocks: [
          {
            id: 'block_1',
            type: 'Input',
            style: { '.block': { color: 'red', nested: { _id: 'some_id' } } },
          },
        ],
      },
    ],
  };
  expect(() => buildPages({ components, context })).toThrow(
    'Style property "nested" has a nested object value'
  );
});

test('normalizeClassAndStyles preserves operator objects in style (not treated as breakpoints)', () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        type: 'Container',
        auth,
        blocks: [
          {
            id: 'block_1',
            type: 'Input',
            style: { _if: { test: true, then: { marginTop: 20 }, else: { marginTop: 0 } } },
          },
        ],
      },
    ],
  };
  const res = buildPages({ components, context });
  expect(get(res, 'pages.0.slots.content.blocks.0.style')).toEqual({
    block: { _if: { test: true, then: { marginTop: 20 }, else: { marginTop: 0 } } },
  });
});

test('normalizeClassAndStyles handles both flat style and properties.style together', () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        type: 'Container',
        auth,
        blocks: [
          {
            id: 'block_1',
            type: 'Input',
            style: { marginTop: 20 },
            properties: {
              style: { color: 'red' },
            },
          },
        ],
      },
    ],
  };
  const res = buildPages({ components, context });
  expect(get(res, 'pages.0.slots.content.blocks.0.style')).toEqual({
    block: { marginTop: 20 },
    element: { color: 'red' },
  });
  expect(get(res, 'pages.0.slots.content.blocks.0.styles')).toBeUndefined();
  expect(get(res, 'pages.0.slots.content.blocks.0.properties.style')).toBeUndefined();
});

// ── "Did you mean" hint tests ──

test('style nested object matching cssKey includes "Did you mean" hint', () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        type: 'Container',
        auth,
        blocks: [
          {
            id: 'block_1',
            type: 'Input',
            style: { header: { background: 'red' } },
          },
        ],
      },
    ],
  };
  expect(() => buildPages({ components, context: contextWithMetas })).toThrow(
    'Did you mean ".header"?'
  );
});

test('style nested object not matching cssKey has no hint', () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        type: 'Container',
        auth,
        blocks: [
          {
            id: 'block_1',
            type: 'Input',
            style: { hover: { color: 'blue' } },
          },
        ],
      },
    ],
  };
  expect(() => buildPages({ components, context: contextWithMetas })).toThrow(
    'Style property "hover" has a nested object value'
  );
  expect(() => buildPages({ components, context: contextWithMetas })).not.toThrow(
    'Did you mean'
  );
});

test('class non-dot key matching cssKey throws with "Did you mean" hint', () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        type: 'Container',
        auth,
        blocks: [
          {
            id: 'block_1',
            type: 'Input',
            class: { element: 'text-lg', header: 'bg-red' },
          },
        ],
      },
    ],
  };
  expect(() => buildPages({ components, context: contextWithMetas })).toThrow(
    'Did you mean ".element"?'
  );
});

test('class non-dot key not matching cssKey passes through', () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        type: 'Container',
        auth,
        blocks: [
          {
            id: 'block_1',
            type: 'Input',
            class: { custom: 'text-lg' },
          },
        ],
      },
    ],
  };
  const res = buildPages({ components, context: contextWithMetas });
  expect(get(res, 'pages.0.slots.content.blocks.0.class')).toEqual({
    custom: 'text-lg',
  });
});

test('class dot-prefixed keys are always stripped', () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        type: 'Container',
        auth,
        blocks: [
          {
            id: 'block_1',
            type: 'Input',
            class: { '.element': 'text-lg', '.header': 'bg-red' },
          },
        ],
      },
    ],
  };
  const res = buildPages({ components, context: contextWithMetas });
  expect(get(res, 'pages.0.slots.content.blocks.0.class')).toEqual({
    element: 'text-lg',
    header: 'bg-red',
  });
});

// ── Operator values in class ──

test('normalizeClass moves a root operator under the block slot', () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        type: 'Container',
        auth,
        blocks: [
          {
            id: 'block_1',
            type: 'Box',
            class: { _if: [{ _state: 'x' }, 'bg-red-500', 'bg-blue-500'] },
          },
        ],
      },
    ],
  };
  const res = buildPages({ components, context });
  expect(get(res, 'pages.0.slots.content.blocks.0.class')).toEqual({
    block: { _if: [{ _state: 'x' }, 'bg-red-500', 'bg-blue-500'] },
  });
});

test('normalizeClass does not run the cssKeys check on a root operator', () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        type: 'Container',
        auth,
        blocks: [
          {
            id: 'block_1',
            type: 'Input',
            class: { _get: { key: 'element', from: { _state: true } } },
          },
        ],
      },
    ],
  };
  const res = buildPages({ components, context: contextWithMetas });
  expect(get(res, 'pages.0.slots.content.blocks.0.class')).toEqual({
    block: { _get: { key: 'element', from: { _state: true } } },
  });
});

test('normalizeClass keeps an operator under a slot key', () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        type: 'Container',
        auth,
        blocks: [
          {
            id: 'block_1',
            type: 'Input',
            class: {
              '.element': { _if: [{ _state: 'x' }, 'bg-red-500', 'bg-blue-500'] },
              '.header': 'bg-gray-100',
            },
          },
        ],
      },
    ],
  };
  const res = buildPages({ components, context: contextWithMetas });
  expect(get(res, 'pages.0.slots.content.blocks.0.class')).toEqual({
    element: { _if: [{ _state: 'x' }, 'bg-red-500', 'bg-blue-500'] },
    header: 'bg-gray-100',
  });
});

test('normalizeClass still handles a string, an array and a plain slot map', () => {
  const components = {
    pages: [
      {
        id: 'page_1',
        type: 'Container',
        auth,
        blocks: [
          { id: 'block_1', type: 'Box', class: 'p-4 shadow' },
          { id: 'block_2', type: 'Box', class: ['p-4', 'shadow'] },
          { id: 'block_3', type: 'Input', class: { '.element': 'p-4', '.body': 'shadow' } },
        ],
      },
    ],
  };
  const res = buildPages({ components, context: contextWithMetas });
  expect(get(res, 'pages.0.slots.content.blocks.0.class')).toEqual({ block: 'p-4 shadow' });
  expect(get(res, 'pages.0.slots.content.blocks.1.class')).toEqual({ block: ['p-4', 'shadow'] });
  expect(get(res, 'pages.0.slots.content.blocks.2.class')).toEqual({
    element: 'p-4',
    body: 'shadow',
  });
});
