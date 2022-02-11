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

import testContext from './testContext.js';
import Login from './Login.js';

const mockActionMethod = jest.fn();

const lowdefy = {
  _internal: {
    actions: {
      Login: (props) => Login({ ...props, methods: { login: mockActionMethod } }),
    },
    blockComponents: {
      Button: { meta: { category: 'display' } },
    },
  },
};

beforeEach(() => {
  mockActionMethod.mockReset();
});

test('Login action invocation', async () => {
  const rootBlock = {
    id: 'block:root:root:0',
    blockId: 'root',
    meta: {
      category: 'container',
    },
    areas: {
      content: {
        blocks: [
          {
            id: 'button',
            blockId: 'button',
            type: 'Button',
            meta: {
              category: 'display',
            },
            events: {
              onClick: [
                {
                  id: 'action',
                  type: 'Login',
                  params: 'call',
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
  const button = context._internal.RootBlocks.map['button'];
  await button.triggerEvent({ name: 'onClick' });
  expect(mockActionMethod.mock.calls).toEqual([['call']]);
});
