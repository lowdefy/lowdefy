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

import { getDevError } from '@lowdefy/engine';
import { AuthorizationError, RequestError } from '@lowdefy/errors';

import readServerError from './readServerError.js';

function answer({ status, body, json = async () => body }) {
  return { ok: false, status, json };
}

test('a fault the server answered keeps its class, request id, handled mark and dev error', async () => {
  const error = await readServerError({
    res: answer({
      status: 500,
      body: {
        '~e': {
          name: 'RequestError',
          message: 'Something went wrong.',
          requestId: 'rid-1',
          handled: true,
          isLowdefyError: true,
        },
        devError: {
          '~e': { name: 'RequestError', message: 'Mongo refused the query.', isLowdefyError: true },
        },
      },
    }),
    message: 'The app answered 500.',
  });
  expect(error).toBeInstanceOf(RequestError);
  expect(error.message).toBe('Something went wrong.');
  expect(error.requestId).toBe('rid-1');
  expect(error.handled).toBe(true);
  expect(error.status).toBe(500);
  expect(getDevError(error).message).toBe('Mongo refused the query.');
});

test('an expected outcome the server answered as name and message keeps its class', async () => {
  const error = await readServerError({
    res: answer({ status: 403, body: { name: 'AuthorizationError', message: 'Not allowed.' } }),
    message: 'The app answered 403.',
  });
  expect(error).toBeInstanceOf(AuthorizationError);
  expect(error.message).toBe('Not allowed.');
  expect(error.status).toBe(403);
});

test('another JSON answer is a plain Error with its message and the status', async () => {
  const error = await readServerError({
    res: answer({ status: 400, body: { code: 'INVALID_OTP', message: 'Invalid code.' } }),
    message: 'The app answered 400.',
  });
  expect(error.constructor).toBe(Error);
  expect(error.message).toBe('Invalid code.');
  expect(error.status).toBe(400);
});

test('an answer that is not JSON is a plain Error with the given message and the status', async () => {
  const error = await readServerError({
    res: answer({
      status: 502,
      json: async () => {
        throw new SyntaxError('Unexpected token <');
      },
    }),
    message: 'The app answered 502.',
  });
  expect(error.message).toBe('The app answered 502.');
  expect(error.status).toBe(502);
});
