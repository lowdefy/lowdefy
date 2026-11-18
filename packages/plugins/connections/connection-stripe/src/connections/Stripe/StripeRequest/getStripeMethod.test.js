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
import Stripe from 'stripe';

import getStripeMethod from './getStripeMethod.js';

// The real client, so the test follows where the SDK puts its resources and methods.
const stripe = new Stripe('sk_test_key');

test('getStripeMethod returns a top-level resource method bound to its resource', () => {
  const { method, resource } = getStripeMethod({ stripe, path: ['customers', 'list'] });
  expect(resource).toBe(stripe.customers);
  expect(method).toBe(stripe.customers.list);
});

test('getStripeMethod returns a nested resource method', () => {
  const { method, resource } = getStripeMethod({
    stripe,
    path: ['checkout', 'sessions', 'retrieve'],
  });
  expect(resource).toBe(stripe.checkout.sessions);
  expect(method).toBe(stripe.checkout.sessions.retrieve);
});

test('getStripeMethod throws for a resource the client does not have', () => {
  expect(() => getStripeMethod({ stripe, path: ['foo', 'list'] })).toThrow(
    'Invalid Stripe method foo.list'
  );
});

test('getStripeMethod throws for a method removed from the client', () => {
  expect(() => getStripeMethod({ stripe, path: ['invoices', 'retrieveUpcoming'] })).toThrow(
    'Invalid Stripe method invoices.retrieveUpcoming'
  );
});

test('getStripeMethod throws for an SDK internal method', () => {
  expect(() => getStripeMethod({ stripe, path: ['customers', '_makeRequest'] })).toThrow(
    'Invalid Stripe method customers._makeRequest'
  );
});

test('getStripeMethod throws for an Object.prototype member', () => {
  expect(() => getStripeMethod({ stripe, path: ['customers', 'constructor'] })).toThrow(
    'Invalid Stripe method customers.constructor'
  );
  expect(() => getStripeMethod({ stripe, path: ['customers', 'toString'] })).toThrow(
    'Invalid Stripe method customers.toString'
  );
});

test('getStripeMethod throws for a path through the prototype chain', () => {
  expect(() => getStripeMethod({ stripe, path: ['__proto__', 'constructor', 'name'] })).toThrow(
    'Invalid Stripe method __proto__.constructor.name'
  );
});
