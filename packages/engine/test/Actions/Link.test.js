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
  window,
};

test('Link with home and urlQuery', async () => {
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
              onClick: [{ id: 'a', type: 'Link', params: { home: true, urlQuery: { a: 1 } } }],
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
  expect(context.routeHistory).toEqual(['/?a=1']);
});

test('Link with pageId', async () => {
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
              onClick: [{ id: 'a', type: 'Link', params: { pageId: 'page1' } }],
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
  expect(context.routeHistory).toEqual(['/page1']);
});

test('Link with pageId, newWindow and urlQuery', async () => {
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
                  type: 'Link',
                  params: { pageId: 'page1', newWindow: true, urlQuery: { a: 1 } },
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
  expect(context.window.open.mock.calls).toEqual([['http://lowdefy.com/page1?a=1', '_blank']]);
});

test('Link with url', async () => {
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
                  type: 'Link',
                  params: { url: 'https://test.lowdefy.com' },
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
  expect(context.window.location.href).toEqual('https://test.lowdefy.com');
});

test('Link with url and newWindow', async () => {
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
                  type: 'Link',
                  params: { url: 'https://test.lowdefy.com', newWindow: true },
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
  expect(context.window.open.mock.calls).toEqual([['https://test.lowdefy.com', '_blank']]);
});

test('Link with pageId and urlQuery', async () => {
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
                  type: 'Link',
                  params: { pageId: 'page1', urlQuery: { data: 1 } },
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
  expect(context.routeHistory).toEqual(['/page1?data=1']);
});

test('Link with pageId and input', async () => {
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
                  type: 'Link',
                  params: { pageId: 'page1', input: { data: 1 } },
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
  expect(context.routeHistory).toEqual(['/page1']);
  expect(context.allInputs['page1:page1:{}']).toEqual({ data: 1 });
});

test('Link with pageId and input and newWindow', async () => {
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
                  type: 'Link',
                  params: { pageId: 'page1', input: { data: 1 }, newWindow: true },
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
  expect(context.window.open.mock.calls).toEqual([['http://lowdefy.com/page1', '_blank']]);
  expect(context.allInputs['page1:page1:{}']).toEqual({ data: 1 });
});
