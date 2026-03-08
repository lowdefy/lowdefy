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

test('normalizeClassAndStyles strips -- prefix from class object keys', () => {
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
            class: { '--block': 'a', '--element': 'b' },
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

test('normalizeClassAndStyles handles -- prefixed keys in style', () => {
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
            style: { '--element': { color: 'red' }, '--block': { marginTop: 20 } },
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

test('normalizeClassAndStyles merges old styles (plural) into style', () => {
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
            styles: { block: { padding: 5, color: 'blue' }, element: { fontSize: 16 } },
          },
        ],
      },
    ],
  };
  const res = buildPages({ components, context });
  expect(get(res, 'pages.0.slots.content.blocks.0.style')).toEqual({
    block: { padding: 5, color: 'blue' },
    element: { fontSize: 16 },
  });
  expect(get(res, 'pages.0.slots.content.blocks.0.styles')).toBeUndefined();
});

test('normalizeClassAndStyles merges flat style with old styles.block (styles.block overrides)', () => {
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
            style: { marginTop: 20, padding: 10 },
            styles: { block: { padding: 5, color: 'blue' } },
          },
        ],
      },
    ],
  };
  const res = buildPages({ components, context });
  expect(get(res, 'pages.0.slots.content.blocks.0.style')).toEqual({
    block: { marginTop: 20, padding: 5, color: 'blue' },
  });
  expect(get(res, 'pages.0.slots.content.blocks.0.styles')).toBeUndefined();
});

test('normalizeClassAndStyles merges properties.style and --element (--element overrides)', () => {
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
            style: { '--element': { fontSize: 16, fontWeight: 'bold' } },
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
