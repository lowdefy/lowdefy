/*
  Copyright 2020-2023 Lowdefy, Inc

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
import { serializer } from '@lowdefy/helpers';
import testContext from '../test/testContext.js';

const context = testContext();

jest.unstable_mockModule('uuid', () => {
  let i = 0;
  return {
    v4: () => `${i++}`,
  };
});

test('mutate keyMap and components', async () => {
  const addKeys = (await import('./addKeys.js')).default;
  const components = {
    _r_: '1',
    pages: [
      {
        id: 'A',
        type: 'Box',
        _r_: '2',
        blocks: [
          { _r_: '3', id: 'A1', type: 'Button' },
          { _r_: '7', id: 'A2', type: 'Button' },
        ],
      },
      {
        id: 'B',
        type: 'Box',
        _r_: '5',
        blocks: [
          { _r_: '4', id: 'B1', type: 'Button' },
          { _r_: '6', id: 'B2', type: 'Button', properties: { _r_: '10', title: 'X' } },
        ],
      },
    ],
  };
  addKeys({ components, context });
  expect(context.keyMap).toEqual({
    1: {
      _k_parent: '0',
      _r_: '1',
      key: 'root',
    },
    2: {
      _k_parent: '1',
      _r_: '2',
      key: 'root.pages[0:A:Box]',
    },
    3: {
      _k_parent: '2',
      _r_: '3',
      key: 'root.pages[0:A:Box].blocks[0:A1:Button]',
    },
    4: {
      _k_parent: '2',
      _r_: '7',
      key: 'root.pages[0:A:Box].blocks[1:A2:Button]',
    },
    5: {
      _k_parent: '1',
      _r_: '5',
      key: 'root.pages[1:B:Box]',
    },
    6: {
      _k_parent: '5',
      _r_: '4',
      key: 'root.pages[1:B:Box].blocks[0:B1:Button]',
    },
    7: {
      _k_parent: '5',
      _r_: '6',
      key: 'root.pages[1:B:Box].blocks[1:B2:Button]',
    },
    8: {
      _k_parent: '7',
      _r_: '10',
      key: 'root.pages[1:B:Box].blocks[1:B2:Button].properties',
    },
  });
  expect(JSON.parse(serializer.serializeToString(components))).toEqual({
    _k_: '1',
    pages: [
      {
        _k_: '2',
        blocks: [
          {
            _k_: '3',
            id: 'A1',
            type: 'Button',
          },
          {
            _k_: '4',
            id: 'A2',
            type: 'Button',
          },
        ],
        id: 'A',
        type: 'Box',
      },
      {
        _k_: '5',
        blocks: [
          {
            _k_: '6',
            id: 'B1',
            type: 'Button',
          },
          {
            _k_: '7',
            id: 'B2',
            type: 'Button',
            properties: {
              _k_: '8',
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
