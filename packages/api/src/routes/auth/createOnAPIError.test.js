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

import { expect, test, vi } from 'vitest';

import createOnAPIError from './createOnAPIError.js';

function setup() {
  const logger = { warn: vi.fn(), error: vi.fn() };
  const handleError = vi.fn(async () => {});
  const createSystemContext = vi.fn(() => ({ handleError }));
  const auth = {};
  const onAPIError = createOnAPIError({ createSystemContext, getAuth: () => auth, logger });
  return { auth, createSystemContext, handleError, logger, onAPIError };
}

test('createOnAPIError logs a 4xx as one warn line', () => {
  const { handleError, logger, onAPIError } = setup();
  const error = new Error('Invalid password');
  error.statusCode = 401;
  error.body = { code: 'INVALID_EMAIL_OR_PASSWORD' };
  onAPIError(error);
  expect(logger.warn).toHaveBeenCalledWith(
    { event: 'auth_engine', code: 'INVALID_EMAIL_OR_PASSWORD', status: 401 },
    'Auth request rejected (401): Invalid password'
  );
  expect(handleError).not.toHaveBeenCalled();
});

test('createOnAPIError reports a fault through a system context error sink', () => {
  const { auth, createSystemContext, handleError, logger, onAPIError } = setup();
  const error = new Error('Adapter failed.');
  onAPIError(error);
  expect(createSystemContext).toHaveBeenCalledWith({ auth });
  expect(handleError).toHaveBeenCalledWith(error);
  expect(logger.error).not.toHaveBeenCalled();
});

test('createOnAPIError does not report a fault a hook routine already reported', () => {
  const { handleError, logger, onAPIError } = setup();
  const error = new Error('Hook routine failed.');
  error.handled = true;
  onAPIError(error);
  expect(handleError).not.toHaveBeenCalled();
  expect(logger.error).not.toHaveBeenCalled();
});
