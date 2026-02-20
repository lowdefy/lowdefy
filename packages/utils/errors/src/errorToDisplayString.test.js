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

import errorToDisplayString from './errorToDisplayString.js';

test('errorToDisplayString returns string messages unchanged', () => {
  expect(errorToDisplayString('something went wrong')).toBe('something went wrong');
});

test('errorToDisplayString formats error with name prefix', () => {
  const error = new Error('connection failed');
  expect(errorToDisplayString(error)).toBe('[Error] connection failed');
});

test('errorToDisplayString uses custom error name', () => {
  const error = { name: 'ConfigError', message: 'invalid block type' };
  expect(errorToDisplayString(error)).toBe('[ConfigError] invalid block type');
});

test('errorToDisplayString defaults name to Error when missing', () => {
  expect(errorToDisplayString({ message: 'oops' })).toBe('[Error] oops');
});

test('errorToDisplayString appends received value', () => {
  const error = { name: 'OperatorError', message: 'expected string', received: 42 };
  expect(errorToDisplayString(error)).toBe('[OperatorError] expected string Received: 42');
});

test('errorToDisplayString appends received object', () => {
  const error = { name: 'OperatorError', message: 'bad params', received: { key: 'val' } };
  expect(errorToDisplayString(error)).toBe('[OperatorError] bad params Received: {"key":"val"}');
});

test('errorToDisplayString handles unserializable received value', () => {
  const circular = {};
  circular.self = circular;
  const error = { name: 'Error', message: 'fail', received: circular };
  expect(errorToDisplayString(error)).toBe('[Error] fail Received: [unserializable]');
});

test('errorToDisplayString does not append received when undefined', () => {
  const error = { name: 'Error', message: 'fail', received: undefined };
  expect(errorToDisplayString(error)).toBe('[Error] fail');
});

test('errorToDisplayString appends received when null', () => {
  const error = { name: 'Error', message: 'fail', received: null };
  expect(errorToDisplayString(error)).toBe('[Error] fail Received: null');
});

test('errorToDisplayString returns String(input) for non-error non-string input', () => {
  expect(errorToDisplayString(42)).toBe('42');
  expect(errorToDisplayString(true)).toBe('true');
});

test('errorToDisplayString returns String(null) for null input', () => {
  expect(errorToDisplayString(null)).toBe('null');
});

test('errorToDisplayString returns String(undefined) for undefined input', () => {
  expect(errorToDisplayString(undefined)).toBe('undefined');
});
