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

import path from 'path';
import { ConfigError, RequestError } from '@lowdefy/errors';

import buildEndpointResult from './buildEndpointResult.js';

test('buildEndpointResult reports success and passes the status through for a continue status', () => {
  const result = buildEndpointResult({}, { error: null, response: { a: 1 }, status: 'continue' });
  expect(result).toEqual({
    error: null,
    response: { a: 1 },
    status: 'success',
    success: true,
  });
});

test('buildEndpointResult reports success for a return status', () => {
  const result = buildEndpointResult({}, { error: null, response: 'done', status: 'return' });
  expect(result.status).toBe('success');
  expect(result.success).toBe(true);
});

test('buildEndpointResult keeps the error status and reports failure', () => {
  const error = new RequestError('Request failed.');
  const result = buildEndpointResult({}, { error, response: null, status: 'error' });
  expect(result.status).toBe('error');
  expect(result.success).toBe(false);
  expect(result.error['~e'].message).toBe('Request failed.');
});

test('buildEndpointResult keeps the reject status and reports failure', () => {
  const result = buildEndpointResult({}, { error: null, response: null, status: 'reject' });
  expect(result.status).toBe('reject');
  expect(result.success).toBe(false);
});

test('buildEndpointResult redacts the error field', () => {
  const error = new RequestError('Request failed.', {
    received: { headers: { authorization: 'Bearer super-secret' } },
  });
  const result = buildEndpointResult({}, { error, response: null, status: 'error' });
  expect(result.error['~e'].received).toBeUndefined();
  expect(result.error['~e'].stack).toBeUndefined();
  expect(JSON.stringify(result)).not.toContain('super-secret');
});

test('buildEndpointResult redacts an error nested inside the response value', () => {
  const nested = new RequestError('Step failed.', {
    received: { headers: { authorization: 'Bearer super-secret' } },
  });
  // makeReplacer wraps any Error it meets anywhere in a value, so a routine that
  // returns one inside its response value is covered by the same policy - the
  // response reaches the same audience as the error field.
  const result = buildEndpointResult(
    {},
    { error: null, response: { steps: { attempt: { error: nested } } }, status: 'return' }
  );

  expect(result.response.steps.attempt.error['~e'].message).toBe('Step failed.');
  expect(result.response.steps.attempt.error['~e'].received).toBeUndefined();
  expect(result.response.steps.attempt.error['~e'].stack).toBeUndefined();
  expect(JSON.stringify(result)).not.toContain('super-secret');
});

test('buildEndpointResult normalises source on an error nested inside the response value', () => {
  const configDirectory = path.resolve('/app/config');
  const nested = new ConfigError('Step failed.');
  nested.source = `${path.resolve(configDirectory, 'endpoints/sync.yaml')}:8`;

  const result = buildEndpointResult(
    { configDirectory },
    { error: null, response: { steps: { attempt: nested } }, status: 'return' }
  );

  // The response field takes the source normalisation too, so an error riding in a
  // response cannot carry an absolute server path the error field would have
  // stripped.
  expect(result.response.steps.attempt['~e'].source).toBe(
    `${path.join('endpoints', 'sync.yaml')}:8`
  );
  expect(JSON.stringify(result)).not.toContain(configDirectory);
});

test('buildEndpointResult leaves a source value in author response data alone', () => {
  const configDirectory = path.resolve('/app/config');
  const authorData = { source: path.resolve(configDirectory, 'uploads/report.csv') };

  const result = buildEndpointResult(
    { configDirectory },
    { error: null, response: authorData, status: 'return' }
  );

  // Not an error node, so it is the app's own value and must survive verbatim -
  // the normalisation keys on the error shape, not on the key name.
  expect(result.response.source).toBe(authorData.source);
});

test('buildEndpointResult serializes dates in the response', () => {
  const date = new Date('2026-07-30T00:00:00.000Z');
  const result = buildEndpointResult({}, { error: null, response: { date }, status: 'return' });
  expect(result.response).toEqual({ date: { '~d': date.valueOf() } });
});
