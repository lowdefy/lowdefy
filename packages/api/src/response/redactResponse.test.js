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

import { RequestError, UserError } from '@lowdefy/errors';
import { serializer } from '@lowdefy/helpers';

import redactResponse from './redactResponse.js';

test('redactResponse gives an Error in a response value the wire shape and no devError in dev', () => {
  const error = new RequestError('Step failed.', {
    received: { headers: { authorization: 'Bearer super-secret' } },
  });

  const response = redactResponse({ mode: 'dev', rid: 'rid-1' }, { result: error });

  expect(response).toEqual({
    result: {
      '~e': {
        name: 'RequestError',
        message: 'Something went wrong.',
        requestId: 'rid-1',
        isLowdefyError: true,
      },
    },
  });
});

test('redactResponse keeps the message of a UserError in a response value', () => {
  const response = redactResponse({ mode: 'dev' }, [new UserError('Out of stock.')]);

  expect(response[0]['~e'].message).toBe('Out of stock.');
  expect('devError' in response[0]).toBe(false);
});

test('redactResponse passes a response without errors through', () => {
  expect(redactResponse({ mode: 'dev' }, { a: 1, b: ['x'] })).toEqual({ a: 1, b: ['x'] });
});

test('redactResponse leaves out the build markers a value copied from config carries', () => {
  // A :return literal evaluated from an endpoint artifact keeps its ~k, ~r and ~l
  // markers as hidden properties, and an array keeps them too.
  const response = serializer.deserializeFromString(
    '{"order":{"id":"o_1","lines":{"~arr":[{"sku":"a","~k":"k4"}],"~k":"k3"},"~k":"k2","~r":"r1","~l":4},"~k":"k1"}'
  );

  expect(redactResponse({ mode: 'prod' }, response)).toEqual({
    order: { id: 'o_1', lines: [{ sku: 'a' }] },
  });
});
