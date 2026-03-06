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

import addStepResult from './addStepResult.js';

test('No arrayIndices, set string', () => {
  const context = { steps: {} };
  const routineContext = { arrayIndices: [] };
  addStepResult(context, routineContext, { result: 'Result', stepId: 'step_id' });
  expect(context.steps).toEqual({
    step_id: 'Result',
  });
});

test('No arrayIndices, set object', () => {
  const context = { steps: {} };
  const routineContext = { arrayIndices: [] };
  addStepResult(context, routineContext, { result: { value: 'Result' }, stepId: 'step_id' });
  expect(context.steps).toEqual({
    step_id: { value: 'Result' },
  });
});

test('No arrayIndices, set array', () => {
  const context = { steps: {} };
  const routineContext = { arrayIndices: [] };
  addStepResult(context, routineContext, { result: [1, 2, 3], stepId: 'step_id' });
  expect(context.steps).toEqual({
    step_id: [1, 2, 3],
  });
});

test('Do not overwrite other steps', () => {
  const context = { steps: { other: 'Other' } };
  const routineContext = { arrayIndices: [] };
  addStepResult(context, routineContext, { result: 'Result', stepId: 'step_id' });
  expect(context.steps).toEqual({
    other: 'Other',
    step_id: 'Result',
  });
});

test('arrayIndices, first item', () => {
  const context = { steps: {} };
  const routineContext = { arrayIndices: [0] };
  addStepResult(context, routineContext, { result: { i: 0 }, stepId: 'step_id' });
  expect(context.steps).toEqual({
    step_id: [{ i: 0 }],
  });
});

test('arrayIndices, second item', () => {
  const context = { steps: { step_id: [{ i: 0 }] } };
  const routineContext = { arrayIndices: [1] };
  addStepResult(context, routineContext, { result: { i: 1 }, stepId: 'step_id' });
  expect(context.steps).toEqual({
    step_id: [{ i: 0 }, { i: 1 }],
  });
});

test('Nested arrayIndices, i0 j0', () => {
  const context = { steps: {} };
  const routineContext = { arrayIndices: [0, 0] };
  addStepResult(context, routineContext, { result: { i: 0, j: 0 }, stepId: 'step_id' });
  expect(context.steps).toEqual({
    step_id: [[{ i: 0, j: 0 }]],
  });
});

test('Nested arrayIndices, i0 j1', () => {
  const context = { steps: { step_id: [[{ i: 0, j: 0 }]] } };
  const routineContext = { arrayIndices: [0, 1] };
  addStepResult(context, routineContext, { result: { i: 0, j: 1 }, stepId: 'step_id' });
  expect(context.steps).toEqual({
    step_id: [
      [
        { i: 0, j: 0 },
        { i: 0, j: 1 },
      ],
    ],
  });
});

test('Nested arrayIndices, i1 j0', () => {
  const context = {
    steps: {
      step_id: [
        [
          { i: 0, j: 0 },
          { i: 0, j: 1 },
        ],
      ],
    },
  };
  const routineContext = { arrayIndices: [1, 0] };
  addStepResult(context, routineContext, { result: { i: 1, j: 0 }, stepId: 'step_id' });
  expect(context.steps).toEqual({
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
  const context = { steps: {} };
  const routineContext = { arrayIndices: [2, 3] };
  addStepResult(context, routineContext, { result: 'Result', stepId: 'step_id' });
  expect(context.steps).toEqual({
    step_id: [undefined, undefined, [undefined, undefined, undefined, 'Result']],
  });
});

// TODO: How does undefined serialize?
// TODO: Test setting values on top of previous set undefined values
