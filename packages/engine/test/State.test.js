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

import State from '../src/State.js';

test('set', () => {
  const context = {
    state: {},
  };
  const state = new State(context);
  state.set('a', 1);
  expect(context.state).toEqual({ a: 1 });
});

test('resetState', () => {
  const context = {
    state: {},
  };
  const state = new State(context);
  state.freezeState();
  expect(context.state).toEqual({});
  state.set('a', 1);
  expect(context.state).toEqual({ a: 1 });
  state.resetState();
  expect(context.state).toEqual({});
});

test('freezeState to only set when initialized is false and resetState restores frozenState', () => {
  const context = {
    state: {},
  };
  const state = new State(context);
  state.set('a', 1);
  expect(state.initialized).toEqual(false);
  state.freezeState();
  expect(context.state).toEqual({ a: 1 });
  expect(state.initialized).toEqual(true);
  state.set('a', 3);
  state.set('b', 1);
  state.freezeState();
  expect(context.state).toEqual({ a: 3, b: 1 });
  state.resetState();
  expect(context.state).toEqual({ a: 1 });
  expect(state.initialized).toEqual(true);
});

test('set on array', () => {
  const context = {
    state: {},
  };
  const state = new State(context);
  context.state = { a: [1, 2] };
  state.set('a.2', 3);
  expect(context.state).toEqual({ a: [1, 2, 3] });
});

test('set on array with nested arrays', () => {
  const context = {
    state: {},
  };
  const state = new State(context);
  context.state = { a: [1, 2] };
  state.set('a.2.2.a.2.c', 3);
  expect(context.state).toEqual({
    a: [1, 2, [undefined, undefined, { a: [undefined, undefined, { c: 3 }] }]],
  });
});

test('del', () => {
  const context = {
    state: {},
  };
  const state = new State(context);
  context.state = { a: 1 };
  state.del('a');
  expect(context.state).toEqual({});
});

test('del remove empty object', () => {
  const context = {
    state: { a: { b: 1 } },
  };
  const state = new State(context);
  context.state = { a: { b: 1 } };
  state.del('a.b');
  expect(context.state).toEqual({});
});

test('del remove nested empty object', () => {
  const context = {
    state: { a: { b: { c: { d: { e: 1 } } } } },
  };
  const state = new State(context);
  context.state = { a: { b: { c: { d: { e: 1 } } } } };
  state.del('a.b.c.d');
  expect(context.state).toEqual({});
});

test('del keep nested objects', () => {
  const context = {
    state: { a: { b: 1, c: 2 } },
  };
  const state = new State(context);
  context.state = { a: { b: 1, c: 2 } };
  state.del('a.b');
  expect(context.state).toEqual({ a: { c: 2 } });
});

test('swapItems', () => {
  const context = {
    state: {},
  };
  const state = new State(context);
  context.state = { arr: [0, 1, 2, 3, 4, 5] };
  state.swapItems('arr', 3, 4);
  expect(context.state).toEqual({ arr: [0, 1, 2, 4, 3, 5] });
});

test('removeItem', () => {
  const context = {
    state: {},
  };
  const state = new State(context);
  context.state = { arr: [0, 1, 2, 3, 4, 5] };
  state.removeItem('arr', 3);
  expect(context.state).toEqual({ arr: [0, 1, 2, 4, 5] });
});

test('not an array', () => {
  const context = {
    state: {},
  };
  const state = new State(context);
  context.state = { arr: 'x' };
  state.removeItem('arr', 3);
  expect(context.state).toEqual({ arr: 'x' });
  state.swapItems('arr', 3, 4);
  expect(context.state).toEqual({ arr: 'x' });
});

test('out of array bounds', () => {
  const context = {
    state: {},
  };
  const state = new State(context);
  context.state = { arr: [0, 1, 2, 3, 4, 5] };
  state.removeItem('arr', 6);
  expect(context.state).toEqual({ arr: [0, 1, 2, 3, 4, 5] });
  state.removeItem('arr', -1);
  expect(context.state).toEqual({ arr: [0, 1, 2, 3, 4, 5] });
  state.swapItems('arr', 6, 5);
  expect(context.state).toEqual({ arr: [0, 1, 2, 3, 4, 5] });
  state.swapItems('arr', -1, 0);
  expect(context.state).toEqual({ arr: [0, 1, 2, 3, 4, 5] });
});

test('combinations', () => {
  const context = {
    state: {},
  };
  const state = new State(context);
  context.state = { arr: [0, 1, 2, 3, 4, 5], b: 'b' };
  state.removeItem('arr', 3);
  expect(context.state).toEqual({ arr: [0, 1, 2, 4, 5], b: 'b' });
  state.set('b', 'c');
  expect(context.state).toEqual({ arr: [0, 1, 2, 4, 5], b: 'c' });
  state.swapItems('arr', 2, 3);
  expect(context.state).toEqual({ arr: [0, 1, 4, 2, 5], b: 'c' });
  state.del('b');
  expect(context.state).toEqual({ arr: [0, 1, 4, 2, 5] });
  state.set('a', 'v');
  expect(context.state).toEqual({ arr: [0, 1, 4, 2, 5], a: 'v' });
});
