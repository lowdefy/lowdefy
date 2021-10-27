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

import { useState } from 'react';

import stubBlockProps from './stubBlockProps';

jest.mock('react', () => {
  const originalModule = jest.requireActual('react');
  const useState = jest.fn();
  return { ...originalModule, useState, __esModule: true, default: originalModule };
});
const mockSetState = jest.fn();

const logger = jest.fn();
beforeEach(() => {
  logger.mockReset();
  mockSetState.mockReset();
  useState.mockReset();
  useState.mockImplementation((value) => [value, mockSetState]);
});

test('basic display', () => {
  const block = {
    id: 'a',
    type: 'Display',
  };
  const meta = {
    category: 'display',
  };
  expect(stubBlockProps({ block, meta })).toMatchInlineSnapshot(`
    Object {
      "blockId": "a",
      "eventLog": Array [],
      "events": Object {},
      "id": "a",
      "methods": Object {
        "makeCssClass": [Function],
        "registerEvent": [Function],
        "registerMethod": [Function],
        "triggerEvent": [Function],
      },
      "schemaErrors": false,
      "type": "Display",
    }
  `);
});

test('basic input', () => {
  const block = {
    id: 'a',
    type: 'Input',
  };
  const meta = {
    category: 'input',
  };
  expect(stubBlockProps({ block, meta, logger })).toMatchInlineSnapshot(`
    Object {
      "blockId": "a",
      "eventLog": Array [],
      "events": Object {},
      "id": "a",
      "methods": Object {
        "makeCssClass": [Function],
        "registerEvent": [Function],
        "registerMethod": [Function],
        "setValue": [Function],
        "triggerEvent": [Function],
      },
      "schemaErrors": false,
      "type": "Input",
      "value": null,
    }
  `);
});

test('input setState', () => {
  const block = {
    id: 'a',
    type: 'Input',
  };
  const meta = {
    category: 'input',
    valueType: 'string',
  };
  const res = stubBlockProps({ block, meta, logger });
  expect(res).toMatchInlineSnapshot(`
    Object {
      "blockId": "a",
      "eventLog": Array [],
      "events": Object {},
      "id": "a",
      "methods": Object {
        "makeCssClass": [Function],
        "registerEvent": [Function],
        "registerMethod": [Function],
        "setValue": [Function],
        "triggerEvent": [Function],
      },
      "schemaErrors": false,
      "type": "Input",
      "value": null,
    }
  `);
  res.methods.setValue('test');
  expect(mockSetState).toBeCalledWith('test');
});

test('basic container', () => {
  const block = {
    id: 'a',
    type: 'Container',
  };
  const meta = {
    category: 'container',
  };
  expect(stubBlockProps({ block, meta, logger })).toMatchInlineSnapshot(`
    Object {
      "areas": Object {
        "content": Object {},
      },
      "blockId": "a",
      "content": Object {
        "content": [Function],
      },
      "eventLog": Array [],
      "events": Object {},
      "id": "a",
      "methods": Object {
        "makeCssClass": [Function],
        "registerEvent": [Function],
        "registerMethod": [Function],
        "triggerEvent": [Function],
      },
      "schemaErrors": false,
      "type": "Container",
    }
  `);
});

test('basic context', () => {
  const block = {
    id: 'a',
    type: 'Context',
  };
  const meta = {
    category: 'context',
  };
  expect(stubBlockProps({ block, meta, logger })).toMatchInlineSnapshot(`
    Object {
      "areas": Object {
        "content": Object {},
      },
      "blockId": "a",
      "content": Object {
        "content": [Function],
      },
      "eventLog": Array [],
      "events": Object {},
      "id": "a",
      "methods": Object {
        "makeCssClass": [Function],
        "registerEvent": [Function],
        "registerMethod": [Function],
        "triggerEvent": [Function],
      },
      "schemaErrors": false,
      "type": "Context",
    }
  `);
});

test('basic list', () => {
  const block = {
    id: 'a',
    type: 'List',
  };
  const meta = {
    category: 'list',
  };
  expect(stubBlockProps({ block, meta, logger })).toMatchInlineSnapshot(`
    Object {
      "areas": Object {
        "content": Object {},
      },
      "blockId": "a",
      "eventLog": Array [],
      "events": Object {},
      "id": "a",
      "list": Array [],
      "methods": Object {
        "makeCssClass": [Function],
        "moveItemDown": [Function],
        "moveItemUp": [Function],
        "pushItem": [Function],
        "registerEvent": [Function],
        "registerMethod": [Function],
        "removeItem": [Function],
        "triggerEvent": [Function],
        "unshiftItem": [Function],
      },
      "schemaErrors": false,
      "type": "List",
    }
  `);
});

test('list methods', () => {
  const block = {
    id: 'a',
    type: 'List',
  };
  const meta = {
    category: 'list',
  };
  const res = stubBlockProps({ block, meta, logger });
  expect(res).toMatchInlineSnapshot(`
    Object {
      "areas": Object {
        "content": Object {},
      },
      "blockId": "a",
      "eventLog": Array [],
      "events": Object {},
      "id": "a",
      "list": Array [],
      "methods": Object {
        "makeCssClass": [Function],
        "moveItemDown": [Function],
        "moveItemUp": [Function],
        "pushItem": [Function],
        "registerEvent": [Function],
        "registerMethod": [Function],
        "removeItem": [Function],
        "triggerEvent": [Function],
        "unshiftItem": [Function],
      },
      "schemaErrors": false,
      "type": "List",
    }
  `);
  res.methods.moveItemDown(10);
  res.methods.moveItemUp(11);
  res.methods.removeItem(12);
  res.methods.unshiftItem();
  res.methods.pushItem();
  expect(logger).toBeCalledTimes(5);
});

test('blocks container', () => {
  const block = {
    id: 'a',
    type: 'Container',
    blocks: [
      {
        id: 'b',
        type: 'Test',
      },
    ],
  };
  const meta = {
    category: 'container',
  };
  const res = stubBlockProps({ block, meta, logger });
  expect(res).toMatchInlineSnapshot(`
    Object {
      "areas": Object {
        "content": Object {
          "blocks": Array [
            Object {
              "id": "b",
              "type": "Test",
            },
          ],
        },
      },
      "blockId": "a",
      "blocks": Array [
        Object {
          "id": "b",
          "type": "Test",
        },
      ],
      "content": Object {
        "content": [Function],
      },
      "eventLog": Array [],
      "events": Object {},
      "id": "a",
      "methods": Object {
        "makeCssClass": [Function],
        "registerEvent": [Function],
        "registerMethod": [Function],
        "triggerEvent": [Function],
      },
      "schemaErrors": false,
      "type": "Container",
    }
  `);
  expect(res.content.content()).toMatchInlineSnapshot(`
    <div
      style={
        Object {
          "border": "1px solid red",
          "padding": 10,
        }
      }
    >
      content
    </div>
  `);
});

test('blocks areas container', () => {
  const block = {
    id: 'a',
    type: 'Container',
    blocks: [
      {
        id: 'b',
        type: 'Test',
      },
    ],
    areas: {
      content: {
        blocks: [
          {
            id: 'x',
            type: 'Test',
          },
        ],
      },
    },
  };
  const meta = {
    category: 'container',
  };

  const res = stubBlockProps({ block, meta, logger });
  expect(res).toMatchInlineSnapshot(`
    Object {
      "areas": Object {
        "content": Object {
          "blocks": Array [
            Object {
              "id": "b",
              "type": "Test",
            },
          ],
        },
      },
      "blockId": "a",
      "blocks": Array [
        Object {
          "id": "b",
          "type": "Test",
        },
      ],
      "content": Object {
        "content": [Function],
      },
      "eventLog": Array [],
      "events": Object {},
      "id": "a",
      "methods": Object {
        "makeCssClass": [Function],
        "registerEvent": [Function],
        "registerMethod": [Function],
        "triggerEvent": [Function],
      },
      "schemaErrors": false,
      "type": "Container",
    }
  `);
  expect(res.content.content()).toMatchInlineSnapshot(`
    <div
      style={
        Object {
          "border": "1px solid red",
          "padding": 10,
        }
      }
    >
      content
    </div>
  `);
});

test('areas container', () => {
  const block = {
    id: 'a',
    type: 'Container',
    areas: {
      content: {
        blocks: [
          {
            id: 'b',
            type: 'Test',
          },
        ],
      },
    },
  };
  const meta = {
    category: 'container',
  };
  const res = stubBlockProps({ block, meta, logger });
  expect(res).toMatchInlineSnapshot(`
    Object {
      "areas": Object {
        "content": Object {
          "blocks": Array [
            Object {
              "id": "b",
              "type": "Test",
            },
          ],
        },
      },
      "blockId": "a",
      "content": Object {
        "content": [Function],
      },
      "eventLog": Array [],
      "events": Object {},
      "id": "a",
      "methods": Object {
        "makeCssClass": [Function],
        "registerEvent": [Function],
        "registerMethod": [Function],
        "triggerEvent": [Function],
      },
      "schemaErrors": false,
      "type": "Container",
    }
  `);
  expect(res.content.content()).toMatchInlineSnapshot(`
    <div
      style={
        Object {
          "border": "1px solid red",
          "padding": 10,
        }
      }
    >
      content
    </div>
  `);
});

test('areas context', () => {
  const block = {
    id: 'a',
    type: 'Context',
    areas: {
      content: {
        blocks: [
          {
            id: 'b',
            type: 'Test',
          },
        ],
      },
    },
  };
  const meta = {
    category: 'context',
  };
  const res = stubBlockProps({ block, meta, logger });
  expect(res).toMatchInlineSnapshot(`
    Object {
      "areas": Object {
        "content": Object {
          "blocks": Array [
            Object {
              "id": "b",
              "type": "Test",
            },
          ],
        },
      },
      "blockId": "a",
      "content": Object {
        "content": [Function],
      },
      "eventLog": Array [],
      "events": Object {},
      "id": "a",
      "methods": Object {
        "makeCssClass": [Function],
        "registerEvent": [Function],
        "registerMethod": [Function],
        "triggerEvent": [Function],
      },
      "schemaErrors": false,
      "type": "Context",
    }
  `);
  expect(res.content.content()).toMatchInlineSnapshot(`
    <div
      style={
        Object {
          "border": "1px solid red",
          "padding": 10,
        }
      }
    >
      content
    </div>
  `);
});

test('areas list', () => {
  const block = {
    id: 'a',
    type: 'List',
    areas: {
      content: {
        blocks: [
          {
            id: 'b',
            type: 'Test',
          },
        ],
      },
    },
  };
  const meta = {
    category: 'list',
  };
  const res = stubBlockProps({ block, meta, logger });
  expect(res).toMatchInlineSnapshot(`
    Object {
      "areas": Object {
        "content": Object {
          "blocks": Array [
            Object {
              "id": "b",
              "type": "Test",
            },
          ],
        },
      },
      "blockId": "a",
      "eventLog": Array [],
      "events": Object {},
      "id": "a",
      "list": Array [
        Object {
          "content": [Function],
        },
      ],
      "methods": Object {
        "makeCssClass": [Function],
        "moveItemDown": [Function],
        "moveItemUp": [Function],
        "pushItem": [Function],
        "registerEvent": [Function],
        "registerMethod": [Function],
        "removeItem": [Function],
        "triggerEvent": [Function],
        "unshiftItem": [Function],
      },
      "schemaErrors": false,
      "type": "List",
    }
  `);
  expect(res.list[0].content()).toMatchInlineSnapshot(`
    <div
      style={
        Object {
          "border": "1px solid red",
          "padding": 10,
        }
      }
    >
      b
    </div>
  `);
});

test('events display', () => {
  const block = {
    id: 'a',
    type: 'Display',
    events: {
      onClick: [
        {
          id: 'c',
          type: 'Test',
        },
      ],
    },
  };
  const meta = {
    category: 'display',
  };
  const res = stubBlockProps({ block, meta, logger });
  expect(res).toMatchInlineSnapshot(`
    Object {
      "blockId": "a",
      "eventLog": Array [],
      "events": Object {
        "onClick": Array [
          Object {
            "id": "c",
            "type": "Test",
          },
        ],
      },
      "id": "a",
      "methods": Object {
        "makeCssClass": [Function],
        "registerEvent": [Function],
        "registerMethod": [Function],
        "triggerEvent": [Function],
      },
      "schemaErrors": false,
      "type": "Display",
    }
  `);
});

test('provide schema errors', () => {
  let block = {
    id: 'a',
    type: 'DisplayError',
    properties: {
      mistake: true,
    },
  };
  const meta = {
    category: 'display',
    schema: {
      properties: {
        type: 'object',
        additionalProperties: false,
        properties: {
          mistake: {
            type: 'boolean',
          },
        },
      },
    },
  };
  expect(stubBlockProps({ block, meta })).toMatchInlineSnapshot(`
    Object {
      "blockId": "a",
      "eventLog": Array [],
      "events": Object {},
      "id": "a",
      "methods": Object {
        "makeCssClass": [Function],
        "registerEvent": [Function],
        "registerMethod": [Function],
        "triggerEvent": [Function],
      },
      "properties": Object {
        "mistake": true,
      },
      "schemaErrors": false,
      "type": "DisplayError",
    }
  `);
  block = {
    id: 'a',
    type: 'DisplayError',
    properties: {
      mistake: 1,
    },
  };
  expect(stubBlockProps({ block, meta })).toMatchInlineSnapshot(`
    Object {
      "blockId": "a",
      "eventLog": Array [],
      "events": Object {},
      "id": "a",
      "methods": Object {
        "makeCssClass": [Function],
        "registerEvent": [Function],
        "registerMethod": [Function],
        "triggerEvent": [Function],
      },
      "properties": Object {
        "mistake": 1,
      },
      "schemaErrors": Array [
        Object {
          "dataPath": "/properties/mistake",
          "keyword": "type",
          "message": "should be boolean",
          "params": Object {
            "type": "boolean",
          },
          "schemaPath": "#/properties/properties/properties/mistake/type",
        },
      ],
      "type": "DisplayError",
    }
  `);
});

test('throw schema error', () => {
  let block = {
    id: 'a',
    type: 'Error',
    properties: {
      mistake: true,
    },
  };
  const meta = {
    category: 'display',
    schema: {
      properties: {
        type: 'MISTAKE',
        additionalProperties: false,
        properties: {
          value: {
            type: 'boolean',
          },
        },
      },
    },
  };
  expect(() => stubBlockProps({ block, meta })).toThrowErrorMatchingInlineSnapshot(
    `"Schema error in Error - schema is invalid: data/properties/properties/type should be equal to one of the allowed values, data/properties/properties/type should be array, data/properties/properties/type should match some schema in anyOf"`
  );
});

test('register and call methods', () => {
  const block = {
    id: 'a',
    type: 'Display',
  };
  const meta = {
    category: 'display',
  };
  const res = stubBlockProps({ block, meta });
  const mockMethod = jest.fn();
  res.methods.registerMethod('methodsName', mockMethod);
  expect(res.methods.methodsName).toBeDefined();
  res.methods.methodsName({ test: 1 });
  expect(mockMethod).toBeCalledWith({ test: 1 });
});

test('register and call events', () => {
  const block = {
    id: 'a',
    type: 'Display',
  };
  const meta = {
    category: 'display',
  };
  const res = stubBlockProps({ block, meta });
  res.methods.registerEvent({ name: 'eventName', actions: [{ id: 'reset', type: 'Reset' }] });
  expect(res.events).toEqual({
    eventName: [{ id: 'reset', type: 'Reset' }],
  });
  res.methods.triggerEvent({ name: 'eventName', event: { a: 1 } });
  expect(res.eventLog).toEqual([{ name: 'eventName', event: { a: 1 } }]);
  res.methods.triggerEvent({ name: 'eventName', event: { a: 2 } });
  expect(res.eventLog).toEqual([
    { name: 'eventName', event: { a: 2 } },
    { name: 'eventName', event: { a: 1 } },
  ]);
});
