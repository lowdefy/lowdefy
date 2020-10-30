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

import { useState } from 'react';
import stubBlockProps from './stubBlockProps';

jest.mock('react', () => {
  const React = {
    createElement: jest.fn(),
  };
  const useState = jest.fn();
  return { useState, default: React, __esModule: true };
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
      "id": "a",
      "methods": Object {
        "callAction": [Function],
        "makeCssClass": [Function],
        "registerAction": [Function],
        "registerMethod": [Function],
      },
      "schemaErrors": false,
      "type": "Display",
    }
  `);
});

test('basic display with methods', () => {
  const realAlert = global.alert;
  global.alert = jest.fn();
  const block = {
    id: 'a',
    type: 'Display',
    methods: { fn: 'test' },
  };
  const meta = {
    category: 'display',
  };
  const res = stubBlockProps({ block, meta });
  expect(res).toMatchInlineSnapshot(`
    Object {
      "blockId": "a",
      "id": "a",
      "methods": Object {
        "callAction": [Function],
        "makeCssClass": [Function],
        "registerAction": [Function],
        "registerMethod": [Function],
      },
      "schemaErrors": Array [
        Object {
          "dataPath": "",
          "keyword": "additionalProperties",
          "message": "should NOT have additional properties",
          "params": Object {
            "additionalProperty": "methods",
          },
          "schemaPath": "#/additionalProperties",
        },
      ],
      "type": "Display",
    }
  `);
  res.methods.callAction();
  res.methods.registerAction();
  res.methods.registerMethod();
  expect(global.alert).toBeCalledTimes(3);
  global.alert = realAlert;
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
      "id": "a",
      "methods": Object {
        "callAction": [Function],
        "makeCssClass": [Function],
        "registerAction": [Function],
        "registerMethod": [Function],
        "setValue": [Function],
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
      "id": "a",
      "methods": Object {
        "callAction": [Function],
        "makeCssClass": [Function],
        "registerAction": [Function],
        "registerMethod": [Function],
        "setValue": [Function],
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
      "id": "a",
      "methods": Object {
        "callAction": [Function],
        "makeCssClass": [Function],
        "registerAction": [Function],
        "registerMethod": [Function],
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
      "id": "a",
      "methods": Object {
        "callAction": [Function],
        "makeCssClass": [Function],
        "registerAction": [Function],
        "registerMethod": [Function],
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
      "id": "a",
      "list": Array [],
      "methods": Object {
        "callAction": [Function],
        "makeCssClass": [Function],
        "moveItemDown": [Function],
        "moveItemUp": [Function],
        "pushItem": [Function],
        "registerAction": [Function],
        "registerMethod": [Function],
        "removeItem": [Function],
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
      "id": "a",
      "list": Array [],
      "methods": Object {
        "callAction": [Function],
        "makeCssClass": [Function],
        "moveItemDown": [Function],
        "moveItemUp": [Function],
        "pushItem": [Function],
        "registerAction": [Function],
        "registerMethod": [Function],
        "removeItem": [Function],
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
      "id": "a",
      "methods": Object {
        "callAction": [Function],
        "makeCssClass": [Function],
        "registerAction": [Function],
        "registerMethod": [Function],
      },
      "schemaErrors": false,
      "type": "Container",
    }
  `);
  expect(res.content.content()).toMatchInlineSnapshot(`undefined`);
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
      "id": "a",
      "methods": Object {
        "callAction": [Function],
        "makeCssClass": [Function],
        "registerAction": [Function],
        "registerMethod": [Function],
      },
      "schemaErrors": false,
      "type": "Container",
    }
  `);
  expect(res.content.content()).toMatchInlineSnapshot(`undefined`);
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
      "id": "a",
      "methods": Object {
        "callAction": [Function],
        "makeCssClass": [Function],
        "registerAction": [Function],
        "registerMethod": [Function],
      },
      "schemaErrors": false,
      "type": "Container",
    }
  `);
  expect(res.content.content()).toMatchInlineSnapshot(`undefined`);
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
      "id": "a",
      "methods": Object {
        "callAction": [Function],
        "makeCssClass": [Function],
        "registerAction": [Function],
        "registerMethod": [Function],
      },
      "schemaErrors": false,
      "type": "Context",
    }
  `);
  expect(res.content.content()).toMatchInlineSnapshot(`undefined`);
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
      "id": "a",
      "list": Array [
        Object {
          "content": [Function],
        },
      ],
      "methods": Object {
        "callAction": [Function],
        "makeCssClass": [Function],
        "moveItemDown": [Function],
        "moveItemUp": [Function],
        "pushItem": [Function],
        "registerAction": [Function],
        "registerMethod": [Function],
        "removeItem": [Function],
        "unshiftItem": [Function],
      },
      "schemaErrors": false,
      "type": "List",
    }
  `);
  expect(res.list[0].content()).toMatchInlineSnapshot(`undefined`);
});

test('actions display', () => {
  const block = {
    id: 'a',
    type: 'Display',
    actions: {
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
      "actions": Object {
        "onClick": Array [
          Object {
            "id": "c",
            "type": "Test",
          },
        ],
      },
      "blockId": "a",
      "id": "a",
      "methods": Object {
        "callAction": [Function],
        "makeCssClass": [Function],
        "registerAction": [Function],
        "registerMethod": [Function],
      },
      "schemaErrors": false,
      "type": "Display",
    }
  `);
  res.methods.callAction({ action: 'click' });
  res.methods.registerAction({ action: 'onClick' });
  res.methods.registerMethod({ action: 'open' });
  expect(logger).toBeCalledTimes(3);
});

test('provide schema errors', () => {
  let block = {
    id: 'a',
    type: 'Display',
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
      "id": "a",
      "methods": Object {
        "callAction": [Function],
        "makeCssClass": [Function],
        "registerAction": [Function],
        "registerMethod": [Function],
      },
      "properties": Object {
        "mistake": true,
      },
      "schemaErrors": false,
      "type": "Display",
    }
  `);
  block = {
    id: 'a',
    type: 'Display',
    properties: {
      mistake: 1,
    },
  };
  expect(stubBlockProps({ block, meta })).toMatchInlineSnapshot(`
    Object {
      "blockId": "a",
      "id": "a",
      "methods": Object {
        "callAction": [Function],
        "makeCssClass": [Function],
        "registerAction": [Function],
        "registerMethod": [Function],
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
      "type": "Display",
    }
  `);
});
