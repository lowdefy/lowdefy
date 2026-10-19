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

import { jest } from '@jest/globals';
import { ConfigError } from '@lowdefy/errors';
import { ReservedKeyError } from '@lowdefy/helpers';

import controlSetState from './controlSetState.js';
import runTest from '../test/runTest.js';

function createDirectCallArgs({ setState }) {
  const context = {
    logger: { debug: jest.fn() },
    evaluateOperators: ({ input }) => input,
  };
  const routineContext = {
    items: {},
    payload: {},
    state: {},
    steps: {},
  };
  const control = { ':set_state': setState, '~k': 'control_key' };
  return { context, routineContext, control };
}

test('set_state sets simple value', async () => {
  const routine = [
    {
      ':set_state': {
        key: 'value',
      },
    },
    {
      ':return': { _state: 'key' },
    },
  ];
  const { res, context } = await runTest({ routine });
  expect(res.status).toEqual('return');
  expect(res.response).toEqual('value');
  expect(context.logger.debug.mock.calls).toContainEqual([
    {
      event: 'debug_control_set_state',
      input: { key: 'value' },
      evaluated: { key: 'value' },
    },
  ]);
});

test('set_state sets multiple values', async () => {
  const routine = [
    {
      ':set_state': {
        key1: 'value1',
        key2: 'value2',
      },
    },
    {
      ':return': { key1: { _state: 'key1' }, key2: { _state: 'key2' } },
    },
  ];
  const { res } = await runTest({ routine });
  expect(res.status).toEqual('return');
  expect(res.response).toEqual({ key1: 'value1', key2: 'value2' });
});

test('set_state sets nested path', async () => {
  const routine = [
    {
      ':set_state': {
        'user.name': 'John',
        'user.age': 30,
      },
    },
    {
      ':return': { _state: 'user' },
    },
  ];
  const { res } = await runTest({ routine });
  expect(res.status).toEqual('return');
  expect(res.response).toEqual({ name: 'John', age: 30 });
});

test('set_state evaluates operators in value', async () => {
  const routine = [
    {
      ':set_state': {
        computed: { _sum: [1, 2, 3] },
      },
    },
    {
      ':return': { _state: 'computed' },
    },
  ];
  const { res } = await runTest({ routine });
  expect(res.status).toEqual('return');
  expect(res.response).toEqual(6);
});

test('set_state with empty object', async () => {
  const routine = [
    {
      ':set_state': {},
    },
  ];
  const { res, context } = await runTest({ routine });
  expect(res.status).toEqual('continue');
  expect(context.logger.debug.mock.calls).toContainEqual([
    {
      event: 'debug_control_set_state',
      input: {},
      evaluated: {},
    },
  ]);
});

test('set_state overwrites existing value', async () => {
  const routine = [
    {
      ':set_state': {
        key: 'first',
      },
    },
    {
      ':set_state': {
        key: 'second',
      },
    },
    {
      ':return': { _state: 'key' },
    },
  ];
  const { res } = await runTest({ routine });
  expect(res.status).toEqual('return');
  expect(res.response).toEqual('second');
});

test('set_state with array value', async () => {
  const routine = [
    {
      ':set_state': {
        items: [1, 2, 3],
      },
    },
    {
      ':return': { _state: 'items' },
    },
  ];
  const { res } = await runTest({ routine });
  expect(res.status).toEqual('return');
  expect(res.response).toEqual([1, 2, 3]);
});

test('set_state with object value', async () => {
  const routine = [
    {
      ':set_state': {
        config: { enabled: true, count: 5 },
      },
    },
    {
      ':return': { _state: 'config' },
    },
  ];
  const { res } = await runTest({ routine });
  expect(res.status).toEqual('return');
  expect(res.response).toEqual({ enabled: true, count: 5 });
});

test('set_state with null value', async () => {
  const routine = [
    {
      ':set_state': {
        nullable: null,
      },
    },
    {
      ':return': { _state: 'nullable' },
    },
  ];
  const { res } = await runTest({ routine });
  expect(res.status).toEqual('return');
  expect(res.response).toEqual(null);
});

test('set_state returns continue status', async () => {
  const routine = {
    ':set_state': {
      key: 'value',
    },
  };
  const { res } = await runTest({ routine });
  expect(res.status).toEqual('continue');
});

test('set_state writes to routineContext.state, not context.state', async () => {
  const routine = {
    ':set_state': {
      key: 'value',
    },
  };
  const { context, routineContext } = await runTest({ routine });
  expect(routineContext.state).toEqual({ key: 'value' });
  expect(context.state).toBeUndefined();
});

test('set_state writes do not leak across separate routineContexts', async () => {
  const routine = {
    ':set_state': {
      key: 'first',
    },
  };
  const { context, routineContext } = await runTest({ routine });
  expect(routineContext.state).toEqual({ key: 'first' });

  // Simulate a sibling routine frame — separate routineContext, same context.
  const { res, routineContext: siblingRoutineContext } = await runTest({
    routine: [{ ':return': { _state: 'key' } }],
  });
  // The sibling routine starts with empty state; `_state.key` is null/undefined.
  expect(res.response == null).toBe(true);
  expect(siblingRoutineContext.state).toEqual({});
  expect(context.state).toBeUndefined();
});

test('set_state throws a ConfigError, not a ReservedKeyError, for a reserved key path', () => {
  const { context, routineContext, control } = createDirectCallArgs({
    setState: { '__proto__.a': 1 },
  });
  expect(() => controlSetState(context, routineContext, { control })).toThrow(ConfigError);
});

test('set_state ConfigError message names the reserved segment and :set_state', () => {
  const { context, routineContext, control } = createDirectCallArgs({
    setState: { '__proto__.a': 1 },
  });
  expect(() => controlSetState(context, routineContext, { control })).toThrow(
    'Reserved key "__proto__" cannot be used in :set_state'
  );
});

test('set_state ConfigError carries the control configKey and the ReservedKeyError cause', () => {
  const { context, routineContext, control } = createDirectCallArgs({
    setState: { 'user.constructor.evil': true },
  });
  expect.assertions(4);
  try {
    controlSetState(context, routineContext, { control });
  } catch (error) {
    expect(error.name).toEqual('ConfigError');
    expect(error.configKey).toEqual('control_key');
    expect(error.cause).toBeInstanceOf(ReservedKeyError);
    expect(error.cause.segment).toEqual('constructor');
  }
});

test('set_state leaves state unmodified when a reserved key throws', () => {
  const { context, routineContext, control } = createDirectCallArgs({
    setState: { '__proto__.a': 1 },
  });
  expect(() => controlSetState(context, routineContext, { control })).toThrow(ConfigError);
  expect(routineContext.state).toEqual({});
  expect({}.a).toBeUndefined();
});

test('set_state rethrows non ReservedKeyError errors unchanged', () => {
  const { context, routineContext, control } = createDirectCallArgs({ setState: { key: 'value' } });
  // A frozen state makes `set` throw a TypeError, which must not be wrapped as a ConfigError.
  routineContext.state = Object.freeze({});
  expect(() => controlSetState(context, routineContext, { control })).toThrow(TypeError);
  expect(() => controlSetState(context, routineContext, { control })).not.toThrow(ConfigError);
});

test('set_state sets values without a reserved key via a direct call', () => {
  const { context, routineContext, control } = createDirectCallArgs({
    setState: { 'user.name': 'John' },
  });
  const res = controlSetState(context, routineContext, { control });
  expect(res).toEqual({ status: 'continue' });
  expect(routineContext.state).toEqual({ user: { name: 'John' } });
});
