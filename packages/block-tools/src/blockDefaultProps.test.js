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

import blockDefaultProps from './blockDefaultProps.js';

test('default', () => {
  expect(blockDefaultProps).toMatchInlineSnapshot(`
    Object {
      "basePath": "",
      "blockId": "undefined_id",
      "content": Object {},
      "events": Object {},
      "list": Array [],
      "menus": Array [],
      "methods": Object {
        "makeCssClass": [Function],
        "registerEvent": [Function],
        "registerMethod": [Function],
        "triggerEvent": [Function],
      },
      "properties": Object {},
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
  expect(blockDefaultProps.methods.makeCssClass({ a: 1 })).toMatchInlineSnapshot(`"css-1iomdgj"`);
  expect(blockDefaultProps.methods.registerEvent()).toEqual(undefined);
  expect(blockDefaultProps.methods.registerMethod()).toEqual(undefined);
  expect(blockDefaultProps.methods.triggerEvent()).toEqual(undefined);
});
