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

import React from 'react';
import blockDefaults from './blockDefaults';

const mockMath = Object.create(global.Math);
mockMath.random = () => 0.123456789;
global.Math = mockMath;

test('default', () => {
  const Comp = () => <div>Comp</div>;
  const res = blockDefaults(Comp);
  const props = {};
  expect(res(props)).toMatchInlineSnapshot(`
    <Comp
      Components={Object {}}
      actions={Object {}}
      blockId="blockId_1f9add"
      content={Object {}}
      list={Array []}
      menus={Array []}
      methods={
        Object {
          "callAction": [Function],
          "makeCssClass": [Function],
          "registerAction": [Function],
          "registerMethod": [Function],
        }
      }
      properties={Object {}}
      user={Object {}}
      validate={Array []}
    />
  `);
});

test('with values', () => {
  const Comp = () => <div>Comp</div>;
  const res = blockDefaults(Comp);
  const props = {
    actions: { actions: 1 },
    Components: { Components: 1 },
    blockId: '1',
    content: { content: 1 },
    list: { list: 1 },
    menus: ['menus'],
    properties: { properties: 1 },
    user: { user: 1 },
    validate: ['validate'],
  };
  expect(res(props)).toMatchInlineSnapshot(`
    <Comp
      Components={
        Object {
          "Components": 1,
        }
      }
      actions={
        Object {
          "actions": 1,
        }
      }
      blockId="1"
      content={
        Object {
          "content": 1,
        }
      }
      list={
        Object {
          "list": 1,
        }
      }
      menus={
        Array [
          "menus",
        ]
      }
      methods={
        Object {
          "callAction": [Function],
          "makeCssClass": [Function],
          "registerAction": [Function],
          "registerMethod": [Function],
        }
      }
      properties={
        Object {
          "properties": 1,
        }
      }
      user={
        Object {
          "user": 1,
        }
      }
      validate={
        Array [
          "validate",
        ]
      }
    />
  `);
});

test('with no methods', () => {
  const Comp = () => <div>Comp</div>;
  const res = blockDefaults(Comp);
  const props = {
    methods: {},
  };
  expect(res(props)).toMatchInlineSnapshot(`
    <Comp
      Components={Object {}}
      actions={Object {}}
      blockId="blockId_1f9add"
      content={Object {}}
      list={Array []}
      menus={Array []}
      methods={
        Object {
          "callAction": [Function],
          "makeCssClass": [Function],
          "registerAction": [Function],
          "registerMethod": [Function],
        }
      }
      properties={Object {}}
      user={Object {}}
      validate={Array []}
    />
  `);
});

test('with methods', () => {
  const Comp = () => <div>Comp</div>;
  const res = blockDefaults(Comp);
  const props = {
    methods: {
      callAction: 'callAction',
      registerAction: 'registerAction',
      registerMethod: 'registerMethod',
    },
  };
  expect(res(props)).toMatchInlineSnapshot(`
    <Comp
      Components={Object {}}
      actions={Object {}}
      blockId="blockId_1f9add"
      content={Object {}}
      list={Array []}
      menus={Array []}
      methods={
        Object {
          "callAction": "callAction",
          "makeCssClass": [Function],
          "registerAction": "registerAction",
          "registerMethod": "registerMethod",
        }
      }
      properties={Object {}}
      user={Object {}}
      validate={Array []}
    />
  `);
});
