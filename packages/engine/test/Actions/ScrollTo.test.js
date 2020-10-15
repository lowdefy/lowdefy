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

// Mock document
const mockDocGetElementById = jest.fn();
const mockElemScrollIntoView = jest.fn();
const document = {
  getElementById: mockDocGetElementById,
};
const mockDocGetElementByIdImp = (id) => {
  return { id, scrollIntoView: mockElemScrollIntoView };
};

// Mock window
const mockWindowFocus = jest.fn();
const mockWindowOpen = jest.fn(() => ({ focus: mockWindowFocus }));
const mockWindowScrollTo = jest.fn();
const window = {
  location: { href: '', origin: 'http://lowdefy.com' },
  open: mockWindowOpen,
  scrollTo: mockWindowScrollTo,
};
const pageId = 'one';

const rootContext = {
  document,
  window,
};

beforeEach(() => {
  mockWindowOpen.mockReset();
  mockWindowFocus.mockReset();
  mockWindowScrollTo.mockReset();
  mockDocGetElementById.mockReset();
  mockDocGetElementById.mockImplementation(mockDocGetElementByIdImp);
  mockElemScrollIntoView.mockReset();
});

test('ScrollTo with no params', async () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'context',
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
            actions: {
              onClick: [{ id: 'a', type: 'ScrollTo' }],
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
  button.callAction({ action: 'onClick' });
  expect(mockWindowScrollTo.mock.calls).toEqual([]);
});

test('ScrollTo with no blockId', async () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'context',
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
            actions: {
              onClick: [{ id: 'a', type: 'ScrollTo', params: { behavior: 'smooth', top: 0 } }],
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
  button.callAction({ action: 'onClick' });
  expect(mockWindowScrollTo.mock.calls).toEqual([
    [
      {
        behavior: 'smooth',
        top: 0,
      },
    ],
  ]);
});

test('ScrollTo with blockId', async () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'context',
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
            actions: {
              onClick: [{ id: 'a', type: 'ScrollTo', params: { blockId: 'root' } }],
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
  button.callAction({ action: 'onClick' });
  expect(mockDocGetElementById.mock.calls).toEqual([['root']]);
  expect(mockElemScrollIntoView.mock.calls).toEqual([[undefined]]);
});

test('ScrollTo with blockId and options', async () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'context',
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
            actions: {
              onClick: [
                {
                  id: 'a',
                  type: 'ScrollTo',
                  params: { blockId: 'a', options: { behavior: 'smooth' } },
                },
              ],
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
  button.callAction({ action: 'onClick' });

  expect(mockDocGetElementById.mock.calls).toEqual([['a']]);
  expect(mockElemScrollIntoView.mock.calls).toEqual([
    [
      {
        behavior: 'smooth',
      },
    ],
  ]);
});
