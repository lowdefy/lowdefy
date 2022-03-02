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

import getContext from '../src/getContext.js';

const updateBlock = () => jest.fn();
const pageId = 'pageId';
const client = {};

test('page is required input', async () => {
  const lowdefy = {
    client,
    contexts: {},
    inputs: {},
    pageId,
    updateBlock,
  };
  await expect(getContext({ lowdefy })).rejects.toThrow('A page must be provided to get context.');
});

test('memoize context', async () => {
  const lowdefy = {
    client,
    contexts: {},
    inputs: {},
    pageId,
    updateBlock,
  };
  const page = {
    pageId: 'pageId',
    blockId: 'pageId',
    meta: {
      type: 'container',
    },
  };
  const c1 = await getContext({ page, lowdefy });
  const c2 = await getContext({ page, lowdefy });
  expect(c1).toBe(c2);
});

test('create context', () => {
  const lowdefy = {
    client: { client: true },
    contexts: {},
    document: { document: true },
    inputs: { pageId: { input: true } },
    lowdefyGlobal: { lowdefyGlobal: true },
    menus: [{ id: 'default' }],
    pageId,
    routeHistory: ['routeHistory'],
    updateBlock,
    urlQuery: { urlQuery: true },
    window: { window: true },
  };
  const page = {
    pageId: 'pageId',
    blockId: 'pageId',
    meta: {
      type: 'container',
    },
  };
  const context = getContext({ page, lowdefy });
  expect(context.Actions).toBeDefined();
  expect(context.Requests).toBeDefined();
  expect(context.RootBlocks).toBeDefined();
  expect(context.State).toBeDefined();
  expect(context.lowdefy).toEqual(lowdefy);
  expect(context.eventLog).toEqual([]);
  expect(context.id).toEqual('pageId');
  expect(context.lowdefy.pageId).toEqual('pageId');
  expect(context.parser).toBeDefined();
  expect(context.requests).toEqual({});
  expect(context.pageId).toEqual('pageId');
  expect(context.rootBlock).toBeDefined();
  expect(context.state).toEqual({});
  expect(context.update).toBeDefined();
});

test('create context, initialize input', () => {
  const lowdefy = {
    client: { client: true },
    contexts: {},
    document: { document: true },
    inputs: {},
    lowdefyGlobal: { lowdefyGlobal: true },
    menus: [{ id: 'default' }],
    pageId,
    routeHistory: ['routeHistory'],
    updateBlock,
    urlQuery: { urlQuery: true },
    window: { window: true },
  };
  const page = {
    pageId: 'pageId',
    blockId: 'pageId',
    meta: {
      type: 'container',
    },
  };
  const context = getContext({ page, lowdefy });
  expect(context.lowdefy.inputs.pageId).toEqual({});
});

test('update memoized context', () => {
  const lowdefy = {
    client,
    contexts: {},
    inputs: {},
    pageId,
    updateBlock,
  };
  const page = {
    pageId: 'pageId',
    blockId: 'pageId',
    meta: {
      type: 'container',
    },
  };
  const mockUpdate = jest.fn();
  const c1 = getContext({ page, lowdefy });
  c1.update = mockUpdate;
  getContext({ page, lowdefy });
  expect(mockUpdate.mock.calls.length).toBe(1);
});
