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

import getFromObject from './getFromObject.js';
import getObjectReadKeys from './getObjectReadKeys.js';
import WebParser from './webParser.js';

// Pure calls are counted apart from the events: they only prove the parser recorded the call.
function createRecorder() {
  const events = [];
  const recorder = {
    events,
    pureCalls: 0,
    pure: () => {
      recorder.pureCalls += 1;
    },
    read: (key) => events.push(['read', key]),
    untracked: (reason) => events.push(['untracked', reason]),
    volatile: (reason) => events.push(['volatile', reason]),
  };
  return recorder;
}

// Stand-ins for the operators-js operators, with the same call shapes.
function _state({ arrayIndices, location, params, state }) {
  return getFromObject({ arrayIndices, location, object: state, operator: '_state', params });
}
_state.tracking = {
  kind: 'read',
  keys: ({ arrayIndices, params }) =>
    getObjectReadKeys({ arrayIndices, namespace: 'state', params }),
};

function _sum({ params }) {
  return params.reduce((acc, value) => acc + value, 0);
}
_sum.tracking = { kind: 'pure' };

function _random() {
  return Math.random();
}
_random.tracking = { kind: 'volatile' };

function _plugin() {
  return 'plugin';
}

function _function({ operatorPrefix, params, parser }) {
  return (...args) =>
    parser.parse({ args, input: params, operatorPrefix: `_${operatorPrefix}` }).output;
}
_function.tracking = { kind: 'untracked' };

// As operators-js _js: accessors call the operators the parser passed in.
function _js(operatorContext) {
  const { jsMap, operators, params } = operatorContext;
  return jsMap[params]({
    state: (p) => operators._state({ ...operatorContext, params: p }),
  });
}
_js.tracking = ({ jsMap, params }) => ({
  kind: jsMap[params]?.volatile === true ? 'volatile' : 'pure',
  resultMayContainFunctions: true,
});

function _operator(options) {
  const { operators, params } = options;
  return operators[params.name]({ ...options, params: params.params });
}
_operator.tracking = { kind: 'pure' };

function _throws() {
  throw new Error('Boom.');
}
_throws.tracking = { kind: 'read', keys: () => ['state:thrown'] };

const jsMap = {
  sumAB: ({ state }) => state('a') + state('b'),
  rowName: ({ state }) => state('list.$.name'),
  columns: ({ state }) => [{ field: 'a', valueFormatter: () => state('a') }],
  now: () => Date.now(),
};
jsMap.now.volatile = true;

function createContext() {
  return {
    _internal: {
      lowdefy: {
        apiResponses: {},
        basePath: '',
        home: {},
        inputs: {},
        lowdefyApp: {},
        lowdefyGlobal: {},
        menus: [],
        user: {},
        _internal: { globals: {} },
      },
      readRecorder: null,
    },
    eventLog: [],
    id: 'page',
    jsMap,
    requests: {},
    state: { a: 1, b: 2, list: [{ name: 'zero' }, { name: 'one' }] },
  };
}

function createParser() {
  const context = createContext();
  const operators = {
    _function,
    _js,
    _operator,
    _plugin,
    _random,
    _state,
    _sum,
    _throws,
  };
  const parser = new WebParser({ context, operators });
  return { context, operators, parser };
}

// Parses the same input object twice: the first parse walks, the second runs the compiled tree.
// Both must record the same calls. Outputs are compared by each test, since some are random.
function parseWalkerAndCompiled({ context, parser, ...options }) {
  const results = [1, 2].map(() => {
    const recorder = createRecorder();
    context._internal.readRecorder = recorder;
    const { output, errors } = parser.parse(options);
    context._internal.readRecorder = null;
    return { errors, events: recorder.events, output, pureCalls: recorder.pureCalls };
  });
  expect(parser.compiled.get('_').get(options.input).tree).toBeDefined();
  expect(results[1].events).toEqual(results[0].events);
  expect(results[1].pureCalls).toEqual(results[0].pureCalls);
  return results[0];
}

test('reads are recorded with array indices applied, on the walker and compiled paths', () => {
  const { context, parser } = createParser();
  const { events, output } = parseWalkerAndCompiled({
    arrayIndices: [1],
    context,
    input: { title: { _state: 'list.$.name' }, total: { _sum: [{ _state: 'a' }, 5] } },
    location: 'list.$.title',
    parser,
  });
  expect(output).toEqual({ title: 'one', total: 6 });
  expect(events).toEqual([
    ['read', 'state:list.1.name'],
    ['read', 'state:a'],
  ]);
});

test('pure operator calls signal the recorder without recording a read', () => {
  const { context, parser } = createParser();
  const { events, output, pureCalls } = parseWalkerAndCompiled({
    context,
    input: { total: { _sum: [1, { _sum: [2, 3] }] }, title: 'literal' },
    location: 'block',
    parser,
  });
  expect(output).toEqual({ total: 6, title: 'literal' });
  expect(events).toEqual([]);
  expect(pureCalls).toBe(2);
});

test('a read of no keys signals the recorder as pure', () => {
  const { context, parser } = createParser();
  const { events, pureCalls } = parseWalkerAndCompiled({
    context,
    input: { value: { _state: { key: null, default: 1 } } },
    location: 'block',
    parser,
  });
  expect(events).toEqual([]);
  expect(pureCalls).toBe(1);
});

test('volatile and undeclared operators are reported to the recorder', () => {
  const { context, parser } = createParser();
  const { events } = parseWalkerAndCompiled({
    context,
    input: { a: { _random: true }, b: { _plugin: true } },
    location: 'block',
    parser,
  });
  expect(events).toEqual([
    ['volatile', '_random'],
    ['untracked', '_plugin has no tracking declaration'],
  ]);
});

test('an operator returning a function marks the recorder untracked', () => {
  const { context, parser } = createParser();
  const { events, output } = parseWalkerAndCompiled({
    context,
    input: { formatter: { _function: { __state: 'a' } } },
    location: 'block',
    parser,
  });
  expect(output.formatter()).toBe(1);
  expect(events).toEqual([
    ['untracked', '_function'],
    ['untracked', '_function returned a function'],
  ]);
});

test('_js accessor reads are recorded through the tracked registry view', () => {
  const { context, parser } = createParser();
  const { events, output } = parseWalkerAndCompiled({
    arrayIndices: [0],
    context,
    input: { sum: { _js: 'sumAB' }, name: { _js: 'rowName' } },
    location: 'list.$.block',
    parser,
  });
  expect(output).toEqual({ sum: 3, name: 'zero' });
  expect(events).toEqual([
    ['read', 'state:a'],
    ['read', 'state:b'],
    ['read', 'state:list.0.name'],
  ]);
});

test('a volatile _js function and a _js result holding a function are reported', () => {
  const { context, parser } = createParser();
  const { events } = parseWalkerAndCompiled({
    context,
    input: { now: { _js: 'now' }, columns: { _js: 'columns' } },
    location: 'block',
    parser,
  });
  expect(events).toEqual([
    ['volatile', '_js'],
    ['untracked', '_js returned a function'],
  ]);
});

test('an operator dispatched by _operator is recorded', () => {
  const { context, parser } = createParser();
  const { events, output } = parseWalkerAndCompiled({
    context,
    input: { _operator: { name: '_state', params: 'b' } },
    location: 'block',
    parser,
  });
  expect(output).toEqual(2);
  expect(events).toEqual([['read', 'state:b']]);
});

test('an operator that throws still records its reads', () => {
  const { context, parser } = createParser();
  const { errors, events } = parseWalkerAndCompiled({
    context,
    input: { a: { _throws: true } },
    location: 'block',
    parser,
  });
  expect(errors).toHaveLength(1);
  expect(errors[0].message).toContain('Boom.');
  expect(events).toEqual([['read', 'state:thrown']]);
});

test('an operator added to the registry after the parser was created is recorded', () => {
  const { context, operators, parser } = createParser();
  const _late = () => 'late';
  _late.tracking = { kind: 'read', keys: () => ['global:late'] };
  operators._late = _late;
  const { events, output } = parseWalkerAndCompiled({
    context,
    input: { a: { _late: true } },
    location: 'block',
    parser,
  });
  expect(output).toEqual({ a: 'late' });
  expect(events).toEqual([['read', 'global:late']]);
});

test('with no recorder, operators get the raw registry and nothing is recorded', () => {
  const { context, operators, parser } = createParser();
  let received;
  operators._capture = ({ operators: registry }) => {
    received = registry;
    return true;
  };
  context._internal.readRecorder = null;
  expect(parser.parse({ input: { _capture: true }, location: 'block' }).output).toBe(true);
  expect(received).toBe(operators);
});

test('a _function body records into the recorder active when it is called, not when it was created', () => {
  const { context, parser } = createParser();
  const first = createRecorder();
  context._internal.readRecorder = first;
  const { output: getA } = parser.parse({
    input: { _function: { __state: 'a' } },
    location: 'block',
  });
  context._internal.readRecorder = null;
  expect(getA()).toBe(1);
  expect(first.events).toEqual([
    ['untracked', '_function'],
    ['untracked', '_function returned a function'],
  ]);
  const second = createRecorder();
  context._internal.readRecorder = second;
  expect(getA()).toBe(1);
  context._internal.readRecorder = null;
  expect(second.events).toEqual([['read', 'state:a']]);
});

test('_js accessor closures read the recorder when called, not when created', () => {
  const { context, parser } = createParser();
  const recorder = createRecorder();
  context._internal.readRecorder = recorder;
  const { output } = parser.parse({ input: { _js: 'columns' }, location: 'block' });
  context._internal.readRecorder = null;
  const eventsBefore = recorder.events.length;
  expect(output[0].valueFormatter()).toBe(1);
  expect(recorder.events.length).toBe(eventsBefore);
});
