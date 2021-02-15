/* eslint-disable prefer-promise-reject-errors */

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

import testContext from './testContext';

const pageId = 'one';

const mockLoadingCallback = jest.fn();
const mockLoading = jest.fn(() => mockLoadingCallback);
const mockSuccess = jest.fn();
const mockError = jest.fn();

const displayMessage = {
  loading: mockLoading,
  error: mockError,
  success: mockSuccess,
};

const mockReqResponses = {
  request1: {
    data: {
      request: {
        id: 'request1',
        success: true,
        response: 1,
      },
    },
  },
};

const mockQueryImp = ({ variables }) => {
  const { input } = variables;
  const { requestId } = input;
  return new Promise((resolve, reject) => {
    if (requestId === 'req_error') {
      reject({ errorMessage: 'Error!' });
    }
    resolve(mockReqResponses[requestId]);
  });
};
const mockQuery = jest.fn();

const client = {
  query: mockQuery,
};

const RealDate = Date;
const mockDate = jest.fn(() => ({ date: 0 }));
mockDate.now = jest.fn(() => 0);

const rootContext = {
  client,
  displayMessage,
};

beforeEach(() => {
  global.Date = mockDate;
});

afterAll(() => {
  global.Date = RealDate;
});

beforeEach(() => {
  mockLoadingCallback.mockReset();
  mockLoading.mockReset();
  mockLoading.mockImplementation(() => mockLoadingCallback);
  mockSuccess.mockReset();
  mockError.mockReset();
  mockQuery.mockReset();
  mockQuery.mockImplementation(mockQueryImp);
});

test('init Events', () => {
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
              onClick: [{ id: 'a', type: 'SetState', params: { a: 'a' } }],
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
  expect(button.Events.events).toEqual({
    onClick: {
      history: [],
      loading: false,
      actions: [{ id: 'a', type: 'SetState', params: { a: 'a' } }],
    },
  });
});

test('triggerEvent no event defined', async () => {
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
  const promise = button.triggerEvent({ name: 'onClick' });
  expect(button.Events.events).toEqual({});
  const res = await promise;
  expect(res).toBe(undefined);
});

test('triggerEvent x1', async () => {
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
              onClick: [{ id: 'a', type: 'SetState', params: { a: 'a' } }],
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
  const promise = button.triggerEvent({ name: 'onClick', event: { x: 1 } });
  expect(button.Events.events).toEqual({
    onClick: {
      history: [],
      loading: true,
      actions: [{ id: 'a', type: 'SetState', params: { a: 'a' } }],
    },
  });
  await promise;
  expect(button.Events.events.onClick.history[0]).toEqual({
    blockId: 'button',
    event: {
      x: 1,
    },
    eventName: 'onClick',
    responses: [undefined],
    success: true,
    timestamp: {
      date: 0,
    },
  });

  expect(button.Events.events.onClick.loading).toEqual(false);
});

test('triggerEvent, 2 actions', async () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'context',
    },
    requests: [{ requestId: 'request1' }],
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
                { id: 'a', type: 'SetState', params: { a: 'a' } },
                { id: 'b', type: 'Request', params: 'request1' },
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
  await button.triggerEvent({ name: 'onClick', event: { x: 1 } });
  expect(button.Events.events.onClick.history[0].event).toEqual({ x: 1 });
  expect(button.Events.events.onClick.history[0].responses.length).toEqual(2);
  expect(button.Events.events.onClick.loading).toEqual(false);
});

test('triggerEvent error', async () => {
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
                  id: 'e',
                  type: 'Error',
                  params: { a: 'a' },
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
  await button.triggerEvent({ name: 'onClick', event: { x: 1 } });
  expect(button.Events.events.onClick.history[0]).toEqual({
    blockId: 'button',
    event: {
      x: 1,
    },
    eventName: 'onClick',
    responses: [
      {
        actionId: 'e',
        actionType: 'Error',
        error: new Error('Invalid action type "Error" at "button".'),
      },
    ],
    success: false,
    timestamp: {
      date: 0,
    },
  });
});

// test('messages: loading and success', async () => {
//   const rootBlock = {
//     blockId: 'root',
//     meta: {
//       category: 'context',
//     },
//     areas: {
//       content: {
//         blocks: [
//           {
//             blockId: 'button',
//             type: 'Button',
//             meta: {
//               category: 'display',
//               valueType: 'string',
//             },
//             events: {
//               onClick: [
//                 {
//                   id: 'a',
//                   type: 'SetState',
//                   params: { a: 'a' },
//                   success: 'successMessage',
//                   error: 'errorMessage',
//                 },
//               ],
//             },
//           },
//         ],
//       },
//     },
//   };
//   const context = testContext({
//     rootContext,
//     rootBlock,
//     pageId,
//     initState: { textInput: 'init' },
//   });
//   const { button } = context.RootBlocks.map;
//   await button.triggerEvent({ name: 'onClick', event: { x: 1 } });
//   expect(mockLoading).toHaveBeenCalledTimes(1);
//   expect(mockLoadingCallback).toHaveBeenCalledTimes(1);
//   expect(mockSuccess).toHaveBeenCalledTimes(1);
//   expect(mockError).toHaveBeenCalledTimes(0);
// });

// test('messages: success and hideLoading', async () => {
//   const rootBlock = {
//     blockId: 'root',
//     meta: {
//       category: 'context',
//     },
//     areas: {
//       content: {
//         blocks: [
//           {
//             blockId: 'button',
//             type: 'Button',
//             meta: {
//               category: 'display',
//               valueType: 'string',
//             },
//             events: {
//               onClick: [
//                 {
//                   id: 'a',
//                   type: 'SetState',
//                   params: { a: 'a' },
//                   success: 'successMessage',
//                   error: 'errorMessage',
//                 },
//               ],
//             },
//           },
//         ],
//       },
//     },
//   };
//   const context = testContext({
//     rootContext,
//     rootBlock,
//     pageId,
//     initState: { textInput: 'init' },
//   });
//   const { button } = context.RootBlocks.map;
//   await button.triggerEvent({ name: 'onClick', hideLoading: true, event: { x: 1 } });
//   expect(mockLoading).toHaveBeenCalledTimes(0);
//   expect(mockLoadingCallback).toHaveBeenCalledTimes(0);
//   expect(mockSuccess).toHaveBeenCalledTimes(1);
//   expect(mockError).toHaveBeenCalledTimes(0);
// });

// test('messages: no success and loading', async () => {
//   const rootBlock = {
//     blockId: 'root',
//     meta: {
//       category: 'context',
//     },
//     areas: {
//       content: {
//         blocks: [
//           {
//             blockId: 'button',
//             type: 'Button',
//             meta: {
//               category: 'display',
//               valueType: 'string',
//             },
//             events: {
//               onClick: [{ id: 'a', type: 'SetState', params: { a: 'a' }, error: 'errorMessage' }],
//             },
//           },
//         ],
//       },
//     },
//   };
//   const context = testContext({
//     rootContext,
//     rootBlock,
//     pageId,
//     initState: { textInput: 'init' },
//   });
//   const { button } = context.RootBlocks.map;
//   await button.triggerEvent({ name: 'onClick', event: { x: 1 } });
//   expect(mockLoading).toHaveBeenCalledTimes(1);
//   expect(mockLoadingCallback).toHaveBeenCalledTimes(1);
//   expect(mockSuccess).toHaveBeenCalledTimes(0);
//   expect(mockError).toHaveBeenCalledTimes(0);
// });

// test('messages: error and loading', async () => {
//   const rootBlock = {
//     blockId: 'root',
//     meta: {
//       category: 'context',
//     },
//     areas: {
//       content: {
//         blocks: [
//           {
//             blockId: 'button',
//             type: 'Button',
//             meta: {
//               category: 'display',
//               valueType: 'string',
//             },
//             events: {
//               onClick: [
//                 {
//                   id: 'a',
//                   type: 'SetState',
//                   params: { _state: null },
//                   success: 'successMessage',
//                   error: 'errorMessage',
//                 },
//               ],
//             },
//           },
//         ],
//       },
//     },
//   };
//   const context = testContext({
//     rootContext,
//     rootBlock,
//     pageId,
//     initState: { textInput: 'init' },
//   });
//   const { button } = context.RootBlocks.map;
//   await button.triggerEvent({ name: 'onClick', event: { x: 1 } });
//   expect(mockLoading).toHaveBeenCalledTimes(1);
//   expect(mockLoadingCallback).toHaveBeenCalledTimes(1);
//   expect(mockSuccess).toHaveBeenCalledTimes(0);
//   expect(mockError).toHaveBeenCalledTimes(1);
// });

// test('messages: default error and loading', async () => {
//   const rootBlock = {
//     blockId: 'root',
//     meta: {
//       category: 'context',
//     },
//     areas: {
//       content: {
//         blocks: [
//           {
//             blockId: 'button',
//             type: 'Button',
//             meta: {
//               category: 'display',
//               valueType: 'string',
//             },
//             events: {
//               onClick: [
//                 {
//                   id: 'a',
//                   type: 'SetState',
//                   params: { _state: null },
//                   success: 'successMessage',
//                 },
//               ],
//             },
//           },
//         ],
//       },
//     },
//   };
//   const context = testContext({
//     rootContext,
//     rootBlock,
//     pageId,
//     initState: { textInput: 'init' },
//   });
//   const { button } = context.RootBlocks.map;
//   await button.triggerEvent({ name: 'onClick', event: { x: 1 } });
//   expect(mockLoading).toHaveBeenCalledTimes(1);
//   expect(mockLoadingCallback).toHaveBeenCalledTimes(1);
//   expect(mockSuccess).toHaveBeenCalledTimes(0);
//   expect(mockError).toHaveBeenCalledTimes(1);
//   expect(mockError.mock.calls).toMatchInlineSnapshot(`
//     Array [
//       Array [
//         "Failed to set state due to parser error.",
//         6,
//       ],
//     ]
//   `);
// });

// test('messages: error and hideLoading', async () => {
//   const rootBlock = {
//     blockId: 'root',
//     meta: {
//       category: 'context',
//     },
//     areas: {
//       content: {
//         blocks: [
//           {
//             blockId: 'button',
//             type: 'Button',
//             meta: {
//               category: 'display',
//               valueType: 'string',
//             },
//             events: {
//               onClick: [
//                 {
//                   id: 'a',
//                   type: 'SetState',
//                   params: { _state: null },
//                   success: 'successMessage',
//                   error: 'errorMessage',
//                 },
//               ],
//             },
//           },
//         ],
//       },
//     },
//   };
//   const context = testContext({
//     rootContext,
//     rootBlock,
//     pageId,
//     initState: { textInput: 'init' },
//   });
//   const { button } = context.RootBlocks.map;
//   await button.triggerEvent({ name: 'onClick', hideLoading: true, event: { x: 1 } });
//   expect(mockLoading).toHaveBeenCalledTimes(0);
//   expect(mockLoadingCallback).toHaveBeenCalledTimes(0);
//   expect(mockSuccess).toHaveBeenCalledTimes(0);
//   expect(mockError).toHaveBeenCalledTimes(1);
// });

test('registerEvent then triggerEvent x1', async () => {
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
  button.Events.registerEvent({
    name: 'onClick',
    actions: [{ id: 'a', type: 'SetState', params: { a: 'a' } }],
  });
  expect(button.Events.events).toEqual({
    onClick: {
      history: [],
      loading: false,
      actions: [{ id: 'a', type: 'SetState', params: { a: 'a' } }],
    },
  });
  await button.triggerEvent({ name: 'onClick', event: { x: 1 } });
  expect(button.Events.events.onClick.history[0]).toEqual({
    blockId: 'button',
    event: {
      x: 1,
    },
    eventName: 'onClick',
    responses: [undefined],
    success: true,
    timestamp: {
      date: 0,
    },
  });
});

test('triggerEvent skip', async () => {
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
              onClick: [{ id: 'a', type: 'SetState', params: { a: 'a' }, skip: true }],
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
    initState: { textInput: 'init' },
  });
  const { button } = context.RootBlocks.map;
  await button.triggerEvent({ name: 'onClick', event: { x: 1 } });
  expect(button.Events.events).toMatchInlineSnapshot(`
    Object {
      "onClick": Object {
        "actions": Array [
          Object {
            "id": "a",
            "params": Object {
              "a": "a",
            },
            "skip": true,
            "type": "SetState",
          },
        ],
        "history": Array [
          Object {
            "blockId": "button",
            "event": Object {
              "x": 1,
            },
            "eventName": "onClick",
            "responses": Array [
              Object {
                "actionId": "a",
                "actionType": "SetState",
                "skipped": true,
              },
            ],
            "success": true,
            "timestamp": Object {
              "date": 0,
            },
          },
        ],
        "loading": false,
      },
    }
  `);
  expect(context.eventLog).toMatchInlineSnapshot(`
    Array [
      Object {
        "blockId": "button",
        "event": Object {
          "x": 1,
        },
        "eventName": "onClick",
        "responses": Array [
          Object {
            "actionId": "a",
            "actionType": "SetState",
            "skipped": true,
          },
        ],
        "success": true,
        "timestamp": Object {
          "date": 0,
        },
      },
    ]
  `);
});

test('triggerEvent skip tests === true', async () => {
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
              onClick: [{ id: 'a', type: 'SetState', params: { a: 'a' }, skip: 'Truthy' }],
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
    initState: { textInput: 'init' },
  });
  const { button } = context.RootBlocks.map;
  await button.triggerEvent({ name: 'onClick', event: { x: 1 } });
  expect(button.Events.events).toMatchInlineSnapshot(`
    Object {
      "onClick": Object {
        "actions": Array [
          Object {
            "id": "a",
            "params": Object {
              "a": "a",
            },
            "skip": "Truthy",
            "type": "SetState",
          },
        ],
        "history": Array [
          Object {
            "blockId": "button",
            "event": Object {
              "x": 1,
            },
            "eventName": "onClick",
            "responses": Array [
              undefined,
            ],
            "success": true,
            "timestamp": Object {
              "date": 0,
            },
          },
        ],
        "loading": false,
      },
    }
  `);
  expect(context.eventLog).toMatchInlineSnapshot(`
    Array [
      Object {
        "blockId": "button",
        "event": Object {
          "x": 1,
        },
        "eventName": "onClick",
        "responses": Array [
          undefined,
        ],
        "success": true,
        "timestamp": Object {
          "date": 0,
        },
      },
    ]
  `);
});
