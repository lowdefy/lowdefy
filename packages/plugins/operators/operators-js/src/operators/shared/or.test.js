/*
  Copyright 2020-2022 Lowdefy, Inc

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
import { NodeParser, WebParser } from '@lowdefy/operators';
import _or from './or.js';

const operators = {
  _or,
};

test('_or false', () => {
  expect(_or({ params: [0, 0] })).toEqual(false);
  expect(_or({ params: [false, false] })).toEqual(false);
});
test('_or true', () => {
  expect(_or({ params: [0, 1] })).toEqual(true);
  expect(_or({ params: [1, 2] })).toEqual(true);
  expect(_or({ params: [1, 2, 3] })).toEqual(true);
  expect(_or({ params: [1, 2, 3, 0] })).toEqual(true);
  expect(_or({ params: [true, true] })).toEqual(true);
  expect(_or({ params: [false, true] })).toEqual(true);
});
test('_or errors', () => {
  expect(() => _or({ params: 'hello' })).toThrow('_or takes an array type.');
  expect(() => _or({ params: null })).toThrow('_or takes an array type.');
  expect(() => _or({ params: true })).toThrow('_or takes an array type.');
  expect(() => _or({ params: false })).toThrow('_or takes an array type.');
});

test('_or evaluated in NodeParser', () => {
  const input = { a: { _or: [true, false] } };
  const parser = new NodeParser({ operators, payload: {}, secrets: {}, user: {} });
  const res = parser.parse({ input });
  expect(res).toEqual({ a: true });
});

test('_or evaluated in WebParser', () => {
  const context = {
    _internal: {
      lowdefy: {
        basePath: 'basePath',
        inputs: { id: true },
        lowdefyGlobal: { global: true },
        menus: [{ menus: true }],
        urlQuery: { urlQuery: true },
        user: { user: true },
        home: {
          pageId: 'home.pageId',
          configured: false,
        },
        _internal: {
          window: {
            location: {
              hash: 'window.location.hash',
              host: 'window.location.host',
              hostname: 'window.location.hostname',
              href: 'window.location.href',
              origin: 'window.location.origin',
              pathname: 'window.location.pathname',
              port: 'window.location.port',
              protocol: 'window.location.protocol',
              search: 'window.location.search',
            },
          },
        },
      },
    },
    eventLog: [{ eventLog: true }],
    id: 'id',
    requests: [{ requests: true }],
    state: { state: true },
  };
  const input = { a: { _or: [true, false] } };
  const parser = new WebParser({ context, operators });
  const res = parser.parse({ input });
  expect(res).toEqual({ a: true });
});
