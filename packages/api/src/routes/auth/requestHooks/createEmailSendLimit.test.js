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

jest.unstable_mockModule('better-auth/api', () => ({
  APIError: class APIError extends Error {
    constructor(status, body) {
      super(body.message);
      this.status = status;
    }
  },
}));

const { default: createEmailSendLimit } = await import('./createEmailSendLimit.js');

function createAuth({ sent }) {
  const adapter = {
    deleteMany: jest.fn(async () => 0),
    count: jest.fn(async () => sent),
    create: jest.fn(async ({ data }) => data),
  };
  return { adapter, auth: { $context: Promise.resolve({ adapter }) } };
}

test('createEmailSendLimit records a send under the address and lets it through', async () => {
  const { adapter, auth } = createAuth({ sent: 4 });
  const limit = createEmailSendLimit({ getAuth: () => auth, max: 5, windowSeconds: 900 });
  expect(await limit({ body: { email: ' Ana@Example.com ' } })).toBeUndefined();
  expect(adapter.deleteMany).toHaveBeenCalledWith({
    model: 'verification',
    where: [
      { field: 'identifier', value: 'email-send-limit:ana@example.com' },
      { field: 'expiresAt', operator: 'lt', value: expect.any(Date) },
    ],
  });
  const { data } = adapter.create.mock.calls[0][0];
  expect(data.identifier).toBe('email-send-limit:ana@example.com');
  expect(data.expiresAt.getTime() - data.createdAt.getTime()).toBe(900 * 1000);
});

test('createEmailSendLimit refuses a send past the cap and records nothing', async () => {
  const { adapter, auth } = createAuth({ sent: 5 });
  const limit = createEmailSendLimit({ getAuth: () => auth, max: 5, windowSeconds: 900 });
  await expect(limit({ body: { email: 'ana@example.com' } })).rejects.toMatchObject({
    status: 'TOO_MANY_REQUESTS',
  });
  expect(adapter.create).not.toHaveBeenCalled();
});

test('createEmailSendLimit leaves a body with no email to the route', async () => {
  const getAuth = jest.fn();
  const limit = createEmailSendLimit({ getAuth, max: 5, windowSeconds: 900 });
  expect(await limit({ body: {} })).toBeUndefined();
  expect(getAuth).not.toHaveBeenCalled();
});
