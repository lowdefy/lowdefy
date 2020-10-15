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

import testContext from '../testContext';

// Mock apollo client
const mockMutationResponses = {
  mut_one: {
    data: {
      requestMutation: {
        id: 'mut_one',
        success: true,
        response: 1,
      },
    },
  },
};

const mockMutate = jest.fn();
const mockMutateImp = ({ variables }) => {
  const { requestMutationInput } = variables;
  const { mutationId } = requestMutationInput;
  return new Promise((resolve) => {
    resolve(mockMutationResponses[mutationId]);
  });
};
const client = {
  mutate: mockMutate,
};

const pageId = 'one';

const rootContext = {
  client,
};

beforeEach(() => {
  mockMutate.mockReset();
  mockMutate.mockImplementation(mockMutateImp);
});

test('Mutate', async () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'context',
    },
    mutations: [
      {
        mutationId: 'mut_one',
      },
    ],
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
            actions: {
              onClick: [{ id: 'a', type: 'Mutate', params: 'mut_one' }],
            },
          },
        ],
      },
    },
  };
  const context = testContext({
    rootContext,
    rootBlock,
    pageId,
  });
  const { button } = context.RootBlocks.map;
  const promise = button.callAction({ action: 'onClick' });
  expect(context.mutations.mut_one).toEqual({
    error: [],
    loading: true,
    response: null,
  });
  await promise;
  expect(context.mutations.mut_one).toEqual({
    error: [null],
    loading: false,
    response: 1,
  });
});
