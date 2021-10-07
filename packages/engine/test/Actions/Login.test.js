/*
  Copyright 2020-2021 Lowdefy, Inc

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

import testContext from '../testContext';

const pageId = 'one';

const lowdefy = {
  auth: {
    login: jest.fn(),
  },
  pageId,
};

const RealDate = Date;
const mockDate = jest.fn(() => ({ date: 0 }));
mockDate.now = jest.fn(() => 0);

beforeEach(() => {
  global.Date = mockDate;
  lowdefy.auth.login.mockReset();
});

afterAll(() => {
  global.Date = RealDate;
});

test('Login', async () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'container',
    },
    areas: {
      content: {
        blocks: [
          {
            blockId: 'button',
            type: 'Button',
            meta: {
              category: 'display',
              valueType: 'string',
            },
            events: {
              onClick: [
                {
                  id: 'a',
                  type: 'Login',
                  params: { input: { i: true }, pageId: 'pageId', urlQuery: { u: true } },
                },
              ],
            },
          },
        ],
      },
    },
  };
  const context = await testContext({
    lowdefy,
    rootBlock,
  });
  const { button } = context.RootBlocks.map;
  const res = await button.triggerEvent({ name: 'onClick' });
  expect(lowdefy.auth.login.mock.calls).toEqual([
    [
      {
        input: { i: true },
        pageId: 'pageId',
        urlQuery: { u: true },
      },
    ],
  ]);
  expect(res.success).toBe(true);
});
