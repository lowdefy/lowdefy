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

const mockSeedFixtures = jest.fn();
jest.unstable_mockModule('./seedFixtures.js', () => ({ default: mockSeedFixtures }));

const url = 'http://localhost:3229';
const context = { directories: { dev: '/app/.lowdefy/dev' } };
const session = { client: { tag: 'client' } };

function pageTest(overrides = {}) {
  return {
    filePath: '/app/tests/requests/controls.test.yaml',
    test: {
      name: 'lists open controls',
      pageId: 'controls',
      requestId: 'get_controls',
      user: 'admin',
      payload: { status: 'open' },
      expect: [{ title: 'Access reviews' }],
      ...overrides,
    },
  };
}

beforeEach(() => {
  mockPost.mockReset();
  mockSeedFixtures.mockReset();
  mockSeedFixtures.mockResolvedValue();
  mockPost.mockResolvedValue({
    data: {
      refused: false,
      success: true,
      response: [{ title: 'Access reviews', status: 'open' }],
    },
  });
});

test('runRequestTest posts a page request to run-request and passes on a subset match', async () => {
  const { default: runRequestTest } = await import('./runRequestTest.js');
  const result = await runRequestTest({ context, item: pageTest(), url, session });
  expect(mockPost).toHaveBeenCalledWith(`${url}/lowdefy-docs/run-request`, {
    pageId: 'controls',
    requestId: 'get_controls',
    payload: { status: 'open' },
    user: 'admin',
  });
  expect(mockSeedFixtures).not.toHaveBeenCalled();
  expect(result).toEqual({
    name: 'lists open controls',
    filePath: '/app/tests/requests/controls.test.yaml',
    passed: true,
    durationMs: expect.any(Number),
  });
});

test('runRequestTest posts an endpoint test to run-endpoint with an empty default payload', async () => {
  const { default: runRequestTest } = await import('./runRequestTest.js');
  const item = {
    filePath: 'f',
    test: { name: 'creates', endpointId: 'create_control', expect: { schema: { type: 'array' } } },
  };
  const result = await runRequestTest({ context, item, url, session });
  expect(mockPost).toHaveBeenCalledWith(`${url}/lowdefy-docs/run-endpoint`, {
    endpointId: 'create_control',
    payload: {},
    user: undefined,
  });
  expect(result.passed).toBe(true);
});

test('runRequestTest seeds before calling the route and compares ~d dates as Dates', async () => {
  const { default: runRequestTest } = await import('./runRequestTest.js');
  const seed = { controls: [{ _id: 'c1', created_at: { '~d': '2026-01-01T00:00:00.000Z' } }] };
  mockPost.mockResolvedValue({
    data: {
      refused: false,
      success: true,
      response: [{ _id: 'c1', created_at: { '~d': '2026-01-01T00:00:00.000Z' } }],
    },
  });
  const item = pageTest({
    seed,
    expect: [{ created_at: { '~d': '2026-01-01T00:00:00.000Z' } }],
  });
  const result = await runRequestTest({ context, item, url, session });
  expect(mockSeedFixtures).toHaveBeenCalledWith({
    client: session.client,
    devDirectory: '/app/.lowdefy/dev',
    seed,
  });
  expect(mockSeedFixtures.mock.invocationCallOrder[0]).toBeLessThan(
    mockPost.mock.invocationCallOrder[0]
  );
  expect(result.passed).toBe(true);
});

test('runRequestTest fails with the seed error and does not call the route', async () => {
  const { default: runRequestTest } = await import('./runRequestTest.js');
  mockSeedFixtures.mockRejectedValue(
    new Error('Connection "controls" was not found in the build.')
  );
  const result = await runRequestTest({
    context,
    item: pageTest({ seed: { controls: [] } }),
    url,
    session,
  });
  expect(mockPost).not.toHaveBeenCalled();
  expect(result.passed).toBe(false);
  expect(result.message).toEqual('Connection "controls" was not found in the build.');
});

test('runRequestTest fails a mismatch with the path, expected and actual', async () => {
  const { default: runRequestTest } = await import('./runRequestTest.js');
  mockPost.mockResolvedValue({
    data: { refused: false, success: true, response: [{ title: 'Other', status: 'open' }] },
  });
  const result = await runRequestTest({ context, item: pageTest(), url, session });
  expect(result.passed).toBe(false);
  expect(result.mismatch).toEqual({
    matched: false,
    path: '0.title',
    expected: 'Access reviews',
    actual: 'Other',
  });
});

test('runRequestTest fails a refusal with the reason and howToEnable', async () => {
  const { default: runRequestTest } = await import('./runRequestTest.js');
  mockPost.mockResolvedValue({
    data: {
      refused: true,
      reason: 'Api endpoint routines are not classified read-only.',
      howToEnable: 'Set cli.agentTools.allowWriteRequests: true in lowdefy.yaml (dev only).',
    },
  });
  const result = await runRequestTest({ context, item: pageTest(), url, session });
  expect(result.passed).toBe(false);
  expect(result.message).toEqual(
    'Refused: Api endpoint routines are not classified read-only. Set cli.agentTools.allowWriteRequests: true in lowdefy.yaml (dev only).'
  );
});

test('runRequestTest fails a request error returned by the route', async () => {
  const { default: runRequestTest } = await import('./runRequestTest.js');
  mockPost.mockResolvedValue({
    data: { refused: false, error: { name: 'RequestError', message: 'Collection not found.' } },
  });
  const result = await runRequestTest({ context, item: pageTest(), url, session });
  expect(result.passed).toBe(false);
  expect(result.message).toEqual(
    'request controls.get_controls failed. RequestError: Collection not found.'
  );
});

test('runRequestTest fails an endpoint routine that resolved with success false', async () => {
  const { default: runRequestTest } = await import('./runRequestTest.js');
  mockPost.mockResolvedValue({
    data: { refused: false, success: false, error: { message: 'rejected' }, response: null },
  });
  const item = { filePath: 'f', test: { name: 'creates', endpointId: 'create', expect: {} } };
  const result = await runRequestTest({ context, item, url, session });
  expect(result.passed).toBe(false);
  expect(result.message).toEqual('endpoint create failed. Error: rejected');
});

test('runRequestTest fails a routine that resolved with success false and no error', async () => {
  const { default: runRequestTest } = await import('./runRequestTest.js');
  mockPost.mockResolvedValue({
    data: { refused: false, success: false, response: { status: 'rejected' } },
  });
  const item = { filePath: 'f', test: { name: 'creates', endpointId: 'create', expect: {} } };
  const result = await runRequestTest({ context, item, url, session });
  expect(result.passed).toBe(false);
  expect(result.message).toEqual('endpoint create did not succeed. {"status":"rejected"}');
});

test('runRequestTest fails a non-2xx response with the status and body', async () => {
  const { default: runRequestTest } = await import('./runRequestTest.js');
  mockPost.mockRejectedValue({
    message: 'Request failed',
    response: { status: 400, data: { error: 'Unknown dev user "admin".' } },
  });
  const result = await runRequestTest({ context, item: pageTest(), url, session });
  expect(result.message).toEqual(
    'POST /lowdefy-docs/run-request responded 400: {"error":"Unknown dev user \\"admin\\"."}'
  );
});

test('runRequestTest fails an unreachable server', async () => {
  const { default: runRequestTest } = await import('./runRequestTest.js');
  mockPost.mockRejectedValue(new Error('ECONNREFUSED'));
  const result = await runRequestTest({ context, item: pageTest(), url, session });
  expect(result.message).toEqual('Could not reach the dev server: ECONNREFUSED');
});

test('runRequestTest fails an invalid test file without calling the route', async () => {
  const { default: runRequestTest } = await import('./runRequestTest.js');
  const item = { filePath: 'f', test: { name: 'broken', pageId: 'controls', expect: [] } };
  const result = await runRequestTest({ context, item, url, session });
  expect(mockPost).not.toHaveBeenCalled();
  expect(result.passed).toBe(false);
  expect(result.message).toMatch(/^Invalid request test: /);
});

test('runRequestTest fails an unparseable file with its error and the file path as name', async () => {
  const { default: runRequestTest } = await import('./runRequestTest.js');
  const item = { filePath: 'f.test.yaml', test: undefined, error: 'Invalid YAML: bad' };
  const result = await runRequestTest({ context, item, url, session });
  expect(result).toEqual({
    name: 'f.test.yaml',
    filePath: 'f.test.yaml',
    passed: false,
    durationMs: 0,
    message: 'Invalid YAML: bad',
  });
});
