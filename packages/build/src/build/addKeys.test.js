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
import testContext from '../test/testContext.js';

test('mutate keyMap and components', async () => {
  const context = testContext();
  const addKeys = (await import('./addKeys.js')).default;
  const components = {
    '~r': '1',
    pages: [
      {
        id: 'A',
        type: 'Box',
        '~r': '2',
        blocks: [
          { '~r': '3', id: 'A1', type: 'Button' },
          { '~r': '7', id: 'A2', type: 'Button' },
        ],
      },
      {
        id: 'B',
        type: 'Box',
        '~r': '5',
        blocks: [
          { '~r': '4', id: 'B1', type: 'Button' },
          { '~r': '6', id: 'B2', type: 'Button', properties: { '~r': '10', title: 'X' } },
        ],
      },
    ],
  };
  addKeys({ components, context });
  expect(context.keyMap).toEqual({
    2: {
      '~k_parent': '1',
      '~r': '1',
      key: 'root',
    },
    3: {
      '~k_parent': '2',
      '~r': '2',
      key: 'root.pages[0:A:Box]',
    },
    4: {
      '~k_parent': '3',
      '~r': '3',
      key: 'root.pages[0:A:Box].blocks[0:A1:Button]',
    },
    5: {
      '~k_parent': '3',
      '~r': '7',
      key: 'root.pages[0:A:Box].blocks[1:A2:Button]',
    },
    6: {
      '~k_parent': '2',
      '~r': '5',
      key: 'root.pages[1:B:Box]',
    },
    7: {
      '~k_parent': '6',
      '~r': '4',
      key: 'root.pages[1:B:Box].blocks[0:B1:Button]',
    },
    8: {
      '~k_parent': '6',
      '~r': '6',
      key: 'root.pages[1:B:Box].blocks[1:B2:Button]',
    },
    9: {
      '~k_parent': '8',
      '~r': '10',
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
  const context = testContext();
  const addKeys = (await import('./addKeys.js')).default;
  const components = {
    '~r': '1',
    pages: [
      {
        '~r': '2',
        id: 'A1',
        type: 'Selector',
        properties: {
          '~r': '3',
          options: [
            {
              '~r': '4',
              '_array.concat': [[{ '~r': '5', value: 'A' }], [{ '~r': '6', value: 'B' }]],
            },
          ],
        },
      },
    ],
  };
  addKeys({ components, context });
  expect(context.keyMap).toEqual({
    2: { key: 'root', '~r': '1', '~k_parent': '1' },
    3: { key: 'root.pages[0:A1:Selector]', '~r': '2', '~k_parent': '2' },
    4: { key: 'root.pages[0:A1:Selector].properties', '~r': '3', '~k_parent': '3' },
    5: { key: 'root.pages[0:A1:Selector].properties.options[0]', '~r': '4', '~k_parent': '4' },
    6: {
      key: 'root.pages[0:A1:Selector].properties.options[0]._array.concat[0]',
      '~r': '5',
      '~k_parent': '5',
    },
    7: {
      key: 'root.pages[0:A1:Selector].properties.options[0]._array.concat[0]',
      '~r': '6',
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
