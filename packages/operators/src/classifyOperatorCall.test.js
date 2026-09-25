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

function operator(tracking) {
  const fn = () => null;
  if (tracking !== undefined) fn.tracking = tracking;
  return fn;
}

const callInfo = {
  arrayIndices: [1],
  jsMap: {},
  location: 'block.1.field',
  methodName: undefined,
  params: 'a.$',
};

test('classifyOperatorCall marks an undeclared operator untracked', () => {
  expect(
    classifyOperatorCall({ callInfo, operatorFn: operator(), operatorName: '_plugin' })
  ).toEqual({
    kind: 'untracked',
    keys: [],
    reason: '_plugin has no tracking declaration',
  });
});

test('classifyOperatorCall returns pure and volatile object declarations', () => {
  expect(
    classifyOperatorCall({ callInfo, operatorFn: operator({ kind: 'pure' }), operatorName: '_a' })
  ).toMatchObject({ kind: 'pure', keys: [] });
  expect(
    classifyOperatorCall({
      callInfo,
      operatorFn: operator({ kind: 'volatile' }),
      operatorName: '_a',
    })
  ).toMatchObject({ kind: 'volatile', keys: [], reason: '_a' });
});

test('classifyOperatorCall calls a read declaration keys function with the call info', () => {
  const keys = jest.fn(({ params, arrayIndices }) => [`state:${params}:${arrayIndices[0]}`]);
  const result = classifyOperatorCall({
    callInfo,
    operatorFn: operator({ kind: 'read', keys }),
    operatorName: '_state',
  });
  expect(result).toMatchObject({ kind: 'read', keys: ['state:a.$:1'] });
  expect(keys).toHaveBeenCalledWith(callInfo);
});

test('classifyOperatorCall resolves a function declaration', () => {
  const tracking = ({ params }) => ({ kind: 'read', keys: [`global:${params}`] });
  expect(
    classifyOperatorCall({ callInfo, operatorFn: operator(tracking), operatorName: '_global' })
  ).toMatchObject({ kind: 'read', keys: ['global:a.$'] });
});

test('classifyOperatorCall picks the method declaration, falling back to default', () => {
  const operatorFn = operator({
    methods: { random: { kind: 'volatile' }, sample: () => ({ kind: 'untracked' }) },
    default: { kind: 'pure' },
  });
  expect(
    classifyOperatorCall({
      callInfo: { ...callInfo, methodName: 'random' },
      operatorFn,
      operatorName: '_math',
    })
  ).toMatchObject({ kind: 'volatile', reason: '_math.random' });
  expect(
    classifyOperatorCall({
      callInfo: { ...callInfo, methodName: 'sample' },
      operatorFn,
      operatorName: '_math',
    })
  ).toMatchObject({ kind: 'untracked' });
  expect(
    classifyOperatorCall({
      callInfo: { ...callInfo, methodName: 'abs' },
      operatorFn,
      operatorName: '_math',
    })
  ).toMatchObject({ kind: 'pure' });
  expect(
    classifyOperatorCall({
      callInfo: { ...callInfo, methodName: 'constructor' },
      operatorFn,
      operatorName: '_math',
    })
  ).toMatchObject({ kind: 'pure' });
});

test('classifyOperatorCall marks a method-level declaration with no match and no default untracked', () => {
  const operatorFn = operator({ methods: { random: { kind: 'volatile' } } });
  expect(
    classifyOperatorCall({
      callInfo: { ...callInfo, methodName: 'abs' },
      operatorFn,
      operatorName: '_math',
    })
  ).toMatchObject({ kind: 'untracked', reason: '_math.abs has an invalid tracking declaration' });
});

test('classifyOperatorCall marks invalid declarations and keys untracked', () => {
  expect(
    classifyOperatorCall({
      callInfo,
      operatorFn: operator({ kind: 'sometimes' }),
      operatorName: '_a',
    })
  ).toMatchObject({ kind: 'untracked' });
  expect(
    classifyOperatorCall({ callInfo, operatorFn: operator('pure'), operatorName: '_a' })
  ).toMatchObject({ kind: 'untracked' });
  expect(
    classifyOperatorCall({
      callInfo,
      operatorFn: operator({ kind: 'read', keys: () => 'state:a' }),
      operatorName: '_a',
    })
  ).toMatchObject({ kind: 'untracked', reason: '_a tracking keys are not an array of strings' });
});

test('classifyOperatorCall marks a throwing declaration untracked instead of throwing', () => {
  const tracking = () => {
    throw new Error('Boom.');
  };
  expect(
    classifyOperatorCall({ callInfo, operatorFn: operator(tracking), operatorName: '_a' })
  ).toEqual({ kind: 'untracked', keys: [], reason: '_a tracking declaration threw: Boom.' });
  const keys = () => {
    throw new Error('Keys boom.');
  };
  expect(
    classifyOperatorCall({
      callInfo,
      operatorFn: operator({ kind: 'read', keys }),
      operatorName: '_a',
    })
  ).toEqual({ kind: 'untracked', keys: [], reason: '_a tracking keys threw: Keys boom.' });
});

test('classifyOperatorCall passes resultMayContainFunctions through', () => {
  expect(
    classifyOperatorCall({
      callInfo,
      operatorFn: operator({ kind: 'pure', resultMayContainFunctions: true }),
      operatorName: '_js',
    })
  ).toMatchObject({ kind: 'pure', resultMayContainFunctions: true });
});
