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

import buildTestPage from './buildTestPage.js';

test('buildTestPage', () => {
  const pageConfig = {
    id: 'page',
    type: 'Box',
    requests: [
      {
        id: 'request',
        type: 'AxiosHttp',
        connectionId: 'axios',
      },
    ],
    blocks: [
      {
        id: 'box',
        type: 'Box',
        blocks: [
          { id: 'input', type: 'TextInput' },
          { id: 'box', type: 'Box' },
        ],
      },
    ],
  };
  const res = buildTestPage({ pageConfig });
  expect(res).toEqual({
    id: 'page:page',
    pageId: 'page',
    blockId: 'page',
    type: 'Box',
    auth: {
      public: true,
    },
    requests: [
      {
        id: 'request:page:request',
        requestId: 'request',
        pageId: 'page',
        type: 'AxiosHttp',
        connectionId: 'axios',
        payload: {},
        auth: {
          public: true,
        },
      },
    ],

    areas: {
      content: {
        blocks: [
          {
            areas: {
              content: {
                blocks: [
                  {
                    blockId: 'input',
                    id: 'block:page:input:0',
                    type: 'TextInput',
                  },

                  {
                    blockId: 'box',
                    id: 'block:page:box:1',
                    type: 'Box',
                  },
                ],
              },
            },

            blockId: 'box',
            id: 'block:page:box:0',
            type: 'Box',
          },
        ],
      },
    },
  });
});
