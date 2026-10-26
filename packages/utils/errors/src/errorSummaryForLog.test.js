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

import { expect, test } from 'vitest';
import errorSummaryForLog from './errorSummaryForLog.js';

// The AI SDK marks its errors with this symbol; AISDKError.isInstance reads it.
function aiSdkError(name, message, fields = {}) {
  const error = new Error(message);
  error.name = name;
  error[Symbol.for('vercel.ai.error')] = true;
  return Object.assign(error, fields);
}

test('an error is summarised as its name, code, status code and message, and no other field', () => {
  const error = new Error('Document failed validation');
  error.name = 'MongoServerError';
  error.code = 121;
  error.errInfo = { details: { document: { message: 'My ID is 8001015009087' } } };

  expect(errorSummaryForLog(error)).toEqual({
    name: 'MongoServerError',
    message: 'Document failed validation',
    code: 121,
  });
});

test('the status code is read where HTTP clients put it', () => {
  const error = new Error('Request failed with status code 404');
  error.response = { status: 404, data: { detail: 'My ID is 8001015009087' } };

  expect(errorSummaryForLog(error)).toEqual({
    name: 'Error',
    message: 'Request failed with status code 404',
    statusCode: 404,
  });
});

test('the message is cut to 500 characters', () => {
  const summary = errorSummaryForLog(new Error('x'.repeat(600)));

  expect(summary.message).toBe(`${'x'.repeat(499)}…`);
  expect(summary.message).toHaveLength(500);
});

test("an AI SDK error's message is left out, but for an APICallError's", () => {
  const validation = aiSdkError('AI_TypeValidationError', 'Invalid value: My ID is 8001015009087');
  const apiCall = aiSdkError('AI_APICallError', 'Overloaded', { statusCode: 529 });

  expect(errorSummaryForLog(validation)).toEqual({ name: 'AI_TypeValidationError' });
  expect(errorSummaryForLog(apiCall)).toEqual({
    name: 'AI_APICallError',
    message: 'Overloaded',
    statusCode: 529,
  });
});

test('causes are followed three deep, and a retry error to its last attempt', () => {
  let error = new Error('level 4');
  for (let level = 3; level >= 0; level -= 1) {
    error = new Error(`level ${level}`, { cause: error });
  }
  expect(errorSummaryForLog(error)).toEqual({
    name: 'Error',
    message: 'level 0',
    cause: {
      name: 'Error',
      message: 'level 1',
      cause: { name: 'Error', message: 'level 2', cause: { name: 'Error', message: 'level 3' } },
    },
  });

  const retry = aiSdkError('AI_RetryError', 'Failed after 3 attempts.', {
    lastError: new Error('Overloaded'),
  });
  expect(errorSummaryForLog(retry)).toEqual({
    name: 'AI_RetryError',
    cause: { name: 'Error', message: 'Overloaded' },
  });
});

test('a value thrown that is not an error is named by its type', () => {
  expect(errorSummaryForLog('My ID is 8001015009087')).toEqual({ name: 'string' });
  expect(errorSummaryForLog(null)).toEqual({ name: 'object' });
});

test('an error from another realm, which fails instanceof Error, is summarised as an error', () => {
  const foreign = {
    name: 'TimeoutError',
    message: 'The operation timed out.',
    code: 23,
    stack: 'TimeoutError: The operation timed out.\n    at run (file.js:1:1)',
  };

  expect(errorSummaryForLog(foreign)).toEqual({
    name: 'TimeoutError',
    message: 'The operation timed out.',
    code: 23,
  });
});

test('a status above a call that timed out is left out, as the client made it up', () => {
  const timeout = new DOMException('The operation was aborted due to timeout', 'TimeoutError');
  const gateway = new Error('Gateway request failed', { cause: timeout });
  gateway.name = 'GatewayResponseError';
  gateway.statusCode = 500;

  expect(errorSummaryForLog(gateway)).toEqual({
    name: 'GatewayResponseError',
    message: 'Gateway request failed',
    // A DOMException's legacy code: TIMEOUT_ERR.
    cause: { name: 'TimeoutError', message: 'The operation was aborted due to timeout', code: 23 },
  });
});
