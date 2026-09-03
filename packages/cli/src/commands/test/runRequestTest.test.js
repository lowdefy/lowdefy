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
const context = {
  commandLineOptions: {},
  directories: { config: '/app', dev: '/app/.lowdefy/dev' },
};
const seeded = new Map();
const ObjectId = { tag: 'ObjectId' };
const session = { client: { tag: 'client' }, seeded, ObjectId };

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
    devDirectory: '/app/.lowdefy/test',
    seed,
    fixtures: [],
    seeded,
    ObjectId,
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

test('runRequestTest seeds the named fixtures in list order together with seed before calling the route', async () => {
  const { default: runRequestTest } = await import('./runRequestTest.js');
  const base = { name: 'base', connections: [{ connectionId: 'controls', docs: [{ _id: 'c1' }] }] };
  const orgA = {
    name: 'org-a',
    connections: [{ connectionId: 'controls', docs: [{ _id: 'c2' }] }],
  };
  const seed = { answers: [{ _id: 'a1' }] };
  const fixtureSession = {
    client: session.client,
    seeded,
    ObjectId,
    fixtures: new Map([
      ['base', { fixture: base }],
      ['org-a', { fixture: orgA }],
    ]),
  };
  const result = await runRequestTest({
    context,
    item: pageTest({ fixtures: ['org-a', 'base'], seed }),
    url,
    session: fixtureSession,
  });
  expect(mockSeedFixtures).toHaveBeenCalledWith({
    client: session.client,
    devDirectory: '/app/.lowdefy/test',
    seed,
    fixtures: [orgA, base],
    seeded,
    ObjectId,
  });
  expect(mockSeedFixtures.mock.invocationCallOrder[0]).toBeLessThan(
    mockPost.mock.invocationCallOrder[0]
  );
  expect(result.passed).toBe(true);
});

test('runRequestTest seeds a test with fixtures and no seed', async () => {
  const { default: runRequestTest } = await import('./runRequestTest.js');
  const base = { name: 'base', connections: [{ connectionId: 'controls', docs: [{ _id: 'c1' }] }] };
  const result = await runRequestTest({
    context,
    item: pageTest({ fixtures: ['base'] }),
    url,
    session: {
      client: session.client,
      seeded,
      ObjectId,
      fixtures: new Map([['base', { fixture: base }]]),
    },
  });
  expect(mockSeedFixtures).toHaveBeenCalledWith({
    client: session.client,
    devDirectory: '/app/.lowdefy/test',
    seed: undefined,
    fixtures: [base],
    seeded,
    ObjectId,
  });
  expect(result.passed).toBe(true);
});

test('runRequestTest fails with the fixture load error without seeding or calling the route', async () => {
  const { default: runRequestTest } = await import('./runRequestTest.js');
  const result = await runRequestTest({
    context,
    item: pageTest({ fixtures: ['missing'] }),
    url,
    session: {
      client: session.client,
      fixtures: new Map([
        ['missing', { error: 'Fixture "missing" not found. Expected fixtures/missing.yaml.' }],
      ]),
    },
  });
  expect(mockSeedFixtures).not.toHaveBeenCalled();
  expect(mockPost).not.toHaveBeenCalled();
  expect(result.passed).toBe(false);
  expect(result.message).toEqual('Fixture "missing" not found. Expected fixtures/missing.yaml.');
});

test('runRequestTest fails an invalid fixtures field without calling the route', async () => {
  const { default: runRequestTest } = await import('./runRequestTest.js');
  const result = await runRequestTest({
    context,
    item: pageTest({ fixtures: 'base' }),
    url,
    session,
  });
  expect(mockPost).not.toHaveBeenCalled();
  expect(result.passed).toBe(false);
  expect(result.message).toContain('"fixtures" should be a list of fixture names');
});

test('runRequestTest clears the run before a test that seeds nothing of its own', async () => {
  const { default: runRequestTest } = await import('./runRequestTest.js');
  mockPost.mockResolvedValue({ data: { success: true, response: [] } });
  const result = await runRequestTest({
    context,
    item: pageTest({ expect: [] }),
    url,
    session,
  });
  expect(mockSeedFixtures).toHaveBeenCalledWith({
    client: session.client,
    devDirectory: '/app/.lowdefy/test',
    seed: undefined,
    fixtures: [],
    seeded,
    ObjectId,
  });
  expect(result.passed).toBe(true);
});

test('runRequestTest does not seed when the run has no memory server', async () => {
  const { default: runRequestTest } = await import('./runRequestTest.js');
  mockPost.mockResolvedValue({ data: { success: true, response: [] } });
  await runRequestTest({
    context,
    item: pageTest({ expect: [] }),
    url,
    session: { client: null, fixtures: new Map() },
  });
  expect(mockSeedFixtures).not.toHaveBeenCalled();
});

test('runRequestTest passes an expect.reject when the message contains the string', async () => {
  const { default: runRequestTest } = await import('./runRequestTest.js');
  mockPost.mockResolvedValue({
    data: {
      refused: false,
      error: { name: 'RequestError', message: 'You are not authorized to close this ticket.' },
    },
  });
  const item = pageTest({ expect: { reject: { messageContains: 'not authorized to close' } } });
  const result = await runRequestTest({ context, item, url, session });
  expect(result).toEqual({
    name: 'lists open controls',
    filePath: item.filePath,
    passed: true,
    durationMs: expect.any(Number),
  });
});

test('runRequestTest passes an expect.reject matching the error name', async () => {
  const { default: runRequestTest } = await import('./runRequestTest.js');
  mockPost.mockResolvedValue({
    data: { refused: false, error: { name: 'AuthorizationError', message: 'Refused.' } },
  });
  const item = pageTest({ expect: { reject: { name: 'AuthorizationError' } } });
  expect((await runRequestTest({ context, item, url, session })).passed).toBe(true);
});

test('runRequestTest passes an expect.reject against a refusal by the write gate', async () => {
  const { default: runRequestTest } = await import('./runRequestTest.js');
  mockPost.mockResolvedValue({
    data: { refused: true, reason: 'Api endpoint routines are not classified read-only.' },
  });
  const item = pageTest({ expect: { reject: { messageContains: 'not classified read-only' } } });
  expect((await runRequestTest({ context, item, url, session })).passed).toBe(true);
});

test('runRequestTest fails an expect.reject when the request succeeded', async () => {
  const { default: runRequestTest } = await import('./runRequestTest.js');
  const item = pageTest({ expect: { reject: { messageContains: 'not authorized' } } });
  const result = await runRequestTest({ context, item, url, session });
  expect(result.passed).toBe(false);
  expect(result.message).toEqual(
    'Expected request controls.get_controls to reject, it returned [{"title":"Access reviews","status":"open"}].'
  );
});

test('runRequestTest fails an expect.reject whose message does not match, naming both', async () => {
  const { default: runRequestTest } = await import('./runRequestTest.js');
  mockPost.mockResolvedValue({
    data: { refused: false, error: { name: 'RequestError', message: 'Collection not found.' } },
  });
  const item = pageTest({ expect: { reject: { messageContains: 'not authorized' } } });
  const result = await runRequestTest({ context, item, url, session });
  expect(result.passed).toBe(false);
  expect(result.mismatch).toEqual({
    path: 'reject.messageContains',
    expected: 'not authorized',
    actual: 'Collection not found.',
  });
});

test('runRequestTest fails an expect.reject whose error name does not match', async () => {
  const { default: runRequestTest } = await import('./runRequestTest.js');
  mockPost.mockResolvedValue({
    data: { refused: false, error: { name: 'RequestError', message: 'Refused.' } },
  });
  const item = pageTest({ expect: { reject: { name: 'AuthorizationError' } } });
  const result = await runRequestTest({ context, item, url, session });
  expect(result.mismatch).toEqual({
    path: 'reject.name',
    expected: 'AuthorizationError',
    actual: 'RequestError',
  });
});

test('runRequestTest passes an expect.contains that ignores extra rows', async () => {
  const { default: runRequestTest } = await import('./runRequestTest.js');
  mockPost.mockResolvedValue({
    data: {
      refused: false,
      success: true,
      response: [{ title: 'Access reviews' }, { title: 'Vendor reviews' }],
    },
  });
  const item = pageTest({ expect: { contains: [{ title: 'Vendor reviews' }] } });
  expect((await runRequestTest({ context, item, url, session })).passed).toBe(true);
});

test('runRequestTest rejects a test file with an unknown key before calling the route', async () => {
  const { default: runRequestTest } = await import('./runRequestTest.js');
  const item = pageTest({ request: 'get_controls' });
  const result = await runRequestTest({ context, item, url, session });
  expect(mockPost).not.toHaveBeenCalled();
  expect(result.message).toEqual(
    'Invalid request test: Request test has unknown key "request". Request test keys are: endpointId, expect, fixtures, name, pageId, payload, requestId, seed, user.'
  );
});
