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

import { serializer } from '@lowdefy/helpers';
import parseTestYaml from '../test/parseTestYaml.js';
import testContext from '../test/testContext.js';
import makeId from '../utils/makeId.js';

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
    2: {
      '~k_parent': '1',
      '~r': '1',
      '~l': 2,
      key: 'root',
    },
    3: {
      '~k_parent': '2',
      '~r': '2',
      '~l': 3,
      key: 'root.pages[0:A:Box]',
    },
    4: {
      '~k_parent': '3',
      '~r': '3',
      '~l': 6,
      key: 'root.pages[0:A:Box].blocks[0:A1:Button]',
    },
    5: {
      '~k_parent': '3',
      '~r': '4',
      '~l': 8,
      key: 'root.pages[0:A:Box].blocks[1:A2:Button]',
    },
    6: {
      '~k_parent': '2',
      '~r': '5',
      '~l': 10,
      key: 'root.pages[1:B:Box]',
    },
    7: {
      '~k_parent': '6',
      '~r': '6',
      '~l': 13,
      key: 'root.pages[1:B:Box].blocks[0:B1:Button]',
    },
    8: {
      '~k_parent': '6',
      '~r': '7',
      '~l': 15,
      key: 'root.pages[1:B:Box].blocks[1:B2:Button]',
    },
    9: {
      '~k_parent': '8',
      '~r': '8',
      '~l': 17,
      key: 'root.pages[1:B:Box].blocks[1:B2:Button].properties',
    },
  });
  expect(JSON.parse(serializer.serializeToString(components))).toEqual({
    '~k': '2',
    pages: [
      {
        '~k': '3',
        blocks: [
          {
            '~k': '4',
            id: 'A1',
            type: 'Button',
          },
          {
            '~k': '5',
            id: 'A2',
            type: 'Button',
          },
        ],
        id: 'A',
        type: 'Box',
      },
      {
        '~k': '6',
        blocks: [
          {
            '~k': '7',
            id: 'B1',
            type: 'Button',
          },
          {
            '~k': '8',
            id: 'B2',
            type: 'Button',
            properties: {
              '~k': '9',
              title: 'X',
            },
          },
        ],
        id: 'B',
        type: 'Box',
      },
    ],
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
    2: {
      key: 'root',
      '~r': '1',
      '~l': 2,
      '~k_parent': '1',
    },
    3: {
      key: 'root.pages[0:A1:Selector]',
      '~r': '2',
      '~l': 3,
      '~k_parent': '2',
    },
    4: {
      key: 'root.pages[0:A1:Selector].properties',
      '~r': '3',
      '~l': 5,
      '~k_parent': '3',
    },
    5: {
      key: 'root.pages[0:A1:Selector].properties.options[0]',
      '~r': '4',
      '~l': 7,
      '~k_parent': '4',
    },
    6: {
      key: 'root.pages[0:A1:Selector].properties.options[0]._array.concat[0]',
      '~r': '5',
      '~l': 8,
      '~k_parent': '5',
    },
    7: {
      key: 'root.pages[0:A1:Selector].properties.options[0]._array.concat[0]',
      '~r': '6',
      '~l': 9,
      '~k_parent': '5',
    },
  });
  expect(JSON.parse(serializer.serializeToString(components))).toEqual({
    pages: [
      {
        id: 'A1',
        type: 'Selector',
        properties: {
          options: [
            {
              '_array.concat': [[{ value: 'A', '~k': '6' }], [{ value: 'B', '~k': '7' }]],
              '~k': '5',
            },
          ],
          '~k': '4',
        },
        '~k': '3',
      },
    ],
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

  const page = components.pages[0];
  const block = page.blocks[0];
  const props = block.properties;

  addKeys({ components, context });

  // Verify ~r and ~l are removed from components after processing
  expect(components['~r']).toBeUndefined();
  expect(components['~l']).toBeUndefined();
  expect(page['~r']).toBeUndefined();
  expect(page['~l']).toBeUndefined();
  expect(block['~r']).toBeUndefined();
  expect(block['~l']).toBeUndefined();
  expect(props['~r']).toBeUndefined();
  expect(props['~l']).toBeUndefined();

  // Verify ~k is added
  expect(components['~k']).toBe('2');
  expect(page['~k']).toBe('3');
  expect(block['~k']).toBe('4');
  expect(props['~k']).toBe('5');
});
