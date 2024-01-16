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
import _function from './function.js';
import _args from './args.js';
import _payload from '../server/payload.js';
import _state from '../client/state.js';

const operators = {
  _args,
  _function,
  _payload,
  _state,
};

const state = {
  string: 'Some String',
  number: 42,
  arr: [{ a: 'a1' }, { a: 'a2' }],
};

const payload = {
  string: 'Some String',
  number: 42,
  arr: [{ a: 'a1' }, { a: 'a2' }],
};
const location = 'location';

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
  state,
};

console.error = () => {};

// TODO: Test cases with different operatorPrefix

test('ServerParser, _function that gets from payload', () => {
  const parser = new ServerParser({ operators, payload, secrets: {}, user: {} });
  const params = { __payload: 'string' };
  const fn = _function({ location, params, parser, operatorPrefix: '_' });
  expect(fn).toBeInstanceOf(Function);
  expect(fn()).toEqual('Some String');
});

test('ServerParser, nested function call', () => {
  const parser = new ServerParser({ operators, payload, secrets: {}, user: {} });
  const params = { ___payload: 'string' };
  const fn = _function({ location, params, parser, operatorPrefix: '__' });
  expect(fn).toBeInstanceOf(Function);
  expect(fn()).toEqual('Some String');
});

test('ServerParser, _function gives args as an array', () => {
  const parser = new ServerParser({ operators, payload, secrets: {}, user: {} });
  const params = { __args: true };
  const fn = _function({ location, params, parser, operatorPrefix: '_' });
  expect(fn('a')).toEqual(['a']);
  expect(fn('a', { b: true })).toEqual(['a', { b: true }]);
});

test('ServerParser, _function throws on parser errors', () => {
  const parser = new ServerParser({ operators, payload, secrets: {}, user: {} });
  const params = { __payload: [] };
  const fn = _function({ location, params, parser, operatorPrefix: '_' });
  expect(fn).toThrow(
    'Error: Operator Error: _payload params must be of type string, integer, boolean or object. Received: [] at location.'
  );
});

test('WebParser, _function that gets from state', () => {
  const parser = new WebParser({ context, operators });
  const params = { __state: 'string' };
  const fn = _function({ location, params, parser, operatorPrefix: '_' });
  expect(fn).toBeInstanceOf(Function);
  expect(fn()).toEqual('Some String');
  expect(fn()).toEqual('Some String');
});

test('WebParser, _function gives args as an array', () => {
  const parser = new WebParser({ context, operators });
  const params = { __args: true };
  const fn = _function({ location, params, parser, operatorPrefix: '_' });
  expect(fn('a')).toEqual(['a']);
  expect(fn('a', { b: true })).toEqual(['a', { b: true }]);
});

test('WebParser, _function throws on parser errors', () => {
  const parser = new WebParser({ context, operators });
  const params = { __state: [] };
  const fn = _function({ location, params, parser, operatorPrefix: '_' });
  expect(fn).toThrow(
    'Error: Operator Error: _state params must be of type string, integer, boolean or object. Received: [] at location.'
  );
});
