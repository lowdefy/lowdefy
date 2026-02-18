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
import logCollectedErrors from './logCollectedErrors.js';
import { BuildError, ConfigError, OperatorError } from '@lowdefy/errors';

test('logCollectedErrors does nothing when no errors', () => {
  const context = { errors: [], handleError: jest.fn() };
  logCollectedErrors(context);
  expect(context.handleError).not.toHaveBeenCalled();
});

test('logCollectedErrors logs ConfigError instances and throws summary', () => {
  const configErr = new ConfigError({ message: 'Bad config' });
  const context = { errors: [configErr], handleError: jest.fn() };
  expect(() => logCollectedErrors(context)).toThrow(
    'Build failed with 1 error(s). See above for details.'
  );
  expect(context.handleError).toHaveBeenCalledWith(configErr);
});

test('logCollectedErrors wraps plain errors as LowdefyError', () => {
  const plainErr = new Error('Something broke');
  const context = { errors: [plainErr], handleError: jest.fn() };
  expect(() => logCollectedErrors(context)).toThrow(
    'Build failed with 1 error(s). See above for details.'
  );
  const loggedErr = context.handleError.mock.calls[0][0];
  expect(loggedErr.name).toBe('LowdefyError');
  expect(loggedErr.message).toBe('Something broke');
});

test('logCollectedErrors wraps errors without print method as LowdefyError', () => {
  const plainErr = new Error('Printable');
  const context = { errors: [plainErr], handleError: jest.fn() };
  expect(() => logCollectedErrors(context)).toThrow();
  const loggedErr = context.handleError.mock.calls[0][0];
  expect(loggedErr.name).toBe('LowdefyError');
  expect(loggedErr.message).toBe('Printable');
});

test('logCollectedErrors passes OperatorError directly without wrapping', () => {
  const operatorErr = new OperatorError({
    error: new Error('op failed'),
    typeName: '_get',
  });
  const context = { errors: [operatorErr], handleError: jest.fn() };
  expect(() => logCollectedErrors(context)).toThrow(BuildError);
  expect(context.handleError).toHaveBeenCalledWith(operatorErr);
});

test('logCollectedErrors throws BuildError', () => {
  const context = { errors: [new Error('a'), new Error('b')], handleError: jest.fn() };
  try {
    logCollectedErrors(context);
  } catch (err) {
    expect(err).toBeInstanceOf(BuildError);
    expect(err.message).toBe('Build failed with 2 error(s). See above for details.');
  }
});
