/*
  Copyright 2020 Lowdefy, Inc

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

import getIdPath from './getIdPath';

test('get 1st level id', () => {
  const app = {
    pages: [
      {
        id: 'page1',
      },
    ],
  };
  expect(getIdPath('pages.0', app)).toEqual('pages > page1');
});

test('get 2nd level id', () => {
  const app = {
    pages: [
      {
        id: 'page1',
        blocks: [
          {
            id: 'block1',
          },
        ],
      },
    ],
  };
  expect(getIdPath('pages.0.blocks.0', app)).toEqual('pages > page1 > blocks > block1');
});

test('get 2nd level id when path descends deeper', () => {
  const app = {
    pages: [
      {
        id: 'page1',
        blocks: [
          {
            id: 'block1',
            properties: {
              a: 1,
            },
          },
        ],
      },
    ],
  };
  expect(getIdPath('pages.0.blocks.0.properties.a', app)).toEqual(
    'pages > page1 > blocks > block1 > properties > a'
  );
});

test('get 2nd level id with blocks object', () => {
  const app = {
    pages: [
      {
        id: 'page1',
        blocks: {
          Content: [
            {
              id: 'block1',
              properties: {
                a: 1,
              },
            },
          ],
        },
      },
    ],
  };
  expect(getIdPath('pages.0.blocks.Content.0', app)).toEqual(
    'pages > page1 > blocks > Content > block1'
  );
});
