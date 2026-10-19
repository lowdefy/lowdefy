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

import classifyOperatorCall from './classifyOperatorCall.js';
import createOperatorCallClassifier from './createOperatorCallClassifier.js';

function operator(tracking) {
  const fn = () => null;
  if (tracking !== undefined) fn.tracking = tracking;
  return fn;
}

const operatorContext = {
  arrayIndices: [1],
  jsMap: { hash: () => 1 },
  location: 'block.1.field',
  methodName: undefined,
  params: 'a.$',
  state: { a: 1 },
};

function callInfoOf({ arrayIndices, jsMap, location, methodName, params }) {
  return { arrayIndices, jsMap, location, methodName, params };
}

test('createOperatorCallClassifier returns the same classification as classifyOperatorCall', () => {
  const declarations = [
    undefined,
    { kind: 'pure' },
    { kind: 'volatile' },
    { kind: 'untracked' },
    { kind: 'pure', resultMayContainFunctions: true },
    { kind: 'read', keys: ['menu'] },
    { kind: 'read', keys: ({ params }) => [`state:${params}`] },
    { kind: 'read', keys: () => 'state:a' },
    { kind: 'sometimes' },
    'pure',
    ({ params }) => ({ kind: 'read', keys: [`global:${params}`] }),
    { methods: { random: { kind: 'volatile' } }, default: { kind: 'pure' } },
    { methods: { random: { kind: 'volatile' } } },
    { methods: { sample: () => ({ kind: 'untracked' }) }, default: { kind: 'pure' } },
  ];
  declarations.forEach((declaration) => {
    const operatorFn = operator(declaration);
    const classify = createOperatorCallClassifier({ operatorFn, operatorName: '_op' });
    [undefined, 'random', 'sample', 'constructor'].forEach((methodName) => {
      const context = { ...operatorContext, methodName };
      expect(classify(context)).toEqual(
        classifyOperatorCall({ callInfo: callInfoOf(context), operatorFn, operatorName: '_op' })
      );
    });
  });
});

test('createOperatorCallClassifier resolves a static declaration once per method name', () => {
  const operatorFn = operator({
    methods: { random: { kind: 'volatile' } },
    default: { kind: 'pure' },
  });
  const classify = createOperatorCallClassifier({ operatorFn, operatorName: '_math' });
  const random = classify({ ...operatorContext, methodName: 'random' });
  expect(random).toMatchObject({ kind: 'volatile', reason: '_math.random' });
  expect(classify({ ...operatorContext, methodName: 'random' })).toBe(random);
  expect(classify({ ...operatorContext, methodName: 'abs' })).toMatchObject({
    kind: 'pure',
    reason: '_math.abs',
  });
});

test('createOperatorCallClassifier calls a function declaration on every call with the call info', () => {
  const tracking = jest.fn(({ params }) => ({ kind: 'read', keys: [`state:${params}`] }));
  const classify = createOperatorCallClassifier({
    operatorFn: operator(tracking),
    operatorName: '_state',
  });
  expect(classify(operatorContext)).toMatchObject({ kind: 'read', keys: ['state:a.$'] });
  expect(classify({ ...operatorContext, params: 'b' })).toMatchObject({ keys: ['state:b'] });
  expect(tracking).toHaveBeenCalledTimes(2);
  expect(tracking).toHaveBeenNthCalledWith(1, callInfoOf(operatorContext));
});

test('createOperatorCallClassifier calls a read keys function on every call with the call info', () => {
  const keys = jest.fn(({ params }) => [`state:${params}`]);
  const classify = createOperatorCallClassifier({
    operatorFn: operator({ kind: 'read', keys }),
    operatorName: '_state',
  });
  expect(classify(operatorContext)).toEqual({
    kind: 'read',
    keys: ['state:a.$'],
    reason: '_state',
    resultMayContainFunctions: false,
  });
  expect(classify({ ...operatorContext, params: 'b' })).toMatchObject({ keys: ['state:b'] });
  expect(keys).toHaveBeenCalledTimes(2);
  expect(keys).toHaveBeenNthCalledWith(1, callInfoOf(operatorContext));
});

test('createOperatorCallClassifier marks a throwing read keys function untracked', () => {
  const classify = createOperatorCallClassifier({
    operatorFn: operator({
      kind: 'read',
      keys: () => {
        throw new Error('Keys boom.');
      },
    }),
    operatorName: '_a',
  });
  expect(classify(operatorContext)).toEqual({
    kind: 'untracked',
    keys: [],
    reason: '_a tracking keys threw: Keys boom.',
  });
});
