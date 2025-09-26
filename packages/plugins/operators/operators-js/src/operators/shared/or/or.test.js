/*
  Copyright 2020-2024 Lowdefy, Inc

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
import { ServerParser, WebParser } from '@lowdefy/operators';
import _or from './or.js';

const operators = {
  _or,
};

const location = 'location';

test('_or false', () => {
  expect(_or({ params: [0, 0], location })).toEqual(false);
  expect(_or({ params: [false, false], location })).toEqual(false);
});
test('_or true', () => {
  expect(_or({ params: [0, 1], location })).toEqual(true);
  expect(_or({ params: [1, 2], location })).toEqual(true);
  expect(_or({ params: [1, 2, 3], location })).toEqual(true);
  expect(_or({ params: [1, 2, 3, 0], location })).toEqual(true);
  expect(_or({ params: [true, true], location })).toEqual(true);
  expect(_or({ params: [false, true], location })).toEqual(true);
});
test('_or errors', () => {
  expect(() => _or({ params: 'hello', location })).toThrow(
    'Operator Error: _or takes an array type. Received: "hello" at location.'
  );
  expect(() => _or({ params: null, location })).toThrow(
    'Operator Error: _or takes an array type. Received: null at location.'
  );
  expect(() => _or({ params: true, location })).toThrow(
    'Operator Error: _or takes an array type. Received: true at location.'
  );
  expect(() => _or({ params: false, location })).toThrow(
    'Operator Error: _or takes an array type. Received: false at location.'
  );
});

test('_or evaluated in ServerParser', () => {
  const input = { a: { _or: [true, false] } };
  const parser = new ServerParser({ operators, payload: {}, secrets: {}, user: {} });
  const res = parser.parse({ input, location });
  expect(res.output).toEqual({ a: true });
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
  const res = parser.parse({ input, location });
  expect(res.output).toEqual({ a: true });
});
