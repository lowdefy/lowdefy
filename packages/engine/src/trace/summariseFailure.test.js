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

import { UserError } from '@lowdefy/errors';

import summariseFailure from './summariseFailure.js';

test('summariseFailure returns null without an error', () => {
  expect(summariseFailure(undefined)).toBeNull();
});

test('summariseFailure reads the action and the error of a failed action', () => {
  const error = new Error('Timed out.');
  error.name = 'RequestError';
  error.configKey = 'key-error';
  const action = { id: 'load', type: 'CallAPI' };
  Object.defineProperty(action, '~k', { value: 'key-action' });
  expect(summariseFailure({ error, action, index: 0 })).toEqual({
    actionId: 'load',
    actionType: 'CallAPI',
    configKey: 'key-error',
    errorName: 'RequestError',
    invalidBlocks: [],
  });
});

test('summariseFailure falls back to the action config key', () => {
  const action = { id: 'load', type: 'CallAPI' };
  Object.defineProperty(action, '~k', { value: 'key-action' });
  expect(summariseFailure({ error: new Error('x'), action, index: 0 }).configKey).toBe(
    'key-action'
  );
});

test('summariseFailure carries the invalid blocks of a Validate failure', () => {
  const error = new UserError('2 fields are invalid.', { invalidBlocks: ['name', 'email'] });
  const failure = summariseFailure({ error, action: { id: 'check', type: 'Validate' } });
  expect(failure.errorName).toBe('UserError');
  expect(failure.invalidBlocks).toEqual(['name', 'email']);
});

test('summariseFailure gives null action fields for a control-flow parser error', () => {
  const error = new Error('Bad operator.');
  error.name = 'OperatorError';
  error.configKey = 'key-if';
  expect(summariseFailure({ error })).toEqual({
    actionId: null,
    actionType: null,
    configKey: 'key-if',
    errorName: 'OperatorError',
    invalidBlocks: [],
  });
});
