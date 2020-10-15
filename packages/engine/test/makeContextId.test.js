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

import makeContextId from '../src/makeContextId';

test('makeContextId, empty urlQuery', () => {
  expect(
    makeContextId({
      blockId: 'blockId',
      pageId: 'pageId',
      search: {},
    })
  ).toEqual('pageId:blockId:{}');
});

test('makeContextId, search', () => {
  expect(
    makeContextId({
      blockId: 'blockId',
      pageId: 'pageId',
      urlQuery: { a: 1 },
    })
  ).toEqual('pageId:blockId:{"a":1}');
});

test('makeContextId, undefined urlQuery', () => {
  expect(
    makeContextId({
      blockId: 'blockId',
      pageId: 'pageId',
    })
  ).toEqual('pageId:blockId:{}');
});

test('makeContextId, undefined blockId', () => {
  expect(() =>
    makeContextId({
      pageId: 'pageId',
      search: {},
    })
  ).toThrow('Expected string for parameter blockId, received undefined');
});

test('makeContextId, blockId not a string', () => {
  expect(() =>
    makeContextId({
      blockId: 1,
      pageId: 'pageId',
      search: {},
    })
  ).toThrow('Expected string for parameter blockId, received 1');
});

test('makeContextId, undefined pageId', () => {
  expect(() =>
    makeContextId({
      blockId: 'blockId',
      search: {},
    })
  ).toThrow('Expected string for parameter pageId, received undefined');
});

test('makeContextId, pageId not a string', () => {
  expect(() =>
    makeContextId({
      pageId: 1,
      blockId: 'blockId',
      search: {},
    })
  ).toThrow('Expected string for parameter pageId, received 1');
});
