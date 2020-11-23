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

import blockDefaultProps from './blockDefaultProps';
import makeCssClass from './makeCssClass';

const makeCssImp = (style, op) => JSON.stringify({ style, options: op });

jest.mock('./makeCssClass', () => {
  const makeCssClass = jest.fn();
  return { default: makeCssClass, __esModule: true };
});

beforeEach(() => {
  makeCssClass.mockReset();
  makeCssClass.mockImplementation(makeCssImp);
});

test('default', () => {
  expect(blockDefaultProps).toMatchInlineSnapshot(`
    Object {
      "actions": Object {},
      "blockId": "undefined_id",
      "content": Object {},
      "list": Array [],
      "menus": Array [],
      "methods": Object {
        "callAction": [Function],
        "makeCssClass": [MockFunction],
        "registerAction": [Function],
        "registerMethod": [Function],
      },
      "properties": Object {},
      "rename": Object {},
      "required": false,
      "user": Object {},
      "validation": Object {
        "errors": Array [],
        "status": null,
        "warnings": Array [],
      },
    }
  `);
});

test('call default methods', () => {
  expect(blockDefaultProps.methods.callAction()).toEqual(undefined);
  expect(blockDefaultProps.methods.registerAction()).toEqual(undefined);
  expect(blockDefaultProps.methods.registerMethod()).toEqual(undefined);
  expect(blockDefaultProps.methods.makeCssClass({ a: 1 })).toEqual('{"style":{"a":1}}');
});
