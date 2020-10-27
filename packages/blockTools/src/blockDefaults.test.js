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

import blockDefaults from './blockDefaults';

test('default', () => {
  expect(blockDefaults()).toMatchInlineSnapshot(`
    Object {
      "actions": Object {},
      "blockId": "undefined_id",
      "content": Object {},
      "list": Array [],
      "menus": Array [],
      "methods": Object {
        "makeCssClass": [Function],
      },
      "properties": Object {},
      "user": Object {},
      "validate": Array [],
    }
  `);
});

test('default with id', () => {
  const props = { id: 'id' };
  expect(blockDefaults(props)).toMatchInlineSnapshot(`
    Object {
      "actions": Object {},
      "blockId": "id",
      "content": Object {},
      "id": "id",
      "list": Array [],
      "menus": Array [],
      "methods": Object {
        "makeCssClass": [Function],
      },
      "properties": Object {},
      "user": Object {},
      "validate": Array [],
    }
  `);
});

test('default with blockId', () => {
  const props = { blockId: 'blockId' };
  expect(blockDefaults(props)).toMatchInlineSnapshot(`
    Object {
      "actions": Object {},
      "blockId": "blockId",
      "content": Object {},
      "list": Array [],
      "menus": Array [],
      "methods": Object {
        "makeCssClass": [Function],
      },
      "properties": Object {},
      "user": Object {},
      "validate": Array [],
    }
  `);
});

test('default with blockId and id', () => {
  const props = { id: 'id', blockId: 'blockId' };
  expect(blockDefaults(props)).toMatchInlineSnapshot(`
    Object {
      "actions": Object {},
      "blockId": "id",
      "content": Object {},
      "id": "id",
      "list": Array [],
      "menus": Array [],
      "methods": Object {
        "makeCssClass": [Function],
      },
      "properties": Object {},
      "user": Object {},
      "validate": Array [],
    }
  `);
});

test('with values', () => {
  const props = {
    actions: { actions: 1 },
    Components: { Components: 1 },
    content: { content: 1 },
    list: { list: 1 },
    menus: ['menus'],
    properties: { properties: 1 },
    user: { user: 1 },
    validate: ['validate'],
  };
  expect(blockDefaults(props)).toMatchInlineSnapshot(`
    Object {
      "Components": Object {
        "Components": 1,
      },
      "actions": Object {
        "actions": 1,
      },
      "blockId": "undefined_id",
      "content": Object {
        "content": 1,
      },
      "list": Object {
        "list": 1,
      },
      "menus": Array [
        "menus",
      ],
      "methods": Object {
        "makeCssClass": [Function],
      },
      "properties": Object {
        "properties": 1,
      },
      "user": Object {
        "user": 1,
      },
      "validate": Array [
        "validate",
      ],
    }
  `);
});

test('with no methods', () => {
  const props = {
    methods: {},
  };
  expect(blockDefaults(props)).toMatchInlineSnapshot(`
    Object {
      "actions": Object {},
      "blockId": "undefined_id",
      "content": Object {},
      "list": Array [],
      "menus": Array [],
      "methods": Object {
        "makeCssClass": [Function],
      },
      "properties": Object {},
      "user": Object {},
      "validate": Array [],
    }
  `);
});

test('with methods', () => {
  const props = {
    methods: {
      callAction: 'callAction',
      registerAction: 'registerAction',
      registerMethod: 'registerMethod',
    },
  };
  expect(blockDefaults(props)).toMatchInlineSnapshot(`
    Object {
      "actions": Object {},
      "blockId": "undefined_id",
      "content": Object {},
      "list": Array [],
      "menus": Array [],
      "methods": Object {
        "callAction": "callAction",
        "makeCssClass": [Function],
        "registerAction": "registerAction",
        "registerMethod": "registerMethod",
      },
      "properties": Object {},
      "user": Object {},
      "validate": Array [],
    }
  `);
});
