/*
  Copyright 2020-2026 Lowdefy, Inc

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
      translate: (key) => key,
      operators: {},
      actions: {},
      blockComponents: {
        TextInput: {},
        Box: {},
        Button: {},
        List: {},
        Paragraph: {},
        Switch: {},
        MultipleSelector: {},
        NumberInput: {},
      },
      blockMetas: {
        TextInput: { category: 'input', valueType: 'string' },
        Box: { category: 'container' },
        Button: { category: 'display' },
        List: { category: 'list', valueType: 'array' },
        Paragraph: { category: 'display' },
        Switch: { category: 'input', valueType: 'boolean' },
        MultipleSelector: { category: 'input', valueType: 'array' },
        NumberInput: { category: 'input', valueType: 'number' },
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
  expect(c1._internal.RootSlots.id).toEqual(c2._internal.RootSlots.id);
  const c3 = getContext({ config, lowdefy, resetContext: { reset: true, setReset: () => {} } });
  expect(c1._internal.RootSlots.id).not.toEqual(c3._internal.RootSlots.id);
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
  expect(context._internal.RootSlots).toBeDefined();
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

test('dynamic page config memoizes context for the same config object', () => {
  const lowdefy = getLowdefy();
  const page = {
    id: 'pageId',
    type: 'Box',
  };
  const config = buildTestPage({ pageConfig: page });
  // Server-resolved pages carry dynamic: true — content changes per request.
  config.dynamic = true;
  // getContext runs in the render body — re-renders of the same fetched config
  // must reuse the context, or context creation would loop.
  const c1 = getContext({ config, lowdefy, resetContext: { reset: true, setReset: () => {} } });
  const c2 = getContext({ config, lowdefy, resetContext: { reset: false, setReset: () => {} } });
  expect(c1).toBe(c2);
});

test('dynamic page config builds a fresh context for a new config object', () => {
  const lowdefy = getLowdefy();
  const page = {
    id: 'pageId',
    type: 'Box',
  };
  const config1 = buildTestPage({ pageConfig: page });
  config1.dynamic = true;
  // A new fetch delivers a new config object — SPA navigation to the same
  // dynamic page must render the newly resolved content.
  const config2 = buildTestPage({ pageConfig: { id: 'pageId', type: 'Box' } });
  config2.dynamic = true;
  const c1 = getContext({ config: config1, lowdefy, resetContext: { reset: true, setReset: () => {} } });
  const c2 = getContext({ config: config2, lowdefy, resetContext: { reset: false, setReset: () => {} } });
  expect(c1).not.toBe(c2);
  expect(c1._internal.RootSlots.id).not.toEqual(c2._internal.RootSlots.id);
});

test('dynamic rebuild does not lower an already-lowered reset flag', () => {
  const lowdefy = getLowdefy();
  const setReset = jest.fn();
  const config1 = buildTestPage({ pageConfig: { id: 'pageId', type: 'Box' } });
  config1.dynamic = true;
  const config2 = buildTestPage({ pageConfig: { id: 'pageId', type: 'Box' } });
  config2.dynamic = true;
  getContext({ config: config1, lowdefy, resetContext: { reset: false, setReset } });
  getContext({ config: config2, lowdefy, resetContext: { reset: false, setReset } });
  // setReset is a React state setter on another component — calling it with
  // the flag already down would setState mid-render.
  expect(setReset).not.toHaveBeenCalled();
  getContext({ config: config2, lowdefy, resetContext: { reset: true, setReset } });
  expect(setReset).toHaveBeenCalledWith(false);
});

test('dynamic rebuild does not call mounted updaters during construction', () => {
  const lowdefy = getLowdefy();
  const updateBlockSpy = jest.fn();
  lowdefy._internal.updateBlock = updateBlockSpy;
  const config1 = buildTestPage({ pageConfig: { id: 'pageId', type: 'Box' } });
  config1.dynamic = true;
  const config2 = buildTestPage({ pageConfig: { id: 'pageId', type: 'Box' } });
  config2.dynamic = true;
  getContext({ config: config1, lowdefy, resetContext: { reset: true, setReset: () => {} } });
  updateBlockSpy.mockClear();
  // getContext runs in the render body — updating mounted Block components
  // during the rebuild would setState mid-render.
  getContext({ config: config2, lowdefy, resetContext: { reset: false, setReset: () => {} } });
  expect(updateBlockSpy).not.toHaveBeenCalled();
  // updateBlock is restored after construction.
  expect(lowdefy._internal.updateBlock).toBe(updateBlockSpy);
});

test('static page config memoizes context across different config objects', () => {
  const lowdefy = getLowdefy();
  const config1 = buildTestPage({ pageConfig: { id: 'pageId', type: 'Box' } });
  const config2 = buildTestPage({ pageConfig: { id: 'pageId', type: 'Box' } });
  const c1 = getContext({ config: config1, lowdefy, resetContext: { reset: true, setReset: () => {} } });
  const c2 = getContext({ config: config2, lowdefy, resetContext: { reset: false, setReset: () => {} } });
  expect(c1).toBe(c2);
});
