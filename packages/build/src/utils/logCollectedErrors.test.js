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

import { jest } from '@jest/globals';
import logCollectedErrors from './logCollectedErrors.js';
import { ConfigError } from '@lowdefy/errors/build';

test('logCollectedErrors does nothing when no errors', () => {
  const context = { errors: [], logger: { error: jest.fn() } };
  logCollectedErrors(context);
  expect(context.logger.error).not.toHaveBeenCalled();
});

test('logCollectedErrors logs ConfigError instances and throws summary', () => {
  const configErr = new ConfigError({ message: 'Bad config' });
  const context = { errors: [configErr], logger: { error: jest.fn() } };
  expect(() => logCollectedErrors(context)).toThrow(
    'Build failed with 1 error(s). See above for details.'
  );
  expect(context.logger.error).toHaveBeenCalledWith(configErr);
});

test('logCollectedErrors wraps plain errors as LowdefyError', () => {
  const plainErr = new Error('Something broke');
  const context = { errors: [plainErr], logger: { error: jest.fn() } };
  expect(() => logCollectedErrors(context)).toThrow(
    'Build failed with 1 error(s). See above for details.'
  );
  const loggedErr = context.logger.error.mock.calls[0][0];
  expect(loggedErr.name).toBe('LowdefyError');
  expect(loggedErr.message).toBe('Something broke');
});

test('logCollectedErrors logs errors with print method directly', () => {
  const printableErr = new Error('Printable');
  printableErr.print = () => 'formatted';
  const context = { errors: [printableErr], logger: { error: jest.fn() } };
  expect(() => logCollectedErrors(context)).toThrow();
  expect(context.logger.error).toHaveBeenCalledWith(printableErr);
});

test('logCollectedErrors sets isFormatted and hideStack on thrown error', () => {
  const context = { errors: [new Error('a'), new Error('b')], logger: { error: jest.fn() } };
  try {
    logCollectedErrors(context);
  } catch (err) {
    expect(err.isFormatted).toBe(true);
    expect(err.hideStack).toBe(true);
    expect(err.message).toBe('Build failed with 2 error(s). See above for details.');
  }
});
