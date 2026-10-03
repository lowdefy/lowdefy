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

import { jest } from '@jest/globals';

const mockPost = jest.fn();
jest.unstable_mockModule('axios', () => ({ default: { post: mockPost } }));

const { default: createPostHogQueryClient } = await import('./createPostHogQueryClient.js');
const { default: PullStoppedError } = await import('./PullStoppedError.js');

const KEY = 'phx_secret_key_never_logged_123';

function createLogger() {
  const lines = [];
  const log = (...args) => lines.push(args.map((arg) => String(arg)).join(' '));
  return { lines, logger: { info: log, warn: log, debug: log, error: log } };
}

function response({ status = 200, data = {}, headers = {} }) {
  return { status, data, headers };
}

beforeEach(() => {
  mockPost.mockReset();
});

describe('createPostHogQueryClient', () => {
  function createClient({ sleep = jest.fn(async () => {}) } = {}) {
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
    mockPost.mockResolvedValueOnce(
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
    const [url, body, config] = mockPost.mock.calls[0];
    expect(url).toBe('https://eu.posthog.com/api/projects/300001/query/');
    expect(body).toEqual({
      query: {
        kind: 'HogQLQuery',
        query: 'SELECT 1',
        values: { a: 1 },
        filters: { filterTestAccounts: true },
      },
      name: 'lowdefy journeys pull',
    });
    expect(config.headers.Authorization).toBe(`Bearer ${KEY}`);
  });

  test('client waits a short Retry-After and retries', async () => {
    mockPost
      .mockResolvedValueOnce(response({ status: 429, headers: { 'retry-after': '3' } }))
      .mockResolvedValueOnce(response({ data: { results: [], columns: [] } }));
    const { client, sleep, lines } = createClient();
    await client.query({ query: 'SELECT 1', values: {}, filterTestAccounts: true });
    expect(sleep).toHaveBeenCalledWith(3000);
    expect(mockPost).toHaveBeenCalledTimes(2);
    expect(lines.join('\n')).not.toContain(KEY);
  });

  test('client stops on a long Retry-After with when to rerun', async () => {
    mockPost.mockResolvedValueOnce(response({ status: 429, headers: { 'retry-after': '600' } }));
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
    mockPost.mockResolvedValueOnce(
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
    mockPost.mockResolvedValueOnce(
      response({ status: 401, data: { detail: 'Invalid personal API key.' } })
    );
    const { client } = createClient();
    const error = await client
      .query({ query: 'SELECT 1', values: {}, filterTestAccounts: true })
      .catch((caught) => caught);
    expect(error.message).toContain('Query Read');
    expect(error.message).not.toContain(KEY);
  });

  test('client drops the request config, and so the key, from a network error', async () => {
    const networkError = new Error('getaddrinfo ENOTFOUND eu.posthog.com');
    networkError.config = { headers: { Authorization: `Bearer ${KEY}` } };
    mockPost.mockRejectedValueOnce(networkError);
    const { client } = createClient();
    const error = await client
      .query({ query: 'SELECT 1', values: {}, filterTestAccounts: true })
      .catch((caught) => caught);
    expect(error.message).toContain('ENOTFOUND');
    expect(JSON.stringify(error)).not.toContain(KEY);
    expect(error.config).toBeUndefined();
    expect(error.cause).toBeUndefined();
  });
});
