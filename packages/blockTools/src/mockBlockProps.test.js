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

import mockBlockProps from './mockBlockProps';

test('basic display', () => {
  const config = {
    id: 'a',
    type: 'Display',
  };
  const meta = {
    category: 'display',
  };
  expect(mockBlockProps(config, meta)).toEqual({ blockId: 'a', id: 'a', type: 'Display' });
});

test('basic input', () => {
  const config = {
    id: 'a',
    type: 'Input',
  };
  const meta = {
    category: 'input',
  };
  expect(mockBlockProps(config, meta)).toEqual({ blockId: 'a', id: 'a', type: 'Input' });
});

test('basic container', () => {
  const config = {
    id: 'a',
    type: 'Container',
  };
  const meta = {
    category: 'container',
  };
  expect(mockBlockProps(config, meta)).toEqual({ blockId: 'a', id: 'a', type: 'Container' });
});

test('basic context', () => {
  const config = {
    id: 'a',
    type: 'Context',
  };
  const meta = {
    category: 'context',
  };
  expect(mockBlockProps(config, meta)).toEqual({ blockId: 'a', id: 'a', type: 'Context' });
});

test('basic list', () => {
  const config = {
    id: 'a',
    type: 'List',
  };
  const meta = {
    category: 'list',
  };
  expect(mockBlockProps(config, meta)).toEqual({ blockId: 'a', id: 'a', type: 'List' });
});

test('blocks container', () => {
  const config = {
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
  const res = mockBlockProps(config, meta);
  expect(res).toMatchInlineSnapshot(`
    Object {
      "areas": Object {
        "content": Array [
          Object {
            "id": "b",
            "type": "Test",
          },
        ],
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
      "type": "Container",
    }
  `);
  expect(res.content.content()).toMatchInlineSnapshot(`
    <div
      style={
        Object {
          "border": "1px solid red",
          "padding": 10,
          "width": "100%",
        }
      }
    >
      content
    </div>
  `);
});
test('blocks areas container', () => {
  const config = {
    id: 'a',
    type: 'Container',
    blocks: [
      {
        id: 'b',
        type: 'Test',
      },
    ],
    areas: {
      content: [
        {
          id: 'x',
          type: 'Test',
        },
      ],
    },
  };
  const meta = {
    category: 'container',
  };

  const res = mockBlockProps(config, meta);
  expect(res).toMatchInlineSnapshot(`
    Object {
      "areas": Object {
        "content": Array [
          Object {
            "id": "b",
            "type": "Test",
          },
        ],
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
      "type": "Container",
    }
  `);
  expect(res.content.content()).toMatchInlineSnapshot(`
    <div
      style={
        Object {
          "border": "1px solid red",
          "padding": 10,
          "width": "100%",
        }
      }
    >
      content
    </div>
  `);
});

test('areas container', () => {
  const config = {
    id: 'a',
    type: 'Container',
    areas: {
      content: [
        {
          id: 'b',
          type: 'Test',
        },
      ],
    },
  };
  const meta = {
    category: 'container',
  };
  const res = mockBlockProps(config, meta);
  expect(res).toMatchInlineSnapshot(`
    Object {
      "areas": Object {
        "content": Array [
          Object {
            "id": "b",
            "type": "Test",
          },
        ],
      },
      "blockId": "a",
      "content": Object {
        "content": [Function],
      },
      "id": "a",
      "type": "Container",
    }
  `);
  expect(res.content.content()).toMatchInlineSnapshot(`
    <div
      style={
        Object {
          "border": "1px solid red",
          "padding": 10,
          "width": "100%",
        }
      }
    >
      content
    </div>
  `);
});

test('areas context', () => {
  const config = {
    id: 'a',
    type: 'Context',
    areas: {
      content: [
        {
          id: 'b',
          type: 'Test',
        },
      ],
    },
  };
  const meta = {
    category: 'context',
  };
  const res = mockBlockProps(config, meta);
  expect(res).toMatchInlineSnapshot(`
    Object {
      "areas": Object {
        "content": Array [
          Object {
            "id": "b",
            "type": "Test",
          },
        ],
      },
      "blockId": "a",
      "content": Object {
        "content": [Function],
      },
      "id": "a",
      "type": "Context",
    }
  `);
  expect(res.content.content()).toMatchInlineSnapshot(`
    <div
      style={
        Object {
          "border": "1px solid red",
          "padding": 10,
          "width": "100%",
        }
      }
    >
      content
    </div>
  `);
});

test('areas list', () => {
  const config = {
    id: 'a',
    type: 'List',
    areas: {
      content: [
        {
          id: 'b',
          type: 'Test',
        },
      ],
    },
  };
  const meta = {
    category: 'list',
  };
  const res = mockBlockProps(config, meta);
  expect(res).toMatchInlineSnapshot(`
    Object {
      "areas": Object {
        "content": Array [
          Object {
            "id": "b",
            "type": "Test",
          },
        ],
      },
      "blockId": "a",
      "id": "a",
      "list": Object {
        "content": [Function],
      },
      "type": "List",
    }
  `);
  expect(res.list.content()).toMatchInlineSnapshot(`
    Array [
      <div
        style={
          Object {
            "border": "1px solid red",
            "padding": 10,
            "width": "100%",
          }
        }
      >
        b
      </div>,
    ]
  `);
});

test('actions display', () => {
  global.alert = jest.fn();
  const config = {
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
  const res = mockBlockProps(config, meta);
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
      },
      "type": "Display",
    }
  `);
  res.methods.callAction({ action: 'click' });
  expect(global.alert).toBeCalledWith(JSON.stringify({ action: 'click' }, null, 2));
});
