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

import { vi, expect, test } from 'vitest';

vi.doMock('better-auth/api', () => ({
  APIError: class APIError extends Error {
    constructor(status, body) {
      super(body.message);
      this.status = status;
      this.body = body;
    }
  },
}));

const { default: createEmailCodeHolderGate } = await import('./createEmailCodeHolderGate.js');
const { default: sha256Base64Url } = await import('../mobile/sha256Base64Url.js');

const DEVICE_KEY = 'k'.repeat(43);

function createGate(hold) {
  const adapter = { findOne: vi.fn(async () => hold) };
  return {
    adapter,
    gate: createEmailCodeHolderGate({
      getAuth: () => ({ $context: Promise.resolve({ adapter }) }),
    }),
  };
}

function request(headers) {
  return new Request('http://localhost/api/auth/sign-in/email-otp', { headers });
}

const phone = (key) => request({ 'x-lowdefy-shell': '7.1.0', 'x-lowdefy-device-key': key });

test('createEmailCodeHolderGate lets any try through when no phone holds the code', async () => {
  const { adapter, gate } = createGate(null);
  expect(
    await gate({ body: { email: ' Ana@Example.com' }, request: phone(DEVICE_KEY) })
  ).toBeUndefined();
  expect(adapter.findOne.mock.calls[0][0].where[0]).toEqual({
    field: 'identifier',
    value: 'email-code-holder:ana@example.com',
  });
});

test('createEmailCodeHolderGate lets the holding phone try its code', async () => {
  const { gate } = createGate({ value: sha256Base64Url(DEVICE_KEY) });
  expect(
    await gate({ body: { email: 'ana@example.com' }, request: phone(DEVICE_KEY) })
  ).toBeUndefined();
});

test.each([
  ['another phone', phone('o'.repeat(43))],
  ['a phone with no key', request({ 'x-lowdefy-shell': '7.1.0' })],
  [
    'a browser sending the key',
    request({ origin: 'http://localhost', 'x-lowdefy-device-key': DEVICE_KEY }),
  ],
])(
  'createEmailCodeHolderGate refuses %s as a wrong code, before the code counts it',
  async (_, req) => {
    const { gate } = createGate({ value: sha256Base64Url(DEVICE_KEY) });
    await expect(gate({ body: { email: 'ana@example.com' }, request: req })).rejects.toMatchObject({
      status: 'BAD_REQUEST',
      body: { code: 'INVALID_OTP' },
    });
  }
);

test('createEmailCodeHolderGate leaves a body with no email to the route', async () => {
  const { adapter, gate } = createGate(null);
  expect(await gate({ body: {} })).toBeUndefined();
  expect(adapter.findOne).not.toHaveBeenCalled();
});
