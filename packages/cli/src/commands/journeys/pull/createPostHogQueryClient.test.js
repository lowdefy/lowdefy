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

import { vi, beforeEach, describe, expect, test } from 'vitest';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const { default: createPostHogQueryClient } = await import('./createPostHogQueryClient.js');
const { default: PullStoppedError } = await import('./PullStoppedError.js');

const KEY = 'phx_secret_key_never_logged_123';

function createLogger() {
  const lines = [];
  const log = (...args) => lines.push(args.map((arg) => String(arg)).join(' '));
  return { lines, logger: { info: log, warn: log, debug: log, error: log } };
}

function response({ status = 200, data = {}, headers = {} }) {
  return new Response(JSON.stringify(data), { status, headers });
}

beforeEach(() => {
  mockFetch.mockReset();
});

describe('createPostHogQueryClient', () => {
  function createClient({ sleep = vi.fn(async () => {}) } = {}) {
    const { lines, logger } = createLogger();
    const client = createPostHogQueryClient({
      projectId: '300001',
      apiHost: 'https://eu.posthog.com',
      apiKey: KEY,
      logger,
      sleep,
    });
    return { client, lines, sleep };
  }

  test('client posts a HogQL query with the bearer key and reads bytes from the header', async () => {
    mockFetch.mockResolvedValueOnce(
      response({
        data: { results: [[1]], columns: ['total'] },
        headers: { 'x-posthog-query-bytes-read': '2048' },
      })
    );
    const { client } = createClient();
    const result = await client.query({
      query: 'SELECT 1',
      values: { a: 1 },
      filterTestAccounts: true,
    });
    expect(result).toEqual({ results: [[1]], columns: ['total'], bytesRead: 2048 });
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe('https://eu.posthog.com/api/projects/300001/query/');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({
      query: {
        kind: 'HogQLQuery',
        query: 'SELECT 1',
        values: { a: 1 },
        filters: { filterTestAccounts: true },
      },
      name: 'lowdefy journeys pull',
    });
    expect(init.headers.Authorization).toBe(`Bearer ${KEY}`);
  });

  test('client waits a short Retry-After and retries', async () => {
    mockFetch
      .mockResolvedValueOnce(response({ status: 429, headers: { 'retry-after': '3' } }))
      .mockResolvedValueOnce(response({ data: { results: [], columns: [] } }));
    const { client, sleep, lines } = createClient();
    await client.query({ query: 'SELECT 1', values: {}, filterTestAccounts: true });
    expect(sleep).toHaveBeenCalledWith(3000);
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(lines.join('\n')).not.toContain(KEY);
  });

  test('client reads a Retry-After given as an HTTP date', async () => {
    const retryAt = new Date(Date.now() + 2000).toUTCString();
    mockFetch
      .mockResolvedValueOnce(response({ status: 429, headers: { 'retry-after': retryAt } }))
      .mockResolvedValueOnce(response({ data: { results: [], columns: [] } }));
    const { client, sleep } = createClient();
    await client.query({ query: 'SELECT 1', values: {}, filterTestAccounts: true });
    expect(sleep).toHaveBeenCalledTimes(1);
    expect(sleep.mock.calls[0][0]).toBeLessThanOrEqual(3000);
  });

  test('client reads the wait from the throttle message when Retry-After is missing', async () => {
    mockFetch
      .mockResolvedValueOnce(
        response({ status: 429, data: { detail: 'Expected available in 7 seconds.' } })
      )
      .mockResolvedValueOnce(response({ data: { results: [], columns: [] } }));
    const { client, sleep } = createClient();
    await client.query({ query: 'SELECT 1', values: {}, filterTestAccounts: true });
    expect(sleep).toHaveBeenCalledWith(7000);
  });

  test('client stops on a long Retry-After with when to rerun', async () => {
    mockFetch.mockResolvedValueOnce(response({ status: 429, headers: { 'retry-after': '600' } }));
    const { client, sleep } = createClient();
    const error = await client
      .query({ query: 'SELECT 1', values: {}, filterTestAccounts: true })
      .catch((caught) => caught);
    expect(error).toBeInstanceOf(PullStoppedError);
    expect(error.reason).toBe('rate_limit');
    expect(error.message).toContain('run the pull again after');
    expect(error.retryAt).toBeInstanceOf(Date);
    expect(sleep).not.toHaveBeenCalled();
  });

  test('client reports api_queries_budget_exceeded as the hourly read budget', async () => {
    mockFetch.mockResolvedValueOnce(
      response({
        status: 429,
        headers: { 'retry-after': '1800' },
        data: { type: 'throttled_error', code: 'api_queries_budget_exceeded' },
      })
    );
    const { client } = createClient();
    const error = await client
      .query({ query: 'SELECT 1', values: {}, filterTestAccounts: true })
      .catch((caught) => caught);
    expect(error.reason).toBe('read_budget');
    expect(error.message).toContain('hourly query read budget');
  });

  test('client names the scope and host on a 401, without the key', async () => {
    mockFetch.mockResolvedValueOnce(
      response({ status: 401, data: { detail: 'Invalid personal API key.' } })
    );
    const { client } = createClient();
    const error = await client
      .query({ query: 'SELECT 1', values: {}, filterTestAccounts: true })
      .catch((caught) => caught);
    expect(error.message).toContain('Query Read');
    expect(error.message).not.toContain(KEY);
  });

  test('client keeps only the message, and so never the key, from a network error', async () => {
    const networkError = new TypeError('fetch failed', {
      cause: new Error('getaddrinfo ENOTFOUND eu.posthog.com'),
    });
    networkError.request = { headers: { Authorization: `Bearer ${KEY}` } };
    mockFetch.mockRejectedValueOnce(networkError);
    const { client } = createClient();
    const error = await client
      .query({ query: 'SELECT 1', values: {}, filterTestAccounts: true })
      .catch((caught) => caught);
    expect(error.message).toContain('ENOTFOUND');
    expect(JSON.stringify(error)).not.toContain(KEY);
    expect(error.request).toBeUndefined();
    expect(error.cause).toBeUndefined();
  });
});
