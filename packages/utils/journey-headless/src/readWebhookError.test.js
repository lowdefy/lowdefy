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

import readWebhookError from './readWebhookError.js';

test('readWebhookError returns null for a webhook that answered 200', () => {
  expect(readWebhookError({ status: 200, body: { received: true } })).toBe(null);
  expect(readWebhookError({ status: 200, body: 'challenge-token' })).toBe(null);
});

test('readWebhookError reads the message of the route error body of a refused webhook', () => {
  const body = { error: { code: 'unauthorized', message: 'Webhook verification failed.' } };
  expect(readWebhookError({ status: 401, body })).toBe('Webhook verification failed.');
});

test('readWebhookError reads the error handler answer of a webhook that threw, as a call does', () => {
  expect(readWebhookError({ status: 400, body: { message: 'Bad body.' } })).toBe('Bad body.');
  expect(readWebhookError({ status: 409, body: { reason: 'duplicate' } })).toBe('409');
});
