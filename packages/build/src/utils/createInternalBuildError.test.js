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
import { BuildError, ConfigError, ConfigWarning } from '@lowdefy/errors';

import createInternalBuildError from './createInternalBuildError.js';

test('createInternalBuildError carries a plain error as a located internal error', () => {
  const error = new TypeError('Cannot read properties of undefined');
  error.filePath = 'requests/get_rows.yaml';
  const context = {
    warnings: [new ConfigWarning('Deprecated property.')],
    handleError: jest.fn((err) => {
      err.source = `/app/${err.filePath}`;
    }),
  };

  const buildError = createInternalBuildError({ error, context });

  expect(buildError).toBeInstanceOf(BuildError);
  expect(buildError.message).toBe('Build failed due to internal error. See above for details.');
  const handled = context.handleError.mock.calls[0][0];
  expect(handled.name).toBe('LowdefyInternalError');
  expect(handled.cause).toBe(error);
  expect(buildError.errors).toEqual([
    expect.objectContaining({
      name: 'LowdefyInternalError',
      message: 'Cannot read properties of undefined',
      source: '/app/requests/get_rows.yaml',
      stack: error.stack,
    }),
  ]);
  expect(buildError.warnings).toEqual([
    expect.objectContaining({ message: 'Deprecated property.' }),
  ]);
});

test('createInternalBuildError keeps a Lowdefy error as it is', () => {
  const error = new ConfigError('Bad config', { configKey: 'abc' });
  const context = { warnings: [], handleError: jest.fn() };

  const buildError = createInternalBuildError({ error, context });

  expect(context.handleError).toHaveBeenCalledWith(error);
  expect(buildError.errors[0]).toMatchObject({
    name: 'ConfigError',
    message: 'Bad config',
    configKey: 'abc',
  });
});

test('createInternalBuildError logs through the logger when there is no build context', () => {
  const error = new Error('Context failed');
  const logger = { error: jest.fn() };

  const buildError = createInternalBuildError({ error, context: undefined, logger });

  expect(logger.error.mock.calls[0][0].message).toBe('Context failed');
  expect(buildError.errors[0].message).toBe('Context failed');
  expect(buildError.warnings).toEqual([]);
});
