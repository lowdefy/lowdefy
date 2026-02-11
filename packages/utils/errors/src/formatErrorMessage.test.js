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

import formatErrorMessage from './formatErrorMessage.js';

test('formatErrorMessage returns string messages unchanged', () => {
  expect(formatErrorMessage('something went wrong')).toBe('something went wrong');
});

test('formatErrorMessage formats error with name prefix', () => {
  const error = new Error('connection failed');
  expect(formatErrorMessage(error)).toBe('[Error] connection failed');
});

test('formatErrorMessage uses custom error name', () => {
  const error = { name: 'ConfigError', message: 'invalid block type' };
  expect(formatErrorMessage(error)).toBe('[ConfigError] invalid block type');
});

test('formatErrorMessage defaults name to Error when missing', () => {
  expect(formatErrorMessage({ message: 'oops' })).toBe('[Error] oops');
});

test('formatErrorMessage appends received value', () => {
  const error = { name: 'PluginError', message: 'expected string', received: 42 };
  expect(formatErrorMessage(error)).toBe('[PluginError] expected string Received: 42');
});

test('formatErrorMessage appends received object', () => {
  const error = { name: 'PluginError', message: 'bad params', received: { key: 'val' } };
  expect(formatErrorMessage(error)).toBe('[PluginError] bad params Received: {"key":"val"}');
});

test('formatErrorMessage handles unserializable received value', () => {
  const circular = {};
  circular.self = circular;
  const error = { name: 'Error', message: 'fail', received: circular };
  expect(formatErrorMessage(error)).toBe('[Error] fail Received: [unserializable]');
});

test('formatErrorMessage does not append received when undefined', () => {
  const error = { name: 'Error', message: 'fail', received: undefined };
  expect(formatErrorMessage(error)).toBe('[Error] fail');
});

test('formatErrorMessage appends received when null', () => {
  const error = { name: 'Error', message: 'fail', received: null };
  expect(formatErrorMessage(error)).toBe('[Error] fail Received: null');
});

test('formatErrorMessage falls back to rawMessage when message is missing', () => {
  const error = { name: 'Error', rawMessage: 'raw msg' };
  expect(formatErrorMessage(error)).toBe('[Error] raw msg');
});

test('formatErrorMessage falls back to cause.message when message and rawMessage are missing', () => {
  const error = { name: 'Error', cause: { message: 'cause msg' } };
  expect(formatErrorMessage(error)).toBe('[Error] cause msg');
});

test('formatErrorMessage returns Unknown error when no message found', () => {
  expect(formatErrorMessage({})).toBe('[Error] Unknown error');
});

test('formatErrorMessage returns Unknown error for null input', () => {
  expect(formatErrorMessage(null)).toBe('[Error] Unknown error');
});

test('formatErrorMessage returns Unknown error for undefined input', () => {
  expect(formatErrorMessage(undefined)).toBe('[Error] Unknown error');
});

test('formatErrorMessage skips prefix when includePrefix is false', () => {
  const error = { name: 'ConfigError', message: 'bad config', received: { x: 1 } };
  expect(formatErrorMessage(error, { includePrefix: false })).toBe(
    'bad config Received: {"x":1}'
  );
});

test('formatErrorMessage skips prefix for error without received', () => {
  const error = { name: 'Error', message: 'simple' };
  expect(formatErrorMessage(error, { includePrefix: false })).toBe('simple');
});

test('formatErrorMessage returns string unchanged even with includePrefix false', () => {
  expect(formatErrorMessage('plain message', { includePrefix: false })).toBe('plain message');
});
