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

import { ConfigError } from '@lowdefy/errors';

import WebParser from './webParser.js';

// The compiled path must return exactly what the walker (serializer.copy with a
// reviver) returns. toEqual cannot see array holes, undefined values, hidden
// markers or prototypes, so outputs are compared through canon().

const MARKERS = ['~k', '~r', '~l'];

function markersOf(value) {
  return MARKERS.map((marker) => {
    const descriptor = Object.getOwnPropertyDescriptor(value, marker);
    return descriptor ? [marker, descriptor.value, descriptor.enumerable] : null;
  }).filter(Boolean);
}

function canon(value) {
  if (value === undefined) return '<undefined>';
  if (Object.is(value, -0)) return '<-0>';
  if (Array.isArray(value)) {
    return {
      array: Array.from({ length: value.length }, (_, index) =>
        index in value ? canon(value[index]) : '<hole>'
      ),
      markers: markersOf(value),
    };
  }
  if (value instanceof Date) return { date: value.getTime() };
  if (value instanceof Error) return { error: value.constructor.name, message: value.message };
  if (value !== null && typeof value === 'object') {
    const prototype = Object.getPrototypeOf(value);
    return {
      prototype: prototype === Object.prototype ? 'Object' : String(prototype),
      keys: Object.keys(value).map((key) => [key, canon(value[key])]),
      markers: markersOf(value),
    };
  }
  return value;
}

function canonErrors(errors) {
  return errors.map((error) => ({
    class: error.constructor.name,
    message: error.message,
    configKey: error.configKey,
    location: error.location,
    received: canon(error.received),
  }));
}

function collectObjects(value, found = new Set()) {
  if (value !== null && typeof value === 'object') {
    found.add(value);
    Object.keys(value).forEach((key) => collectObjects(value[key], found));
  }
  return found;
}

function hide(target, marker, markerValue) {
  Object.defineProperty(target, marker, {
    value: markerValue,
    enumerable: false,
    writable: true,
    configurable: true,
  });
  return target;
}

let callLog = [];

function createOperators() {
  return {
    _value: ({ params }) => {
      callLog.push(['_value', canon(params)]);
      return params;
    },
    _undef: () => {
      callLog.push(['_undef']);
      return undefined;
    },
    _throw: ({ params }) => {
      throw new Error(String(params));
    },
    _configThrow: ({ params }) => {
      throw new ConfigError(String(params));
    },
    _obj: ({ params }) => ({ made: params }),
    _state: ({ params, state }) => state[params],
    _method: ({ methodName }) => ({
      methodName: methodName === undefined ? '<undef>' : methodName,
    }),
    _and: ({ params }) => params.reduce((result, item) => result && item, true),
    _if: ({ params }) => (params.test === true ? params.then : params.else),
    _dateMarker: ({ params }) => ({ '~d': params }),
    _location: ({ location, arrayIndices }) => ({ location, arrayIndices: [...arrayIndices] }),
  };
}

function createParser(operators) {
  const context = {
    id: 'ctx',
    state: { name: 'Ada', count: 3 },
    requests: {},
    eventLog: [],
    jsMap: {},
    websockets: {},
    _internal: {
      lowdefy: {
        apiResponses: {},
        basePath: '',
        home: {},
        i18n: {},
        inputs: { ctx: {} },
        lowdefyApp: {},
        lowdefyGlobal: {},
        menus: [],
        pageId: 'page',
        theme: {},
        user: {},
        _internal: { globals: {} },
      },
    },
  };
  return new WebParser({ context, operators });
}

function evaluate({ parser, input, threshold, parseOptions = {} }) {
  const saved = WebParser.compileThreshold;
  WebParser.compileThreshold = threshold;
  callLog = [];
  try {
    const { output, errors } = parser.parse({ input, location: 'block', ...parseOptions });
    return { output, errors, calls: callLog };
  } finally {
    WebParser.compileThreshold = saved;
  }
}

function expectParity(input, parseOptions) {
  const operators = createOperators();
  const walked = evaluate({
    parser: createParser(operators),
    input,
    threshold: Infinity,
    parseOptions,
  });
  const compiledParser = createParser(operators);
  const first = evaluate({ parser: compiledParser, input, threshold: 1, parseOptions });
  const second = evaluate({ parser: compiledParser, input, threshold: 1, parseOptions });
  expect(canon(first.output)).toEqual(canon(walked.output));
  expect(canonErrors(first.errors)).toEqual(canonErrors(walked.errors));
  expect(first.calls).toEqual(walked.calls);
  expect(canon(second.output)).toEqual(canon(walked.output));
  // Fresh trees: nothing shared between calls or with the input.
  const firstObjects = collectObjects(first.output);
  const inputObjects = collectObjects(input);
  [...collectObjects(second.output)].forEach((object) => {
    if (first.calls.length === 0 && walked.calls.length === 0) {
      expect(firstObjects.has(object)).toBe(false);
    }
    expect(inputObjects.has(object)).toBe(false);
  });
  return { walked, compiled: first };
}

test('an operator returning undefined is deleted from objects and leaves a hole in arrays', () => {
  expectParity({ a: { _undef: 1 }, b: 2, list: [{ _undef: 1 }, 'x', { _undef: 2 }] });
});

test('_and over an _if without else sees the hole, as the walker does', () => {
  const { walked } = expectParity({ _and: [{ _if: { test: false, then: 'x' } }, true] });
  expect(walked.output).toBe(true);
});

test('an object whose sibling operator returns undefined collapses into an operator', () => {
  const { walked } = expectParity({ a: { _undef: 1 }, _value: 'x' });
  expect(walked.output).toBe('x');
});

test('an operator added to the registry after compilation is called on the next parse', () => {
  const operators = createOperators();
  const input = { late: { _late: 1 } };
  const parser = createParser(operators);
  const before = evaluate({ parser, input, threshold: 1 });
  operators._late = () => 'called';
  const after = evaluate({ parser, input, threshold: 1 });
  expect(before.output).toEqual({ late: { _late: 1 } });
  expect(after.output).toEqual({ late: 'called' });
});

test('hidden markers, Dates, -0 and __proto__ keys come back as the walker returns them', () => {
  const nested = hide({ _state: 'name' }, '~k', 'k2');
  const list = hide([1, hide({ a: 1 }, '~k', 'k4')], '~k', 'k3');
  const input = hide({ nested, list, when: new Date(1700000000000), zero: -0 }, '~k', 'k1');
  Object.defineProperty(input, '__proto__', {
    value: { polluted: true },
    enumerable: true,
    writable: true,
    configurable: true,
  });
  expectParity(input);
});

test('methodName is undefined when absent, and set when present', () => {
  expectParity({ plain: { _method: 1 }, dotted: { '_method.round': 1 } });
});

test('errors carry the same class, message, configKey, location and received', () => {
  expectParity(
    {
      plain: hide({ _throw: 'boom' }, '~k', 'k1'),
      config: hide({ _configThrow: 'bad' }, '~k', 'k2'),
      nested: { _value: { _throw: 'inner' } },
    },
    { arrayIndices: [3], location: 'list.$.item' }
  );
});

test('arrayIndices are read at call time, so a compiled tree serves every list row', () => {
  const operators = createOperators();
  const parser = createParser(operators);
  const input = { at: { _location: 1 } };
  const arrayIndices = [0];
  const rowZero = evaluate({
    parser,
    input,
    threshold: 1,
    parseOptions: { arrayIndices, location: 'list.$' },
  });
  arrayIndices[0] = 5;
  const rowFive = evaluate({
    parser,
    input,
    threshold: 1,
    parseOptions: { arrayIndices, location: 'list.$' },
  });
  expect(rowZero.output.at).toEqual({ location: 'list.0', arrayIndices: [0] });
  expect(rowFive.output.at).toEqual({ location: 'list.5', arrayIndices: [5] });
});

test('an operator result carrying ~d is converted to a Date, as the serializer does', () => {
  expectParity({ when: { _dateMarker: 1700000000000 } });
});

test('values the JSON round trip changes stay on the walker', () => {
  expectParity({ keep: 1, gone: undefined, fn: () => 1, nan: NaN, list: [undefined, Infinity] });
  expectParity({ '~d': 5 });
  expectParity({ '~k': '' });
  expectParity({ custom: { toJSON: () => 'json' } });
});

test('primitive and Date roots', () => {
  ['text', '', 0, -0, 1.5, true, false, null, new Date(0)].forEach((input) => expectParity(input));
});

test('the __ prefix leaves _-prefixed keys as data and evaluates __ keys', () => {
  expectParity(
    { a: { _value: 1 }, b: { __value: 2 }, c: { ___value: 3 } },
    { operatorPrefix: '__' }
  );
});

// Seeded generator: random trees mixing data, known and unknown operators,
// operators that return undefined or throw, markers, Dates and arrays.
function createRandom(seed) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

const KEYS = ['a', 'b', 'c', '0', '1', 'long key', '__proto__', '_nope', '__value', '_method.x'];
const OPERATORS = [
  '_value',
  '_undef',
  '_throw',
  '_configThrow',
  '_obj',
  '_state',
  '_method',
  '_and',
  '_if',
];

function generate(random, depth) {
  const pick = (list) => list[Math.floor(random() * list.length)];
  const roll = random();
  if (depth <= 0 || roll < 0.25) {
    return pick(['x', '', 'ünïcødé', 0, -0, 7.25, true, false, null, new Date(1234567890000)]);
  }
  if (roll < 0.45) {
    const list = Array.from({ length: Math.floor(random() * 4) }, () =>
      generate(random, depth - 1)
    );
    return random() < 0.3 ? hide(list, '~k', `a${Math.floor(random() * 1000)}`) : list;
  }
  if (roll < 0.7) {
    const op = pick(OPERATORS);
    const node = { [op]: generate(random, depth - 1) };
    return random() < 0.5 ? hide(node, '~k', `o${Math.floor(random() * 1000)}`) : node;
  }
  const node = {};
  const count = Math.floor(random() * 4);
  for (let index = 0; index < count; index += 1) {
    const key = pick(KEYS);
    if (key === '__proto__') {
      Object.defineProperty(node, key, {
        value: generate(random, depth - 1),
        enumerable: true,
        writable: true,
        configurable: true,
      });
    } else {
      node[key] = generate(random, depth - 1);
    }
  }
  return random() < 0.5 ? hide(node, '~k', `n${Math.floor(random() * 1000)}`) : node;
}

test('2,000 random config trees evaluate identically through the walker and compiled', () => {
  const random = createRandom(20260924);
  for (let index = 0; index < 2000; index += 1) {
    const input = generate(random, 5);
    const arrayIndices = [Math.floor(random() * 5)];
    expectParity(input, { arrayIndices, location: 'block.$' });
  }
});
