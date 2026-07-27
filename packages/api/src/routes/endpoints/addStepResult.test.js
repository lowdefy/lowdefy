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
import { ReservedKeyError } from '@lowdefy/helpers';

import addStepResult from './addStepResult.js';

test('No arrayIndices, set string', () => {
  const context = {};
  const routineContext = { steps: {}, arrayIndices: [] };
  addStepResult(context, routineContext, { result: 'Result', stepId: 'step_id' });
  expect(routineContext.steps).toEqual({
    step_id: 'Result',
  });
});

test('No arrayIndices, set object', () => {
  const context = {};
  const routineContext = { steps: {}, arrayIndices: [] };
  addStepResult(context, routineContext, { result: { value: 'Result' }, stepId: 'step_id' });
  expect(routineContext.steps).toEqual({
    step_id: { value: 'Result' },
  });
});

test('No arrayIndices, set array', () => {
  const context = {};
  const routineContext = { steps: {}, arrayIndices: [] };
  addStepResult(context, routineContext, { result: [1, 2, 3], stepId: 'step_id' });
  expect(routineContext.steps).toEqual({
    step_id: [1, 2, 3],
  });
});

test('Do not overwrite other steps', () => {
  const context = {};
  const routineContext = { steps: { other: 'Other' }, arrayIndices: [] };
  addStepResult(context, routineContext, { result: 'Result', stepId: 'step_id' });
  expect(routineContext.steps).toEqual({
    other: 'Other',
    step_id: 'Result',
  });
});

test('arrayIndices, first item', () => {
  const context = {};
  const routineContext = { steps: {}, arrayIndices: [0] };
  addStepResult(context, routineContext, { result: { i: 0 }, stepId: 'step_id' });
  expect(routineContext.steps).toEqual({
    step_id: [{ i: 0 }],
  });
});

test('arrayIndices, second item', () => {
  const context = {};
  const routineContext = { steps: { step_id: [{ i: 0 }] }, arrayIndices: [1] };
  addStepResult(context, routineContext, { result: { i: 1 }, stepId: 'step_id' });
  expect(routineContext.steps).toEqual({
    step_id: [{ i: 0 }, { i: 1 }],
  });
});

test('Nested arrayIndices, i0 j0', () => {
  const context = {};
  const routineContext = { steps: {}, arrayIndices: [0, 0] };
  addStepResult(context, routineContext, { result: { i: 0, j: 0 }, stepId: 'step_id' });
  expect(routineContext.steps).toEqual({
    step_id: [[{ i: 0, j: 0 }]],
  });
});

test('Nested arrayIndices, i0 j1', () => {
  const context = {};
  const routineContext = { steps: { step_id: [[{ i: 0, j: 0 }]] }, arrayIndices: [0, 1] };
  addStepResult(context, routineContext, { result: { i: 0, j: 1 }, stepId: 'step_id' });
  expect(routineContext.steps).toEqual({
    step_id: [
      [
        { i: 0, j: 0 },
        { i: 0, j: 1 },
      ],
    ],
  });
});

test('Nested arrayIndices, i1 j0', () => {
  const context = {};
  const routineContext = {
    steps: {
      step_id: [
        [
          { i: 0, j: 0 },
          { i: 0, j: 1 },
        ],
      ],
    },
    arrayIndices: [1, 0],
  };
  addStepResult(context, routineContext, { result: { i: 1, j: 0 }, stepId: 'step_id' });
  expect(routineContext.steps).toEqual({
    step_id: [
      [
        { i: 0, j: 0 },
        { i: 0, j: 1 },
      ],
      [{ i: 1, j: 0 }],
    ],
  });
});

test('Nested arrayIndices, undefined values for missing indices', () => {
  const context = {};
  const routineContext = { steps: {}, arrayIndices: [2, 3] };
  addStepResult(context, routineContext, { result: 'Result', stepId: 'step_id' });
  expect(routineContext.steps).toEqual({
    step_id: [undefined, undefined, [undefined, undefined, undefined, 'Result']],
  });
});

test('Reserved stepId throws a ConfigError, not a ReservedKeyError', () => {
  const context = {};
  const routineContext = { steps: {}, arrayIndices: [] };
  expect(() =>
    addStepResult(context, routineContext, { result: 'Result', stepId: '__proto__' })
  ).toThrow(ConfigError);
});

test('Reserved stepId ConfigError message names the reserved segment', () => {
  const context = {};
  const routineContext = { steps: {}, arrayIndices: [] };
  expect(() =>
    addStepResult(context, routineContext, { result: 'Result', stepId: '__proto__' })
  ).toThrow('Reserved step id "__proto__" cannot be used');
});

test('Reserved stepId ConfigError wraps the ReservedKeyError as its cause', () => {
  const context = {};
  const routineContext = { steps: {}, arrayIndices: [] };
  expect.assertions(4);
  try {
    addStepResult(context, routineContext, { result: 'Result', stepId: 'constructor' });
  } catch (error) {
    expect(error.name).toEqual('ConfigError');
    expect(error.cause).toBeInstanceOf(ReservedKeyError);
    expect(error.cause.segment).toEqual('constructor');
    // routineContext exposes no YAML location, so no configKey is available here.
    expect(error.configKey).toEqual(null);
  }
});

test('Reserved stepId leaves steps unmodified', () => {
  const context = {};
  const routineContext = { steps: { other: 'Other' }, arrayIndices: [] };
  expect(() =>
    addStepResult(context, routineContext, { result: 'Result', stepId: '__proto__' })
  ).toThrow(ConfigError);
  expect(routineContext.steps).toEqual({ other: 'Other' });
  expect({}.polluted).toBeUndefined();
});

test('Rethrows non ReservedKeyError errors unchanged', () => {
  const context = {};
  // Frozen steps make `set` throw a TypeError, which must not be wrapped as a ConfigError.
  const routineContext = { steps: Object.freeze({}), arrayIndices: [] };
  expect(() =>
    addStepResult(context, routineContext, { result: 'Result', stepId: 'step_id' })
  ).toThrow(TypeError);
  expect(() =>
    addStepResult(context, routineContext, { result: 'Result', stepId: 'step_id' })
  ).not.toThrow(ConfigError);
});

// TODO: How does undefined serialize?
// TODO: Test setting values on top of previous set undefined values
