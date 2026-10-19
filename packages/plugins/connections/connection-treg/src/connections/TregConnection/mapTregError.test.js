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

import { ConfigError, ServiceError } from '@lowdefy/errors';

import mapTregError from './mapTregError.js';

const TOKEN = 'tok_live_5ecret_value';
const connection = { token: TOKEN };
const target = '"treg.people.email.find"';

function map({ status, headers = {}, body = null, conn = connection }) {
  return mapTregError({
    response: { status, headers: new Headers(headers), body },
    target,
    connection: conn,
  });
}

const tregOwn = { 'x-treg-error': '1' };

describe('402', () => {
  const balanceBody = {
    detail: {
      error: 'insufficient_balance',
      message: `treg.people.email.find would cost ~$0.01 and this team's balance is $0.002.\n  add funds: https://treg.to/app#billing`,
      balance_micro: 2000,
      estimated_cost_micro: 10000,
      topup_url: '/app#billing',
      provider: 'hunter',
    },
  };

  test('mapTregError maps insufficient_balance to a final error that names what is needed and what is left', () => {
    const error = map({ status: 402, headers: tregOwn, body: balanceBody });
    expect(error).not.toBeInstanceOf(ServiceError);
    expect(ServiceError.isServiceError(error)).toBe(false);
    expect(error.message).toBe('treg balance too low: needs ~$0.01, has $0.002.');
    expect(error.statusCode).toBe(402);
    expect(error.code).toBe('insufficient_balance');
  });

  test.each([
    ['an unparseable URL', 'http://['],
    ['a number', 42],
  ])('mapTregError keeps the balance error when the top-up link is %s', (_, topupUrl) => {
    const error = map({
      status: 402,
      headers: tregOwn,
      body: { detail: { ...balanceBody.detail, topup_url: topupUrl } },
    });
    expect(error.message).toBe('treg balance too low: needs ~$0.01, has $0.002.');
    expect(error.statusCode).toBe(402);
    expect(error.code).toBe('insufficient_balance');
    expect(error.cause.message).toBe(
      `treg balance too low for ${target}. Top up the team balance, or connect the team's own key for the provider.`
    );
  });

  test('mapTregError keeps the top-up link out of the message and puts it in the cause for the server log', () => {
    const error = map({
      status: 402,
      headers: tregOwn,
      body: balanceBody,
      conn: { ...connection, baseUrl: 'https://treg.example.com' },
    });
    expect(error.message).not.toContain('app#billing');
    expect(error.cause.message).toContain('https://treg.example.com/app#billing');
    expect(error.cause.message).toContain(target);
  });

  test('mapTregError accepts out_of_balance as the balance refusal too', () => {
    const error = map({
      status: 402,
      body: { detail: { error: 'out_of_balance', balance_micro: 0, estimated_cost_micro: 500 } },
    });
    expect(error.message).toBe('treg balance too low: needs ~$0.0005, has $0.');
    expect(error.cause.message).not.toContain('http');
  });

  test('mapTregError maps route_max_cost to a final error naming the ceiling', () => {
    const error = map({
      status: 402,
      headers: tregOwn,
      body: {
        detail: { error: 'route_max_cost', max_cost_micro: 50000, estimated_cost_micro: 120000 },
      },
    });
    expect(error.message).toBe(
      `treg call to ${target} would exceed the maxCost ceiling of $0.05 (estimated ~$0.12). Nothing was charged.`
    );
    expect(error.code).toBe('route_max_cost');
    expect(ServiceError.isServiceError(error)).toBe(false);
  });

  test('mapTregError maps another 402 without echoing its body', () => {
    const error = map({ status: 402, body: { message: `payment required for ${TOKEN}` } });
    expect(error.message).toBe(`The provider refused the call to ${target} (402).`);
  });
});

describe('503 and 429', () => {
  test('mapTregError maps provider_capacity_unavailable to a ServiceError retrying at resets_at', () => {
    const resetsAt = new Date(Date.now() + 90 * 1000).toISOString();
    const error = map({
      status: 503,
      headers: tregOwn,
      body: {
        detail: {
          error: 'provider_capacity_unavailable',
          provider: 'hunter',
          endpoint_id: 'hunter.people.email.find',
          resets_at: resetsAt,
          alternatives: ['icypeas.people.email.find $0.004'],
        },
      },
    });
    expect(error).toBeInstanceOf(ServiceError);
    expect(error.statusCode).toBe(503);
    expect(error.code).toBe('provider_capacity_unavailable');
    expect(error.retryAfter).toBeGreaterThanOrEqual(89);
    expect(error.retryAfter).toBeLessThanOrEqual(90);
    expect(error.message).toContain('hunter account is out of capacity');
    expect(error.message).not.toContain('icypeas');
  });

  test('mapTregError retries provider_capacity_unavailable after a minute when treg gives no reset time', () => {
    const error = map({
      status: 503,
      body: { detail: { error: 'provider_capacity_unavailable', resets_at: null } },
    });
    expect(error.retryAfter).toBe(60);
  });

  test('mapTregError prefers a Retry-After header over resets_at', () => {
    const error = map({
      status: 503,
      headers: { 'retry-after': '12' },
      body: {
        detail: {
          error: 'provider_capacity_unavailable',
          resets_at: new Date(Date.now() + 3600000).toISOString(),
        },
      },
    });
    expect(error.retryAfter).toBe(12);
  });

  test('mapTregError reads a retry_after body field', () => {
    const error = map({
      status: 503,
      body: { detail: { error: 'provider_capacity_unavailable', retry_after: 7.2 } },
    });
    expect(error.retryAfter).toBe(8);
  });

  test('mapTregError maps treg_saturated to a ServiceError with the Retry-After seconds', () => {
    const error = map({
      status: 503,
      headers: { 'retry-after': '2' },
      body: { detail: 'treg database pool is saturated', treg_saturated: true },
    });
    expect(error).toBeInstanceOf(ServiceError);
    expect(error.code).toBe('treg_saturated');
    expect(error.retryAfter).toBe(2);
    expect(error.message).toBe(`treg: Saturated (503). Nothing was charged for ${target}.`);
  });

  test('mapTregError maps a relayed provider 429 to a ServiceError with the Retry-After seconds', () => {
    const error = map({ status: 429, headers: { 'retry-after': '30' }, body: { error: 'slow' } });
    expect(error).toBeInstanceOf(ServiceError);
    expect(error.statusCode).toBe(429);
    expect(error.retryAfter).toBe(30);
    expect(error.code).toBeUndefined();
    expect(error.message).toBe(`treg: The provider rate limited the call to ${target} (429).`);
  });

  test('mapTregError reads an HTTP-date Retry-After as seconds from now', () => {
    const error = map({
      status: 429,
      headers: { 'retry-after': new Date(Date.now() + 45000).toUTCString() },
    });
    expect(error.retryAfter).toBeGreaterThanOrEqual(43);
    expect(error.retryAfter).toBeLessThanOrEqual(45);
  });

  test("mapTregError names treg's own 429 code, and leaves retryAfter null when treg gives none", () => {
    const error = map({
      status: 429,
      headers: tregOwn,
      body: { detail: { error: 'tag_spend_cap_reached', dim: 'customer', val: 'cust_1' } },
    });
    expect(error.code).toBe('tag_spend_cap_reached');
    expect(error.retryAfter).toBeNull();
    expect(error.message).toBe(
      `treg: Rate limited the call to ${target} (429 tag_spend_cap_reached).`
    );
  });

  test("mapTregError maps other 5xx to a ServiceError, with treg's detail only when the answer is treg's", () => {
    const provider = map({ status: 500, body: { stack: `secret ${TOKEN}` } });
    expect(provider).toBeInstanceOf(ServiceError);
    expect(provider.message).toBe(`treg: The provider answered 500 for ${target}.`);
    const own = map({
      status: 502,
      headers: tregOwn,
      body: { detail: { error: 'route_failed', message: 'every candidate failed' } },
    });
    expect(own.message).toBe(`treg: Answered 502 for ${target}: every candidate failed`);
    expect(own.code).toBe('route_failed');
  });
});

describe('final errors', () => {
  test('mapTregError maps response_buffer_limit to a final error with no 5xx status', () => {
    const error = map({
      status: 502,
      headers: tregOwn,
      body: { detail: { error: 'response_buffer_limit' } },
    });
    expect(error).not.toBeInstanceOf(ServiceError);
    expect(ServiceError.isServiceError(error)).toBe(false);
    expect(error.statusCode).toBeUndefined();
    expect(error.code).toBe('response_buffer_limit');
    expect(error.message).toContain("larger than treg's 8 MiB settlement buffer");
  });

  test("mapTregError maps treg's own 422 to a ConfigError with treg's detail", () => {
    const error = map({
      status: 422,
      headers: tregOwn,
      body: { detail: 'X-Treg-Meta value for "customer" must not contain "@"' },
    });
    expect(error).toBeInstanceOf(ConfigError);
    expect(error.statusCode).toBe(422);
    expect(error.message).toBe(
      `treg rejected the call to ${target} (422): X-Treg-Meta value for "customer" must not contain "@"`
    );
  });

  test('mapTregError maps a provider 422 to a final error without its body', () => {
    const error = map({ status: 422, body: { detail: 'bad input' } });
    expect(error).not.toBeInstanceOf(ConfigError);
    expect(error.message).toBe(`The provider answered 422 for ${target}.`);
    expect(error.statusCode).toBe(422);
  });

  test('mapTregError maps 401 without the body', () => {
    const error = map({ status: 401, headers: tregOwn, body: { detail: `bad token ${TOKEN}` } });
    expect(error.message).toBe(
      'treg rejected the connection token (401). Check the TregConnection "token".'
    );
    expect(error.statusCode).toBe(401);
  });

  test("mapTregError maps 403 to the refusing gate's code without the body", () => {
    const own = map({
      status: 403,
      headers: tregOwn,
      body: { detail: { error: 'tag_blocked', message: 'customer cust_1 is blocked' } },
    });
    expect(own.message).toBe(`treg refused the call to ${target} (403 tag_blocked).`);
    expect(own.code).toBe('tag_blocked');
    const provider = map({ status: 403, body: { error: 'forbidden', detail: 'ip denied' } });
    expect(provider.message).toBe(`The provider refused the call to ${target} (403).`);
    expect(provider.code).toBeUndefined();
  });

  test("mapTregError maps treg's 409 for a busy idempotency key to a ServiceError", () => {
    const error = map({ status: 409, headers: tregOwn, body: { detail: 'in flight' } });
    expect(error).toBeInstanceOf(ServiceError);
    expect(error.code).toBe('idempotency_in_flight');
    const provider = map({ status: 409 });
    expect(provider).not.toBeInstanceOf(ServiceError);
  });

  test("mapTregError maps treg's own 404 with its detail and a provider 404 without", () => {
    const own = map({
      status: 404,
      headers: tregOwn,
      body: {
        detail: { error: "unknown endpoint 'treg.people.emial.find'", hint: 'did you mean' },
      },
    });
    expect(own.message).toBe(
      `treg answered 404 for ${target}: unknown endpoint 'treg.people.emial.find'`
    );
    expect(own.code).toBeUndefined();
    const provider = map({ status: 404, body: { message: 'no such person' } });
    expect(provider.message).toBe(`The provider answered 404 for ${target}.`);
    expect(provider.statusCode).toBe(404);
  });

  test('mapTregError maps a redirect to a final error', () => {
    const error = map({ status: 301, headers: { location: 'https://elsewhere.example' } });
    expect(error.message).toContain('redirect (301)');
    expect(error.message).not.toContain('elsewhere');
  });

  test('mapTregError redacts the token when treg echoes it in its own detail', () => {
    const error = map({
      status: 400,
      headers: tregOwn,
      body: { detail: `choose an org (send X-Treg-Org) for token ${TOKEN}` },
    });
    expect(error.message).toBe(
      `treg answered 400 for ${target}: choose an org (send X-Treg-Org) for token [redacted]`
    );
  });

  test('mapTregError truncates a long detail', () => {
    const error = map({ status: 400, headers: tregOwn, body: { detail: 'x'.repeat(1000) } });
    expect(error.message.length).toBeLessThan(400);
  });
});
