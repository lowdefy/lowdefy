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

import invokeEndpoint from './invokeEndpoint.js';

// better-call's APIError carries the numeric HTTP status on statusCode; `status`
// is its string name.
function apiError({ status, statusCode, message, code }) {
  const error = new Error('APIError');
  error.status = status;
  error.statusCode = statusCode;
  error.body = { message, code };
  return error;
}

test('invokeEndpoint returns the endpoint result', async () => {
  const endpoint = jest.fn().mockResolvedValue({ id: 'member-1' });
  expect(await invokeEndpoint({ endpoint, input: { body: {} } })).toEqual({ id: 'member-1' });
  expect(endpoint).toHaveBeenCalledWith({ body: {} });
});

test('invokeEndpoint surfaces a 4xx APIError rail message as a plain error', async () => {
  const cause = apiError({
    status: 'BAD_REQUEST',
    statusCode: 400,
    message: 'Role not found.',
    code: 'ROLE_NOT_FOUND',
  });
  const endpoint = jest.fn().mockRejectedValue(cause);
  await expect(invokeEndpoint({ endpoint, input: {} })).rejects.toMatchObject({
    name: 'Error',
    message: 'Role not found.',
    cause,
  });
});

test('invokeEndpoint wraps a 5xx APIError as a ServiceError', async () => {
  const cause = apiError({
    status: 'INTERNAL_SERVER_ERROR',
    statusCode: 500,
    message: 'Something broke.',
    code: 'INTERNAL_SERVER_ERROR',
  });
  const endpoint = jest.fn().mockRejectedValue(cause);
  await expect(invokeEndpoint({ endpoint, input: {} })).rejects.toMatchObject({
    name: 'ServiceError',
    service: 'BetterAuth',
    cause,
  });
});

test('invokeEndpoint rethrows a non-APIError unchanged', async () => {
  const cause = new Error('Adapter blew up.');
  const endpoint = jest.fn().mockRejectedValue(cause);
  await expect(invokeEndpoint({ endpoint, input: {} })).rejects.toBe(cause);
});
