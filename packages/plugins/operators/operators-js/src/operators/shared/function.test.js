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
import { evaluateOperators, ServerParser, WebParser } from '@lowdefy/operators';
import _function from './function.js';
import _args from './args.js';
import _array from './array.js';
import _eq from './eq.js';
import _if from './if.js';
import _payload from '../server/payload.js';
import _state from '../shared/state.js';

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
  const parser = new ServerParser({ operators, secrets: {}, user: {} });
  const params = { __payload: 'string' };
  const fn = _function({ location, params, parser, payload, operatorPrefix: '_' });
  expect(fn).toBeInstanceOf(Function);
  expect(fn()).toEqual('Some String');
});

test('ServerParser, nested function call', () => {
  const parser = new ServerParser({ operators, secrets: {}, user: {} });
  const params = { ___payload: 'string' };
  const fn = _function({ location, params, parser, payload, operatorPrefix: '__' });
  expect(fn).toBeInstanceOf(Function);
  expect(fn()).toEqual('Some String');
});

test('ServerParser, _function gives args as an array', () => {
  const parser = new ServerParser({ operators, secrets: {}, user: {} });
  const params = { __args: true };
  const fn = _function({ location, params, parser, payload, operatorPrefix: '_' });
  expect(fn('a')).toEqual(['a']);
  expect(fn('a', { b: true })).toEqual(['a', { b: true }]);
});

test('ServerParser, _function throws on parser errors', () => {
  const parser = new ServerParser({ operators, secrets: {}, user: {} });
  const params = { __payload: [] };
  const fn = _function({ location, params, parser, payload, operatorPrefix: '_' });
  expect(fn).toThrow('_payload params must be of type string, integer, boolean or object.');
});

test('WebParser, _function that gets from state', () => {
  const parser = new WebParser({ context, operators });
  const params = { __state: 'string' };
  const fn = _function({ location, params, parser, payload, operatorPrefix: '_' });
  expect(fn).toBeInstanceOf(Function);
  expect(fn()).toEqual('Some String');
  expect(fn()).toEqual('Some String');
});

test('WebParser, _function gives args as an array', () => {
  const parser = new WebParser({ context, operators });
  const params = { __args: true };
  const fn = _function({ location, params, parser, payload, operatorPrefix: '_' });
  expect(fn('a')).toEqual(['a']);
  expect(fn('a', { b: true })).toEqual(['a', { b: true }]);
});

test('WebParser, _function throws on parser errors', () => {
  const parser = new WebParser({ context, operators });
  const params = { __state: [] };
  const fn = _function({ location, params, parser, payload, operatorPrefix: '_' });
  expect(fn).toThrow('_state params must be of type string, integer, boolean or object.');
});

test('evaluateOperators, _function callback template not mutated across repeated invocations', () => {
  const buildOperators = { _args, _array, _function };
  const input = {
    items: {
      '_build.array.map': {
        on: [
          { id: 'alpha', label: 'Alpha' },
          { id: 'beta', label: 'Beta' },
          { id: 'gamma', label: 'Gamma' },
        ],
        callback: {
          '_build.function': {
            value: { '__build.args': '0.id' },
            title: { '__build.args': '0.label' },
          },
        },
      },
    },
  };
  const res = evaluateOperators({
    input,
    operators: buildOperators,
    operatorPrefix: '_build.',
  });
  expect(res.errors).toEqual([]);
  expect(res.output.items).toEqual([
    { value: 'alpha', title: 'Alpha' },
    { value: 'beta', title: 'Beta' },
    { value: 'gamma', title: 'Gamma' },
  ]);
});

// The build passes a dynamicIdentifiers set containing _function. Nested escaped build
// functions (__build.function, ___build.function, …) must still evaluate at build time —
// the dynamic-identifier deferral only applies to runtime prefixes.
test('evaluateOperators, __build.function comparator nested in _build.function evaluates with build dynamicIdentifiers', () => {
  const buildOperators = { _args, _array, _eq, _function, _if };
  const dynamicIdentifiers = new Set(['_function']);
  const input = {
    deduped: {
      '_build.array.reduce': [
        [{ value: { id: 'a' } }, { value: { id: 'b' } }, { value: { id: 'a' } }],
        {
          '_build.function': {
            '__build.if': {
              test: {
                '__build.eq': [
                  {
                    '__build.array.findIndex': [
                      { '__build.args': '0' },
                      {
                        '__build.function': {
                          '___build.eq': [
                            { '__build.args': '1.value.id' },
                            { '___build.args': '0.value.id' },
                          ],
                        },
                      },
                    ],
                  },
                  -1,
                ],
              },
              then: {
                '__build.array.concat': [{ '__build.args': '0' }, [{ '__build.args': '1' }]],
              },
              else: { '__build.args': '0' },
            },
          },
        },
        [],
      ],
    },
  };
  const res = evaluateOperators({
    input,
    operators: buildOperators,
    operatorPrefix: '_build.',
    dynamicIdentifiers,
  });
  expect(res.errors).toEqual([]);
  expect(res.output.deduped).toEqual([{ value: { id: 'a' } }, { value: { id: 'b' } }]);
});

test('evaluateOperators, __build.array.map nested in _build.function evaluates with build dynamicIdentifiers', () => {
  const buildOperators = { _args, _array, _function };
  const dynamicIdentifiers = new Set(['_function']);
  const input = {
    fields: {
      '_build.array.map': {
        on: [{ ratings: ['x', 'y'] }],
        callback: {
          '_build.function': {
            $avg: {
              '__build.array.map': [
                { '__build.args': '0.ratings' },
                { '__build.function': { '___build.args': '0' } },
              ],
            },
          },
        },
      },
    },
  };
  const res = evaluateOperators({
    input,
    operators: buildOperators,
    operatorPrefix: '_build.',
    dynamicIdentifiers,
  });
  expect(res.errors).toEqual([]);
  expect(res.output.fields).toEqual([{ $avg: ['x', 'y'] }]);
});
