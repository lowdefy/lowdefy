/*
  Copyright 2020-2024 Lowdefy, Inc

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

import { validate } from '@lowdefy/ajv';
import Stripe from './Stripe.js';

const schema = Stripe.schema;

test('All requests are present', () => {
  expect(Stripe.requests.StripeRequest).toBeDefined();
});

test('Valid connection schema, secretKey present', () => {
  const connection = {
    secretKey: 'foo',
  };

  expect(validate({ schema, data: connection })).toEqual({ valid: true });
});

test('Valid connection schema, secretKey present', () => {
  const connection = {
    secretKey: 'foo',
  };

  expect(validate({ schema, data: connection })).toEqual({ valid: true });
});

test('Valid connection schema, all options', () => {
  const connection = {
    secretKey: 'foo',
    apiVersion: 'foo',
    telemetry: true,
    timeout: 42,
    maxNetworkRetries: 42,
  };

  expect(validate({ schema, data: connection })).toEqual({ valid: true });
});

test('SecretKey missing', () => {
  const connection = {};

  expect(() => validate({ schema, data: connection })).toThrow(
    'Stripe connection should have required property "secretKey".'
  );
});
