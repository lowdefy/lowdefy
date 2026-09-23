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
import _item from '../server/item.js';
import _payload from '../server/payload.js';
import _state from '../shared/state.js';

const operators = {
  _args,
  _function,
  _item,
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

// _function takes no frame fields of its own: it re-enters the parser it was handed, which is bound to
// the frame of the parse call that created it. These tests evaluate _function through parser.parse so
// they exercise that binding, the same way routines and pages do.

function parseServer(input, frame = {}) {
  const parser = new ServerParser({ operators, secrets: {}, user: {} });
  const { output, errors } = parser.parse({ input, location, ...frame });
  expect(errors).toEqual([]);
  return output;
}

function parseWeb(input, frame = {}) {
  const parser = new WebParser({ context, operators });
  const { output, errors } = parser.parse({ input, location, ...frame });
  expect(errors).toEqual([]);
  return output;
}

test('ServerParser, _function that gets from payload', () => {
  const fn = parseServer({ _function: { __payload: 'string' } }, { payload });
  expect(fn).toBeInstanceOf(Function);
  expect(fn()).toEqual('Some String');
});

test('ServerParser, nested function call', () => {
  const fn = parseServer(
    { __function: { ___payload: 'string' } },
    { operatorPrefix: '__', payload }
  );
  expect(fn).toBeInstanceOf(Function);
  expect(fn()).toEqual('Some String');
});

test('ServerParser, _function gives args as an array', () => {
  const fn = parseServer({ _function: { __args: true } });
  expect(fn('a')).toEqual(['a']);
  expect(fn('a', { b: true })).toEqual(['a', { b: true }]);
});

test('ServerParser, _function that gets from routine state', () => {
  const fn = parseServer({ _function: { __state: 'number' } }, { state });
  expect(fn()).toEqual(42);
});

test('ServerParser, _function that gets from items', () => {
  const fn = parseServer({ _function: { __item: 'row.a' } }, { items: { row: { a: 'a1' } } });
  expect(fn()).toEqual('a1');
});

test('ServerParser, __function nested in _function keeps routine state and items', () => {
  const fn = parseServer(
    { _function: { __function: [{ ___state: 'string' }, { ___item: 'row.a' }, { ___args: 0 }] } },
    { items: { row: { a: 'a1' } }, state }
  );
  expect(fn()('x')).toEqual(['Some String', 'a1', 'x']);
});

test('ServerParser, _function applies routine loop array indices to state paths', () => {
  const fn = parseServer({ _function: { __state: 'arr.$.a' } }, { arrayIndices: [1], state });
  expect(fn()).toEqual('a2');
});

test('ServerParser, _function throws on parser errors', () => {
  const fn = parseServer({ _function: { __payload: [] } }, { payload });
  expect(fn).toThrow('_payload params must be of type string, integer, boolean or object.');
});

test('WebParser, _function that gets from state', () => {
  const fn = parseWeb({ _function: { __state: 'string' } });
  expect(fn).toBeInstanceOf(Function);
  expect(fn()).toEqual('Some String');
  expect(fn()).toEqual('Some String');
});

test('WebParser, _function gives args as an array', () => {
  const fn = parseWeb({ _function: { __args: true } });
  expect(fn('a')).toEqual(['a']);
  expect(fn('a', { b: true })).toEqual(['a', { b: true }]);
});

test('WebParser, _function applies list array indices to state paths', () => {
  const fn = parseWeb({ _function: { __state: 'arr.$.a' } }, { arrayIndices: [0] });
  expect(fn()).toEqual('a1');
});

test('WebParser, _function throws on parser errors', () => {
  const fn = parseWeb({ _function: { __state: [] } });
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
