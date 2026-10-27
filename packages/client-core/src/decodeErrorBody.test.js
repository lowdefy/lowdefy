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
import { getDevError } from '@lowdefy/engine';
import { AuthorizationError, RequestError, UserError } from '@lowdefy/errors';
import { serializer } from '@lowdefy/helpers';

import decodeErrorBody from './decodeErrorBody.js';

test('decodeErrorBody decodes a serialized server error with its dev error', () => {
  const wire = new RequestError('Request failed.');
  wire.handled = true;
  wire.requestId = 'rid-1';
  const body = {
    ...serializer.serialize(wire),
    devError: serializer.serialize(new RequestError('Mongo refused the query.')),
  };
  const error = decodeErrorBody(body);
  expect(error).toBeInstanceOf(RequestError);
  expect(error.message).toEqual('Request failed.');
  expect(error.handled).toBe(true);
  expect(error.requestId).toEqual('rid-1');
  expect(getDevError(error).message).toEqual('Mongo refused the query.');
});

test('decodeErrorBody rebuilds the class of an expected outcome answered as name and message', () => {
  const refusal = decodeErrorBody({ name: 'AuthorizationError', message: 'Not allowed.' });
  expect(refusal).toBeInstanceOf(AuthorizationError);
  expect(refusal.message).toEqual('Not allowed.');
  expect(decodeErrorBody({ name: 'UserError', message: 'Check the form.' })).toBeInstanceOf(
    UserError
  );
});

test('decodeErrorBody returns null for a body that carries no Lowdefy error', () => {
  expect(decodeErrorBody({ name: 'Error', message: 'Boom.' })).toBeNull();
  expect(decodeErrorBody({ code: 'INVALID_OTP', message: 'Invalid code.' })).toBeNull();
  expect(decodeErrorBody(null)).toBeNull();
});
