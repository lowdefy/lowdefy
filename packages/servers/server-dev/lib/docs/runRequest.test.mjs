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

// runRequest reads build artifacts, builds a Lowdefy context and calls
// callRequest - all three only exist in a running server directory, so mock
// them and leave only runRequest's own validation and pass-through under test.
const mockCallRequest = jest.fn();
const mockReadBuildArtifact = jest.fn();
const mockIsWriteRequestsAllowed = jest.fn();
const mockCreateLowdefyContext = jest.fn();
const mockLoggerInfo = jest.fn();

jest.unstable_mockModule('@lowdefy/api', () => ({
  callRequest: mockCallRequest,
}));
jest.unstable_mockModule('./readBuildArtifact.js', () => ({
  default: mockReadBuildArtifact,
}));
jest.unstable_mockModule('./isWriteRequestsAllowed.js', () => ({
  default: mockIsWriteRequestsAllowed,
}));
jest.unstable_mockModule('../server/createLowdefyContext.js', () => ({
  default: mockCreateLowdefyContext,
}));
const mockBuildPageIfNeeded = jest.fn();
jest.unstable_mockModule('../server/jitPageBuilder.js', () => ({
  default: mockBuildPageIfNeeded,
}));
const mockReviewPage = jest.fn();
jest.unstable_mockModule('./reviewPage.js', () => ({
  default: mockReviewPage,
  createModifiedAt: () => () => null,
}));

const { ConfigError } = await import('@lowdefy/errors');
const { default: runRequest } = await import('./runRequest.js');

const honoContext = { req: { path: '/lowdefy-docs/run-request' } };

beforeEach(() => {
  jest.clearAllMocks();
  mockReadBuildArtifact.mockImplementation(({ name }) => {
    if (name === 'plugins/requestSchemas.json') {
      return { MongoDBFind: { meta: { checkRead: true, checkWrite: false } } };
    }
    if (name === 'pageRegistry.json') {
      return { home: { pageId: 'home', refPath: 'pages/home.yaml' }, other: { pageId: 'other' } };
    }
    return { type: 'MongoDBFind' };
  });
  mockIsWriteRequestsAllowed.mockResolvedValue(false);
  mockCreateLowdefyContext.mockResolvedValue({ logger: { info: mockLoggerInfo } });
  mockCallRequest.mockResolvedValue({ id: 'requests', response: [{ _id: 1 }] });
  mockBuildPageIfNeeded.mockResolvedValue(true);
  mockReviewPage.mockReturnValue('current');
});

test('runRequest passes a user object to createLowdefyContext', async () => {
  const user = { roles: ['admin'], organization_id: 'org_1' };

  const result = await runRequest({
    pageId: 'home',
    requestId: 'get_rows',
    user,
    honoContext,
  });

  expect(mockCreateLowdefyContext).toHaveBeenCalledWith({ c: honoContext, user });
  expect(result.refused).toBe(false);
  expect(result.response).toEqual([{ _id: 1 }]);
});

test('runRequest logs the user it ran the request as', async () => {
  const user = { roles: ['admin'] };

  await runRequest({ pageId: 'home', requestId: 'get_rows', user, honoContext });

  expect(mockLoggerInfo).toHaveBeenCalledWith({
    event: 'agent_run_request',
    pageId: 'home',
    requestId: 'get_rows',
    user,
  });
});

test('runRequest throws a ConfigError when user is not an object', async () => {
  await expect(
    runRequest({ pageId: 'home', requestId: 'get_rows', user: 'admin', honoContext })
  ).rejects.toThrow(ConfigError);
  await expect(
    runRequest({ pageId: 'home', requestId: 'get_rows', user: ['admin'], honoContext })
  ).rejects.toThrow(/run_request "user" must be an object/);
  expect(mockCreateLowdefyContext).not.toHaveBeenCalled();
});

test('runRequest builds a context with an undefined user when user is omitted', async () => {
  const result = await runRequest({ pageId: 'home', requestId: 'get_rows', honoContext });

  expect(mockCreateLowdefyContext).toHaveBeenCalledWith({ c: honoContext, user: undefined });
  expect(mockLoggerInfo).toHaveBeenCalledWith({
    event: 'agent_run_request',
    pageId: 'home',
    requestId: 'get_rows',
    user: undefined,
  });
  expect(result).toEqual({ refused: false, id: 'requests', response: [{ _id: 1 }] });
});

test('runRequest refuses a write request for an impersonated caller too', async () => {
  mockReadBuildArtifact.mockImplementation(({ name }) => {
    if (name === 'plugins/requestSchemas.json') {
      return { MongoDBInsertOne: { meta: { checkWrite: true } } };
    }
    return { type: 'MongoDBInsertOne' };
  });

  const result = await runRequest({
    pageId: 'home',
    requestId: 'insert_row',
    user: { roles: ['admin'] },
    honoContext,
  });

  expect(result.refused).toBe(true);
  expect(mockCreateLowdefyContext).not.toHaveBeenCalled();
});

test('runRequest notes stale config when the page changed but the dev server has not rebuilt it', async () => {
  mockReviewPage.mockReturnValue('edited');

  const result = await runRequest({ pageId: 'home', requestId: 'get_rows', honoContext });

  expect(result.response).toEqual([{ _id: 1 }]);
  expect(result.staleConfig).toContain('has not rebuilt it yet');
});

test('runRequest does not note stale config for a page that is current', async () => {
  const result = await runRequest({ pageId: 'home', requestId: 'get_rows', honoContext });

  expect(result.staleConfig).toBeUndefined();
});

test('runRequest throws a ConfigError when saveResponse is not a boolean', async () => {
  await expect(
    runRequest({ pageId: 'home', requestId: 'get_rows', saveResponse: 1, honoContext })
  ).rejects.toThrow(ConfigError);
  expect(mockBuildPageIfNeeded).not.toHaveBeenCalled();
});

test('runRequest notes stale config on a request that fails', async () => {
  mockReviewPage.mockReturnValue('edited');
  mockCallRequest.mockRejectedValue(new Error('connect ECONNREFUSED'));

  const result = await runRequest({ pageId: 'home', requestId: 'get_rows', honoContext });

  expect(result.error.message).toBe('connect ECONNREFUSED');
  expect(result.staleConfig).toContain('ran the previous config');
});

test('runRequest reviews only the page it ran', async () => {
  await runRequest({ pageId: 'home', requestId: 'get_rows', honoContext });

  expect(mockReviewPage).toHaveBeenCalledTimes(1);
  expect(mockReviewPage).toHaveBeenCalledWith(
    expect.objectContaining({
      pageId: 'home',
      entry: { pageId: 'home', refPath: 'pages/home.yaml' },
    })
  );
});
