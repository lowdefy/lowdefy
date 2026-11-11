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

import { beforeEach, expect, test } from 'vitest';

import makeRefDefinition from './makeRefDefinition.js';
import makeId from '../../utils/makeId.js';

beforeEach(() => {
  makeId.reset();
});

test('makeRefDefinition uses the walker path as the ref id', () => {
  const refMap = {};
  const refDef = makeRefDefinition('pages/home.yaml', '1', refMap, 3, 'pages.0');
  expect(refDef.id).toEqual('pages.0');
  expect(refMap).toEqual({ 'pages.0': { parent: '1', lineNumber: 3 } });
});

test('makeRefDefinition takes a counter id when there is no walker path', () => {
  const refMap = {};
  expect(makeRefDefinition('lowdefy.yaml', null, refMap).id).toEqual('1');
  expect(makeRefDefinition('module.lowdefy.yaml', null, refMap).id).toEqual('2');
});

test('makeRefDefinition suffixes the parent id for a file whose root content is a _ref', () => {
  const refMap = {};
  const page = makeRefDefinition('pages/home.yaml', '1', refMap, 1, 'pages.0');
  const template = makeRefDefinition('templates/page.yaml', page.id, refMap, 1, 'pages.0');
  const layout = makeRefDefinition('templates/layout.yaml', template.id, refMap, 1, 'pages.0');
  expect(template.id).toEqual('pages.0~1');
  expect(layout.id).toEqual('pages.0~1~1');
  expect(refMap['pages.0']).toEqual({ parent: '1', lineNumber: 1 });
  expect(refMap['pages.0~1']).toEqual({ parent: 'pages.0', lineNumber: 1 });
  expect(refMap['pages.0~1~1']).toEqual({ parent: 'pages.0~1', lineNumber: 1 });
  expect(makeId.counter).toEqual(0);
});

test('makeRefDefinition suffixes the walker path for a _ref in the vars of a ref at the same path', () => {
  const refMap = {};
  const page = makeRefDefinition('pages/home.yaml', '1', refMap, 1, 'pages.0');
  const first = makeRefDefinition('content/a.yaml', '1', refMap, 4, 'pages.0');
  const second = makeRefDefinition('content/b.yaml', '1', refMap, 5, 'pages.0');
  const template = makeRefDefinition('templates/page.yaml', page.id, refMap, 1, 'pages.0');
  expect([first.id, second.id, template.id]).toEqual(['pages.0~1', 'pages.0~2', 'pages.0~3']);
});

test('makeRefDefinition gives root refs of var refs ids that do not depend on resolve order', () => {
  function register(order) {
    const refMap = {};
    makeRefDefinition('pages/home.yaml', '1', refMap, 1, 'pages.0');
    const first = makeRefDefinition('content/a.yaml', '1', refMap, 4, 'pages.0');
    const second = makeRefDefinition('content/b.yaml', '1', refMap, 5, 'pages.0');
    const parents = { a: first.id, b: second.id };
    const ids = {};
    for (const name of order) {
      ids[name] = makeRefDefinition(`root/${name}.yaml`, parents[name], refMap, 1, 'pages.0').id;
    }
    return ids;
  }
  expect(register(['a', 'b'])).toEqual({ a: 'pages.0~1~1', b: 'pages.0~2~1' });
  expect(register(['b', 'a'])).toEqual({ a: 'pages.0~1~1', b: 'pages.0~2~1' });
});
