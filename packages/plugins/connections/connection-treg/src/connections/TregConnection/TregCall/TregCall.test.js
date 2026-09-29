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
import { validate } from '@lowdefy/ajv';

import startMockTreg from '../../../test/startMockTreg.js';
import TregCall from './TregCall.js';

const TOKEN = 'tok_live_5ecret_value';
const { schema } = TregCall;

let mock;
let connection;

beforeEach(async () => {
  mock = await startMockTreg(() => ({ status: 200, body: {} }));
  connection = { token: TOKEN, baseUrl: mock.baseUrl };
});

afterEach(async () => {
  await mock.close();
});

async function callError(request, conn = connection) {
  try {
    await TregCall({ request, connection: conn });
  } catch (error) {
    return error;
  }
  throw new Error('TregCall did not throw.');
}

function expectNoToken(error) {
  const text = [error.message, error.cause?.message].join(' ');
  expect(text).not.toContain(TOKEN);
}

const routedHit = {
  status: 200,
  headers: {
    'x-treg-cost-micro': '4000',
    'x-treg-call-id': 'call_abc',
    'x-treg-served-by': 'hunter.people.email.find',
    'x-treg-providers-tried': 'icypeas,hunter',
    'x-treg-route-outcome': 'hit',
  },
  body: {
    output: { email: 'ada@example.com', verified: false },
    raw: { data: { email: 'ada@example.com', score: 91 } },
    _treg: {
      served_by: 'hunter.people.email.find',
      provider: 'hunter',
      outcome: 'hit',
      tried: [
        { endpoint_id: 'icypeas.people.email.find', outcome: 'miss', charged_micro: 0 },
        { endpoint_id: 'hunter.people.email.find', outcome: 'hit', charged_micro: 4000 },
      ],
      charged_micro: 4000,
    },
  },
};

describe('headers and request shape', () => {
  test('TregCall sends the token, team, idempotency key, cost ceiling, tags, cache and route headers', async () => {
    mock.setHandler(() => routedHit);
    await TregCall({
      connection: { ...connection, org: 'acme', maxCost: 0.5, meta: { app: 'crm', env: 'prod' } },
      request: {
        endpoint: 'treg.people.email.find',
        body: { full_name: 'Ada Lovelace', domain: 'example.com' },
        idempotencyKey: 'claim_123',
        maxCost: 0.05,
        maxAge: 3600,
        noCache: true,
        waterfall: false,
        strictFilters: true,
        meta: { customer: 'cust_8123', env: 'staging' },
      },
    });
    expect(mock.requests).toHaveLength(1);
    const [sent] = mock.requests;
    expect(sent.method).toBe('POST');
    expect(sent.path).toBe('/call/treg.people.email.find');
    expect(sent.body).toEqual({ full_name: 'Ada Lovelace', domain: 'example.com' });
    expect(sent.headers['x-treg-token']).toBe(TOKEN);
    expect(sent.headers['x-treg-org']).toBe('acme');
    expect(sent.headers['idempotency-key']).toBe('claim_123');
    expect(sent.headers['x-treg-route-max-cost']).toBe('0.05');
    expect(sent.headers['x-treg-meta']).toBe('app=crm, env=staging, customer=cust_8123');
    expect(sent.headers['x-treg-max-age']).toBe('3600');
    expect(sent.headers['cache-control']).toBe('no-cache');
    expect(sent.headers['x-treg-route-waterfall']).toBe('0');
    expect(sent.headers['x-treg-route-strict-filters']).toBe('1');
    expect(sent.headers['content-type']).toBe('application/json');
  });

  test('TregCall sends only the token when no optional property is set, and GETs without a body', async () => {
    await TregCall({
      connection,
      request: { endpoint: 'tikhub.tiktok.user.profile', query: { uniqueId: 'tiktok' } },
    });
    const [sent] = mock.requests;
    expect(sent.method).toBe('GET');
    expect(sent.path).toBe('/call/tikhub.tiktok.user.profile');
    expect(sent.query).toEqual({ uniqueId: 'tiktok' });
    expect(sent.body).toBeUndefined();
    expect(sent.headers['x-treg-token']).toBe(TOKEN);
    [
      'x-treg-org',
      'idempotency-key',
      'x-treg-route-max-cost',
      'x-treg-meta',
      'x-treg-max-age',
      'cache-control',
      'x-treg-route-waterfall',
      'x-treg-route-strict-filters',
      'content-type',
    ].forEach((name) => expect(sent.headers[name]).toBeUndefined());
  });

  test('TregCall uses the connection maxCost when the request sets none, and sends waterfall true as 1', async () => {
    await TregCall({
      connection: { ...connection, maxCost: 1 },
      request: { endpoint: 'treg.people.email.find', body: {}, waterfall: true },
    });
    expect(mock.requests[0].headers['x-treg-route-max-cost']).toBe('1');
    expect(mock.requests[0].headers['x-treg-route-waterfall']).toBe('1');
  });

  test('TregCall sends an explicit method, and array query values once per item', async () => {
    await TregCall({
      connection,
      request: {
        endpoint: 'dataforseo.keywords.volume',
        method: 'PUT',
        query: { keyword: ['a', 'b'], limit: 5, skip: null },
      },
    });
    expect(mock.requests[0].method).toBe('PUT');
    expect(mock.requests[0].searchParams.getAll('keyword')).toEqual(['a', 'b']);
    expect(mock.requests[0].query.limit).toBe('5');
    expect(mock.requests[0].query.skip).toBeUndefined();
  });

  test('TregCall treats a null body as no body', async () => {
    await TregCall({ connection, request: { endpoint: 'a.b.c', body: null } });
    expect(mock.requests[0].method).toBe('GET');
    expect(mock.requests[0].body).toBeUndefined();
  });

  test('TregCall keeps a baseUrl path prefix and ignores a trailing slash', async () => {
    await TregCall({
      connection: { ...connection, baseUrl: `${mock.baseUrl}/treg/` },
      request: { endpoint: 'a.b.c' },
    });
    expect(mock.requests[0].path).toBe('/treg/call/a.b.c');
  });
});

describe('endpoint and custom tool validation', () => {
  test('TregCall schema accepts a catalog endpoint id', () => {
    expect(validate({ schema, data: { endpoint: 'treg.people.email.find' } })).toEqual({
      valid: true,
    });
  });

  test.each([
    ['the upstream-URL form', 'https://api.stripe.com/v1/charges'],
    ['a path', 'stripe/v1/charges'],
    ['a parent segment', '../orgs'],
    ['uppercase', 'Treg.people'],
    ['a leading dot', '.people'],
    ['an empty id', ''],
  ])('TregCall schema refuses %s as endpoint', (_, endpoint) => {
    expect(() => validate({ schema, data: { endpoint } })).toThrow(
      'TregCall request property "endpoint" should be a treg endpoint id'
    );
  });

  test('TregCall refuses the upstream-URL form at runtime and sends nothing', async () => {
    const error = await callError({ endpoint: 'https://api.stripe.com/v1/charges' });
    expect(error.message).toContain('Upstream URLs are not accepted');
    expect(mock.requests).toHaveLength(0);
  });

  test('TregCall schema needs either endpoint, or tool and path', () => {
    expect(() => validate({ schema, data: {} })).toThrow(
      'TregCall request should have either "endpoint", or "tool" and "path".'
    );
    expect(() => validate({ schema, data: { endpoint: 'a.b', tool: 'stripe' } })).toThrow(
      'TregCall request should have either "endpoint", or "tool" and "path".'
    );
    expect(() => validate({ schema, data: { tool: 'stripe' } })).toThrow(
      'TregCall request should have either "endpoint", or "tool" and "path".'
    );
    expect(validate({ schema, data: { tool: 'stripe', path: '/v1/charges' } })).toEqual({
      valid: true,
    });
  });

  test('TregCall schema refuses a GET with a body', () => {
    expect(() => validate({ schema, data: { endpoint: 'a.b', method: 'GET', body: {} } })).toThrow(
      'TregCall request with method GET should not have a body. Leave method out to POST the body.'
    );
    expect(validate({ schema, data: { endpoint: 'a.b', method: 'POST', body: {} } })).toEqual({
      valid: true,
    });
  });

  test('TregCall schema refuses unknown properties', () => {
    expect(() => validate({ schema, data: { endpoint: 'a.b', url: 'https://x' } })).toThrow(
      'TregCall request should only have'
    );
  });

  test('TregCall refuses a custom tool when the connection does not allow custom tools', async () => {
    const error = await callError({ tool: 'stripe', path: '/v1/charges' });
    expect(error.message).toBe(
      'TregCall can only call a custom tool when the connection sets "allowCustomTools: true".'
    );
    expect(mock.requests).toHaveLength(0);
  });

  test('TregCall calls a custom tool by name and path when the connection allows custom tools', async () => {
    mock.setHandler(() => ({ status: 200, body: { object: 'list', data: [] } }));
    const result = await TregCall({
      connection: { ...connection, allowCustomTools: true },
      request: { tool: 'stripe', path: '/v1/charges', query: { limit: 1 } },
    });
    expect(mock.requests[0].path).toBe('/call/stripe/v1/charges');
    expect(mock.requests[0].query).toEqual({ limit: '1' });
    expect(result.output).toEqual({ object: 'list', data: [] });
    expect(result.cost).toEqual({ micro: 0, usd: 0 });
  });

  test.each([
    ['a scheme', 'https://evil.example/steal'],
    ['a network path', '//evil.example/steal'],
    ['a parent segment', '/v1/../../orgs'],
    ['an encoded parent segment', '/v1/%2e%2e/orgs'],
    ['a dot segment', '/./v1'],
    ['a query', '/v1/charges?limit=1'],
    ['a backslash', '/v1\\..\\orgs'],
    ['a malformed escape', '/v1/%zz'],
  ])('TregCall refuses a custom tool path with %s', async (_, path) => {
    const error = await callError(
      { tool: 'stripe', path },
      { ...connection, allowCustomTools: true }
    );
    expect(error.message).toContain('TregCall "path" should be a path on the tool\'s API');
    expect(mock.requests).toHaveLength(0);
  });

  test('TregCall refuses a tool name that is not a name', async () => {
    const error = await callError(
      { tool: 'https://evil.example', path: '/x' },
      { ...connection, allowCustomTools: true }
    );
    expect(error.message).toContain('TregCall "tool" should be a tool name');
    expect(mock.requests).toHaveLength(0);
  });
});

describe('response mapping', () => {
  test('TregCall maps a routed answer to output, raw, cost, call id, served by and tried', async () => {
    mock.setHandler(() => routedHit);
    const result = await TregCall({
      connection,
      request: { endpoint: 'treg.people.email.find', body: { full_name: 'Ada', domain: 'x.io' } },
    });
    expect(result).toEqual({
      output: { email: 'ada@example.com', verified: false },
      raw: { data: { email: 'ada@example.com', score: 91 } },
      cost: { micro: 4000, usd: 0.004 },
      callId: 'call_abc',
      servedBy: 'hunter.people.email.find',
      tried: routedHit.body._treg.tried,
      outcome: 'hit',
      cached: false,
      replayed: false,
      pending: false,
      task: null,
      httpStatus: 200,
    });
  });

  test('TregCall maps a routed miss to a null output with outcome miss', async () => {
    mock.setHandler(() => ({
      status: 200,
      headers: { 'x-treg-route-outcome': 'miss', 'x-treg-cost-micro': '0' },
      body: {
        output: { email: null },
        raw: null,
        _treg: { served_by: null, outcome: 'miss', tried: [], charged_micro: 0 },
      },
    }));
    const result = await TregCall({
      connection,
      request: { endpoint: 'treg.people.email.find', body: {} },
    });
    expect(result.output).toEqual({ email: null });
    expect(result.raw).toBeNull();
    expect(result.outcome).toBe('miss');
    expect(result.servedBy).toBeNull();
    expect(result.cost).toEqual({ micro: 0, usd: 0 });
  });

  test('TregCall maps a catalog answer to the provider body, without _treg, as output', async () => {
    const body = { uniqueId: 'tiktok', followers: 10, _treg: { hint: 'review this call' } };
    mock.setHandler(() => ({
      status: 200,
      headers: { 'x-treg-cost-micro': '1000', 'x-treg-call-id': 'call_1', 'x-treg-cache': 'hit' },
      body,
    }));
    const result = await TregCall({
      connection,
      request: { endpoint: 'tikhub.tiktok.user.profile', query: { uniqueId: 'tiktok' } },
    });
    expect(result.output).toEqual({ uniqueId: 'tiktok', followers: 10 });
    expect(result.raw).toEqual(body);
    expect(result.cost).toEqual({ micro: 1000, usd: 0.001 });
    expect(result.cached).toBe(true);
    expect(result.servedBy).toBeNull();
    expect(result.tried).toEqual([]);
    expect(result.outcome).toBeNull();
  });

  test('TregCall returns a text provider body as output', async () => {
    mock.setHandler(() => ({ status: 200, headers: { 'content-type': 'text/plain' }, body: 'ok' }));
    const result = await TregCall({ connection, request: { endpoint: 'a.b.c' } });
    expect(result.output).toBe('ok');
    expect(result.raw).toBe('ok');
  });

  test('TregCall reports an idempotent replay with the zero cost treg sends, never the original cost', async () => {
    mock.setHandler(() => ({
      ...routedHit,
      headers: {
        ...routedHit.headers,
        'x-treg-cost-micro': '0',
        'x-treg-original-cost-micro': '4000',
        'x-treg-idempotent-replay': 'true',
      },
    }));
    const result = await TregCall({
      connection,
      request: { endpoint: 'treg.people.email.find', body: {}, idempotencyKey: 'k1' },
    });
    expect(result.replayed).toBe(true);
    expect(result.cost).toEqual({ micro: 0, usd: 0 });
  });

  test('TregCall reads the cost from X-Treg-Cost-Micro only, not from the body', async () => {
    mock.setHandler(() => ({
      status: 200,
      headers: { 'x-treg-route-outcome': 'hit' },
      body: { output: {}, raw: {}, _treg: { charged_micro: 9999 } },
    }));
    const result = await TregCall({
      connection,
      request: { endpoint: 'treg.people.email.find', body: {} },
    });
    expect(result.cost).toEqual({ micro: 0, usd: 0 });
  });
});

describe('errors', () => {
  test('TregCall throws the balance error for a 402 and never sends the top-up link or the token in the message', async () => {
    mock.setHandler(() => ({
      status: 402,
      headers: { 'x-treg-error': '1', 'x-treg-call-id': 'call_402' },
      body: {
        detail: {
          error: 'insufficient_balance',
          message: 'add funds: https://treg.to/app#billing',
          balance_micro: 0,
          estimated_cost_micro: 4000,
          topup_url: '/app#billing',
        },
      },
    }));
    const error = await callError({ endpoint: 'treg.people.email.find', body: {} });
    expect(error.message).toBe('treg balance too low: needs ~$0.004, has $0.');
    expect(error.message).not.toContain('billing');
    expect(error.cause.message).toContain(`${mock.baseUrl}/app#billing`);
    expect(ServiceError.isServiceError(error)).toBe(false);
    expectNoToken(error);
  });

  test('TregCall throws a ServiceError with retryAfter for a 503 capacity refusal', async () => {
    mock.setHandler(() => ({
      status: 503,
      headers: { 'x-treg-error': '1', 'retry-after': '60' },
      body: { detail: { error: 'provider_capacity_unavailable', provider: 'hunter' } },
    }));
    const error = await callError({ endpoint: 'treg.people.email.find', body: {} });
    expect(error).toBeInstanceOf(ServiceError);
    expect(error.retryAfter).toBe(60);
    expectNoToken(error);
  });

  test("TregCall throws a ConfigError with treg's detail for a 422", async () => {
    mock.setHandler(() => ({
      status: 422,
      headers: { 'x-treg-error': '1' },
      body: { detail: 'Idempotency-Key was already used for a different request' },
    }));
    const error = await callError({ endpoint: 'a.b', idempotencyKey: 'k' });
    expect(error).toBeInstanceOf(ConfigError);
    expect(error.message).toContain('Idempotency-Key was already used for a different request');
  });

  test('TregCall never puts the token in an error, even when an answer echoes it', async () => {
    mock.setHandler((req) => ({
      status: 400,
      headers: { 'x-treg-error': '1' },
      body: { detail: `bad header ${req.headers['x-treg-token']}` },
    }));
    const error = await callError({ endpoint: 'a.b' });
    expect(error.message).toContain('[redacted]');
    expectNoToken(error);
  });
});
