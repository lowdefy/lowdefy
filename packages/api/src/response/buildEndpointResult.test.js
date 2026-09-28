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
import { RequestError } from '@lowdefy/errors';

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
  expect(result.error['~e'].name).toBe('RequestError');
});

test('buildEndpointResult keeps the reject status and reports failure', () => {
  const result = buildEndpointResult({}, { error: null, response: null, status: 'reject' });
  expect(result.status).toBe('reject');
  expect(result.success).toBe(false);
});

test('buildEndpointResult sends the error field as the wire error', () => {
  const error = new RequestError('Request failed.', {
    received: { headers: { authorization: 'Bearer super-secret' } },
  });
  const result = buildEndpointResult(
    { mode: 'prod', rid: 'rid-1' },
    { error, response: null, status: 'error' }
  );
  expect(result.error).toEqual({
    '~e': {
      name: 'RequestError',
      message: 'Something went wrong.',
      requestId: 'rid-1',
      isLowdefyError: true,
    },
  });
  expect(JSON.stringify(result)).not.toContain('super-secret');
});

test('buildEndpointResult puts devError inside the error field in dev only', () => {
  const error = new RequestError('Request failed.');
  const dev = buildEndpointResult(
    { mode: 'dev', rid: 'rid-1' },
    { error, response: { partial: true }, status: 'error' }
  );
  const prod = buildEndpointResult(
    { mode: 'prod', rid: 'rid-1' },
    { error, response: { partial: true }, status: 'error' }
  );

  expect(dev.error.devError['~e'].message).toBe('Request failed.');
  expect(dev.error.devError['~e'].requestId).toBe('rid-1');
  expect(Object.keys(dev)).toEqual(['error', 'response', 'status', 'success']);
  expect(dev.response).toEqual({ partial: true });
  expect('devError' in prod.error).toBe(false);
});

test('buildEndpointResult gives an error nested in the response value the wire shape and no devError', () => {
  const configDirectory = path.resolve('/app/config');
  const nested = new RequestError('Step failed.', {
    configKey: 'key-1',
    received: { headers: { authorization: 'Bearer super-secret' } },
  });
  nested.source = `${path.resolve(configDirectory, 'endpoints/sync.yaml')}:8`;
  // makeReplacer wraps any Error it meets anywhere in a value, so a routine that
  // returns one inside its response value is covered by the same projection - the
  // response reaches the same audience as the error field.
  const result = buildEndpointResult(
    { mode: 'dev', rid: 'rid-1', configDirectory },
    { error: null, response: { steps: { attempt: { error: nested } } }, status: 'return' }
  );

  expect(result.response.steps.attempt.error).toEqual({
    '~e': {
      name: 'RequestError',
      message: 'Something went wrong.',
      configKey: 'key-1',
      requestId: 'rid-1',
      isLowdefyError: true,
    },
  });
  expect(JSON.stringify(result)).not.toContain('super-secret');
  expect(JSON.stringify(result)).not.toContain('devError');
  expect(JSON.stringify(result)).not.toContain(configDirectory);
});

test('buildEndpointResult leaves a source value in author response data alone', () => {
  const configDirectory = path.resolve('/app/config');
  const authorData = { source: path.resolve(configDirectory, 'uploads/report.csv') };

  const result = buildEndpointResult(
    { mode: 'dev', configDirectory },
    { error: null, response: authorData, status: 'return' }
  );

  expect(result.response.source).toBe(authorData.source);
});

test('buildEndpointResult serializes dates in the response', () => {
  const date = new Date('2026-07-30T00:00:00.000Z');
  const result = buildEndpointResult({}, { error: null, response: { date }, status: 'return' });
  expect(result.response).toEqual({ date: { '~d': date.valueOf() } });
});
