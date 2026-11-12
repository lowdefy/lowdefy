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

import { serializer } from '@lowdefy/helpers';
import parseTestYaml from '../test-utils/parseTestYaml.js';
import testContext from '../test-utils/testContext.js';
import makeId from '../utils/makeId.js';
import { expect, test } from 'vitest';

test('mutate keyMap and components', async () => {
  makeId.reset();
  const context = testContext();
  const addKeys = (await import('./addKeys.js')).default;

  const components = parseTestYaml(`
pages:
  - id: A
    type: Box
    blocks:
      - id: A1
        type: Button
      - id: A2
        type: Button
  - id: B
    type: Box
    blocks:
      - id: B1
        type: Button
      - id: B2
        type: Button
        properties:
          title: X
`);

  addKeys({ components, context });
  expect(context.keyMap).toEqual({
    2: { s: 'root', p: '1', r: '1', l: 2 },
    3: { s: '.pages', p: '2', r: '2', l: 2 },
    4: { s: '[0:A:Box]', p: '3', r: '3', l: 3 },
    5: { s: '.blocks', p: '4', r: '4', l: 5 },
    6: { s: '[0:A1:Button]', p: '5', r: '5', l: 6 },
    7: { s: '[1:A2:Button]', p: '5', r: '6', l: 8 },
    8: { s: '[1:B:Box]', p: '3', r: '7', l: 10 },
    9: { s: '.blocks', p: '8', r: '8', l: 12 },
    a: { s: '[0:B1:Button]', p: '9', r: '9', l: 13 },
    b: { s: '[1:B2:Button]', p: '9', r: '10', l: 15 },
    c: { s: '.properties', p: 'b', r: '11', l: 17 },
  });
  expect(JSON.parse(serializer.serializeToString(components))).toEqual({
    '~k': '2',
    pages: {
      '~arr': [
        {
          '~k': '4',
          blocks: {
            '~arr': [
              {
                '~k': '6',
                id: 'A1',
                type: 'Button',
              },
              {
                '~k': '7',
                id: 'A2',
                type: 'Button',
              },
            ],
            '~k': '5',
          },
          id: 'A',
          type: 'Box',
        },
        {
          '~k': '8',
          blocks: {
            '~arr': [
              {
                '~k': 'a',
                id: 'B1',
                type: 'Button',
              },
              {
                '~k': 'b',
                id: 'B2',
                type: 'Button',
                properties: {
                  '~k': 'c',
                  title: 'X',
                },
              },
            ],
            '~k': '9',
          },
          id: 'B',
          type: 'Box',
        },
      ],
      '~k': '3',
    },
  });
});

test('Handle nested arrays', async () => {
  makeId.reset();
  const context = testContext();
  const addKeys = (await import('./addKeys.js')).default;

  const components = parseTestYaml(`
pages:
  - id: A1
    type: Selector
    properties:
      options:
        - _array.concat:
            - - value: A
            - - value: B
`);

  addKeys({ components, context });
  expect(context.keyMap).toEqual({
    2: { s: 'root', p: '1', r: '1', l: 2 },
    3: { s: '.pages', p: '2', r: '2', l: 2 },
    4: { s: '[0:A1:Selector]', p: '3', r: '3', l: 3 },
    5: { s: '.properties', p: '4', r: '4', l: 5 },
    6: { s: '.options', p: '5', r: '5', l: 6 },
    7: { s: '[0]', p: '6', r: '6', l: 7 },
    8: { s: '._array.concat', p: '7', r: '7', l: 7 },
    9: { s: '[0]', p: '8', r: '8', l: 8 },
    a: { s: '[0]', p: '9', r: '9', l: 8 },
    b: { s: '[1]', p: '8', r: '10', l: 9 },
    c: { s: '[0]', p: 'b', r: '11', l: 9 },
  });
  expect(JSON.parse(serializer.serializeToString(components))).toEqual({
    pages: {
      '~arr': [
        {
          id: 'A1',
          type: 'Selector',
          properties: {
            options: {
              '~arr': [
                {
                  '_array.concat': {
                    '~arr': [
                      {
                        '~arr': [{ value: 'A', '~k': 'a' }],
                        '~k': '9',
                      },
                      {
                        '~arr': [{ value: 'B', '~k': 'c' }],
                        '~k': 'b',
                      },
                    ],
                    '~k': '8',
                  },
                  '~k': '7',
                },
              ],
              '~k': '6',
            },
            '~k': '5',
          },
          '~k': '4',
        },
      ],
      '~k': '3',
    },
    '~k': '2',
  });
});

test('removes ~r and ~l from components after processing', async () => {
  makeId.reset();
  const context = testContext();
  const addKeys = (await import('./addKeys.js')).default;

  const components = parseTestYaml(`
pages:
  - id: home
    type: Box
    blocks:
      - id: header
        type: Title
        properties:
          content: Hello
`);

  const pagesArr = components.pages;
  const page = components.pages[0];
  const blocksArr = page.blocks;
  const block = page.blocks[0];
  const props = block.properties;

  addKeys({ components, context });

  // Verify ~r and ~l are removed from objects after processing
  expect(components['~r']).toBeUndefined();
  expect(components['~l']).toBeUndefined();
  expect(page['~r']).toBeUndefined();
  expect(page['~l']).toBeUndefined();
  expect(block['~r']).toBeUndefined();
  expect(block['~l']).toBeUndefined();
  expect(props['~r']).toBeUndefined();
  expect(props['~l']).toBeUndefined();

  // Verify ~r and ~l are removed from arrays after processing
  expect(pagesArr['~r']).toBeUndefined();
  expect(pagesArr['~l']).toBeUndefined();
  expect(blocksArr['~r']).toBeUndefined();
  expect(blocksArr['~l']).toBeUndefined();

  // Verify ~k is added to objects
  expect(components['~k']).toBe('2');
  expect(page['~k']).toBe('4');
  expect(block['~k']).toBe('6');
  expect(props['~k']).toBe('7');

  // Verify ~k is added to arrays
  expect(pagesArr['~k']).toBe('3');
  expect(blocksArr['~k']).toBe('5');
});
