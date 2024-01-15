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

import { jest } from '@jest/globals';

import getContext from '../src/getContext.js';
import buildTestPage from '@lowdefy/build/buildTestPage';

const getLowdefy = () => {
  const updateBlock = () => jest.fn();
  const testLowdefy = {
    contexts: {},
    inputs: { test: {} },
    urlQuery: {},
    _internal: {
      displayMessage: () => () => {},
      updateBlock,
      operators: {},
      actions: {},
      blockComponents: {
        TextInput: {
          meta: {
            category: 'input',
            valueType: 'string',
          },
        },
        Box: {
          meta: {
            category: 'container',
          },
        },
        Button: {
          meta: {
            category: 'display',
          },
        },
        List: {
          meta: {
            category: 'list',
            valueType: 'array',
          },
        },
        Paragraph: {
          meta: {
            category: 'display',
          },
        },
        Switch: {
          meta: {
            category: 'input',
            valueType: 'boolean',
          },
        },
        MultipleSelector: {
          meta: {
            category: 'input',
            valueType: 'array',
          },
        },
        NumberInput: {
          meta: {
            category: 'input',
            valueType: 'number',
          },
        },
      },
    },
  };
  return testLowdefy;
};

test('page is required input', () => {
  const resetContext = { reset: true, setReset: () => {} };
  const lowdefy = getLowdefy();
  expect(() => getContext({ lowdefy, resetContext })).toThrow(
    'A page must be provided to get context.'
  );
});

test('memoize context and reset', () => {
  const lowdefy = getLowdefy();
  const page = {
    id: 'pageId',
    type: 'Box',
  };
  const config = buildTestPage({ pageConfig: page });
  const c1 = getContext({ config, lowdefy, resetContext: { reset: true, setReset: () => {} } });
  const c2 = getContext({ config, lowdefy, resetContext: { reset: false, setReset: () => {} } });
  expect(c1).toBe(c2);
  expect(c1._internal.RootBlocks.id).toEqual(c2._internal.RootBlocks.id);
  const c3 = getContext({ config, lowdefy, resetContext: { reset: true, setReset: () => {} } });
  expect(c1._internal.RootBlocks.id).not.toEqual(c3._internal.RootBlocks.id);
});

test('create context', () => {
  const resetContext = { reset: true, setReset: () => {} };
  const lowdefy = getLowdefy();
  const page = {
    id: 'pageId',
    type: 'Box',
  };
  const config = buildTestPage({ pageConfig: page });
  const context = getContext({ config, lowdefy, resetContext });
  expect(context._internal.Actions).toBeDefined();
  expect(context._internal.Requests).toBeDefined();
  expect(context._internal.RootBlocks).toBeDefined();
  expect(context._internal.State).toBeDefined();
  expect(context._internal.runOnInit).toBeDefined();
  expect(context._internal.runOnInitAsync).toBeDefined();
  expect(context._internal.lowdefy).toEqual(lowdefy);
  expect(context.eventLog).toEqual([]);
  expect(context.id).toEqual('page:pageId');
  expect(context.pageId).toEqual('pageId');
  expect(context._internal.parser).toBeDefined();
  expect(context.requests).toEqual({});
  expect(context.pageId).toEqual('pageId');
  expect(context._internal.rootBlock).toBeDefined();
  expect(context.state).toEqual({});
  expect(context._internal.update).toBeDefined();
});

test('create context, initialize input', () => {
  const resetContext = { reset: true, setReset: () => {} };
  const lowdefy = getLowdefy();
  const page = {
    id: 'pageId',
    type: 'Box',
  };
  const config = buildTestPage({ pageConfig: page });
  const context = getContext({ config, lowdefy, resetContext });
  expect(context._internal.lowdefy.inputs['page:pageId']).toEqual({});
});

test('update memoized context', () => {
  const lowdefy = getLowdefy();
  const page = {
    id: 'pageId',
    type: 'Box',
  };
  const config = buildTestPage({ pageConfig: page });
  const mockUpdate = jest.fn();
  const c1 = getContext({ config, lowdefy, resetContext: { reset: true, setReset: () => {} } });
  c1._internal.update = mockUpdate;
  getContext({ config, lowdefy, resetContext: { reset: false, setReset: () => {} } });
  expect(mockUpdate.mock.calls.length).toBe(1);
});
