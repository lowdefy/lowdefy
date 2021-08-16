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
import actionFns from '../../src/actions/index.js';

const pageId = 'one';
const lowdefy = { pageId };

const RealDate = Date;
const mockDate = jest.fn(() => ({ date: 0 }));
mockDate.now = jest.fn(() => 0);

// Comment out to use console.log
// console.log = () => {};

beforeAll(() => {
  global.Date = mockDate;
});

afterAll(() => {
  global.Date = RealDate;
});

test('JsAction with no args, synchronous fn', async () => {
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
            events: {
              onClick: [
                {
                  id: 'a',
                  type: 'JsAction',
                  params: {
                    name: 'test_fn',
                  },
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
  const mockFn = jest.fn(() => 'js_fn');
  context.lowdefy.imports.jsActions.test_fn = mockFn;
  const { button } = context.RootBlocks.map;

  const res = await button.triggerEvent({ name: 'onClick' });
  expect(res).toEqual({
    blockId: 'button',
    event: undefined,
    eventName: 'onClick',
    responses: {
      a: {
        type: 'JsAction',
        index: 0,
        response: 'js_fn',
      },
    },
    success: true,
    startTimestamp: { date: 0 },
    endTimestamp: { date: 0 },
  });
  expect(mockFn).toHaveBeenCalledTimes(1);
});

test('JsAction with no args, async fn', async () => {
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
            events: {
              onClick: [
                {
                  id: 'a',
                  type: 'JsAction',
                  params: {
                    name: 'test_fn',
                  },
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
  const timeout = (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  };
  const fn = async () => {
    await timeout(300);
    return 'js_fn';
  };
  const mockFn = jest.fn().mockImplementation(fn);
  context.lowdefy.imports.jsActions.test_fn = mockFn;
  const { button } = context.RootBlocks.map;

  const res = await button.triggerEvent({ name: 'onClick' });
  expect(res).toEqual({
    blockId: 'button',
    event: undefined,
    eventName: 'onClick',
    responses: {
      a: {
        type: 'JsAction',
        index: 0,
        response: 'js_fn',
      },
    },
    success: true,
    startTimestamp: { date: 0 },
    endTimestamp: { date: 0 },
  });
  expect(mockFn).toHaveBeenCalledTimes(1);
});

test('JsAction with args, synchronous fn', async () => {
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
            events: {
              onClick: [
                {
                  id: 'a',
                  type: 'JsAction',
                  params: {
                    name: 'test_fn',
                    args: [1, '2', new Date()],
                  },
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
  const mockFn = jest.fn((...args) => args);
  context.lowdefy.imports.jsActions.test_fn = mockFn;
  const { button } = context.RootBlocks.map;

  const res = await button.triggerEvent({ name: 'onClick' });
  expect(res).toMatchInlineSnapshot(`
    Object {
      "blockId": "button",
      "endTimestamp": Object {
        "date": 0,
      },
      "event": undefined,
      "eventName": "onClick",
      "responses": Object {
        "a": Object {
          "index": 0,
          "response": Array [
            Object {
              "actions": Object {
                "CallMethod": [Function],
                "JsAction": [Function],
                "Link": [Function],
                "Login": [Function],
                "Logout": [Function],
                "Message": [Function],
                "Request": [Function],
                "Reset": [Function],
                "ScrollTo": [Function],
                "SetGlobal": [Function],
                "SetState": [Function],
                "Throw": [Function],
                "Validate": [Function],
                "Wait": [Function],
              },
              "contextId": "test",
              "input": Object {},
              "pageId": "root",
              "requests": Object {},
              "state": Object {},
              "urlQuery": Object {},
            },
            1,
            "2",
            Object {
              "date": 0,
            },
          ],
          "type": "JsAction",
        },
      },
      "startTimestamp": Object {
        "date": 0,
      },
      "success": true,
    }
  `);
  expect(mockFn).toHaveBeenCalledTimes(1);
});

test('JsAction name not a string', async () => {
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
            events: {
              onClick: [
                {
                  id: 'a',
                  type: 'JsAction',
                  params: {
                    name: 1,
                  },
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
  expect(res).toEqual({
    blockId: 'button',
    event: undefined,
    eventName: 'onClick',
    error: {
      action: {
        id: 'a',
        params: {
          name: 1,
        },
        type: 'JsAction',
      },
      error: {
        error: new Error(`JsAction requires a string for 'params.name'.`),
        index: 0,
        type: 'JsAction',
      },
    },
    responses: {
      a: {
        type: 'JsAction',
        index: 0,
        error: new Error(`JsAction requires a string for 'params.name'.`),
      },
    },
    success: false,
    startTimestamp: { date: 0 },
    endTimestamp: { date: 0 },
  });
});

test('JsAction args not an array', async () => {
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
            events: {
              onClick: [
                {
                  id: 'a',
                  type: 'JsAction',
                  params: {
                    name: 'js_fn',
                    args: { a: 1 },
                  },
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
  const mockFn = jest.fn(() => 'js_fn');
  const { button } = context.RootBlocks.map;
  const res = await button.triggerEvent({ name: 'onClick' });
  expect(res).toEqual({
    blockId: 'button',
    event: undefined,
    eventName: 'onClick',
    error: {
      action: {
        id: 'a',
        params: {
          args: {
            a: 1,
          },
          name: 'js_fn',
        },
        type: 'JsAction',
      },
      error: {
        error: new Error(`JsAction requires a array for 'params.args'.`),
        index: 0,
        type: 'JsAction',
      },
    },
    responses: {
      a: {
        type: 'JsAction',
        index: 0,
        error: new Error(`JsAction requires a array for 'params.args'.`),
      },
    },
    success: false,
    startTimestamp: { date: 0 },
    endTimestamp: { date: 0 },
  });
});

test('JsAction args not a function', async () => {
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
            events: {
              onClick: [
                {
                  id: 'a',
                  type: 'JsAction',
                  params: {
                    name: 'js_not_fn',
                  },
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
  const mockFn = jest.fn(() => 'js_fn');
  const { button } = context.RootBlocks.map;
  const res = await button.triggerEvent({ name: 'onClick' });
  expect(res).toEqual({
    blockId: 'button',
    event: undefined,
    eventName: 'onClick',
    error: {
      action: {
        id: 'a',
        params: {
          name: 'js_not_fn',
        },
        type: 'JsAction',
      },
      error: {
        error: new Error(`JsAction js_not_fn is not a function.`),
        index: 0,
        type: 'JsAction',
      },
    },
    responses: {
      a: {
        type: 'JsAction',
        index: 0,
        error: new Error(`JsAction js_not_fn is not a function.`),
      },
    },
    success: false,
    startTimestamp: { date: 0 },
    endTimestamp: { date: 0 },
  });
});

test('JsAction can use Lowdefy actions', async () => {
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
            events: {
              onClick: [
                {
                  id: 'a',
                  type: 'JsAction',
                  params: {
                    name: 'test_fn',
                  },
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

  const fn = async ({ actions }) => {
    actions.SetState({ answer: 42 });
    return actions;
  };

  const mockFn = jest.fn().mockImplementation(fn);
  context.lowdefy.imports.jsActions.test_fn = mockFn;
  const { button } = context.RootBlocks.map;

  const res = await button.triggerEvent({ name: 'onClick' });
  expect(context.state).toEqual({ answer: 42 });
  expect(Object.keys(res.responses.a.response)).toEqual(Object.keys(actionFns));
});
