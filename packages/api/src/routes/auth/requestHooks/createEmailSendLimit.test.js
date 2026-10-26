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
    }
  },
}));

const { default: createEmailSendLimit } = await import('./createEmailSendLimit.js');
const { default: sha256Base64Url } = await import('../mobile/sha256Base64Url.js');

const DEVICE_KEY = 'k'.repeat(43);
const OTHER_KEY = 'o'.repeat(43);

function matches(record, where) {
  return where.every(({ field, operator, value }) => {
    if (operator === 'lt') return record[field] < value;
    if (operator === 'gt') return record[field] > value;
    return record[field] === value;
  });
}

// The verification table in memory. Every call waits a turn first, so parallel sends interleave
// the way they do against a database.
function createAuth() {
  const records = [];
  let nextId = 0;
  const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
  const adapter = {
    records,
    async create({ data }) {
      await tick();
      const record = { ...data, id: String((nextId += 1)) };
      records.push(record);
      return record;
    },
    async count({ where }) {
      await tick();
      return records.filter((record) => matches(record, where)).length;
    },
    async delete({ where }) {
      await tick();
      const index = records.findIndex((record) => matches(record, where));
      if (index !== -1) records.splice(index, 1);
    },
    async findOne({ where }) {
      await tick();
      return records.find((record) => matches(record, where)) ?? null;
    },
    async update({ where, update }) {
      await tick();
      const record = records.find((each) => matches(each, where));
      Object.assign(record, update);
      return record;
    },
    async deleteMany({ where }) {
      await tick();
      const keep = records.filter((record) => !matches(record, where));
      records.splice(0, records.length, ...keep);
    },
  };
  return { adapter, auth: { $context: Promise.resolve({ adapter }) } };
}

function nativeRequest(key) {
  const headers = { 'x-lowdefy-shell': '7.1.0' };
  if (key !== undefined) headers['x-lowdefy-device-key'] = key;
  return new Request('http://localhost/api/auth/email-otp/send-verification-otp', { headers });
}

function browserRequest(key) {
  return new Request('http://localhost/api/auth/email-otp/send-verification-otp', {
    headers: {
      origin: 'http://localhost',
      'x-lowdefy-shell': '7.1.0',
      'x-lowdefy-device-key': key,
    },
  });
}

function identifiers(adapter) {
  return adapter.records.map(({ identifier }) => identifier);
}

function addRecords({ adapter, identifier, count, expiresAt = new Date(Date.now() + 60000) }) {
  for (let index = 0; index < count; index += 1) {
    adapter.records.push({ id: `seed-${identifier}-${index}`, identifier, expiresAt });
  }
}

function createLimit(auth) {
  return createEmailSendLimit({
    codeSeconds: 300,
    getAuth: () => auth,
    max: 5,
    windowSeconds: 900,
  });
}

function signInSend({ email = 'ana@example.com', key } = {}) {
  return {
    body: { email, type: 'sign-in' },
    path: '/email-otp/send-verification-otp',
    request: nativeRequest(key),
  };
}

test('createEmailSendLimit takes a slot under the address and lets the send through', async () => {
  const { adapter, auth } = createAuth();
  expect(await createLimit(auth)({ body: { email: ' Ana@Example.com ' } })).toBeUndefined();
  expect(identifiers(adapter)).toEqual(['email-send-limit:ana@example.com']);
  const [record] = adapter.records;
  expect(record.expiresAt.getTime() - record.createdAt.getTime()).toBe(900 * 1000);
});

test('createEmailSendLimit refuses a send past the cap and keeps no slot for it', async () => {
  const { adapter, auth } = createAuth();
  addRecords({ adapter, identifier: 'email-send-limit:ana@example.com', count: 5 });
  await expect(createLimit(auth)({ body: { email: 'ana@example.com' } })).rejects.toMatchObject({
    status: 'TOO_MANY_REQUESTS',
  });
  expect(adapter.records).toHaveLength(5);
});

test('createEmailSendLimit lets no more than the cap through when sends race', async () => {
  const { adapter, auth } = createAuth();
  const limit = createLimit(auth);
  const results = await Promise.allSettled(
    Array.from({ length: 10 }, () => limit({ body: { email: 'ana@example.com' } }))
  );
  const allowed = results.filter(({ status }) => status === 'fulfilled').length;
  expect(allowed).toBeLessThanOrEqual(5);
  expect(adapter.records.length).toBe(allowed);
});

test('createEmailSendLimit does not count expired slots', async () => {
  const { adapter, auth } = createAuth();
  addRecords({
    adapter,
    identifier: 'email-send-limit:ana@example.com',
    count: 5,
    expiresAt: new Date(Date.now() - 1000),
  });
  expect(await createLimit(auth)({ body: { email: 'ana@example.com' } })).toBeUndefined();
  expect(adapter.records).toHaveLength(1);
});

test('createEmailSendLimit counts a phone send against its own and the address cap, by the key hash', async () => {
  const { adapter, auth } = createAuth();
  await createLimit(auth)({
    body: { email: 'ana@example.com' },
    request: nativeRequest(DEVICE_KEY),
  });
  expect(identifiers(adapter)).toEqual([
    `email-send-limit:ana@example.com:${sha256Base64Url(DEVICE_KEY)}`,
    'email-send-limit:ana@example.com',
  ]);
  expect(identifiers(adapter).join()).not.toContain(DEVICE_KEY);
});

test('createEmailSendLimit lets a known phone send while the address cap is full', async () => {
  const { adapter, auth } = createAuth();
  const hash = sha256Base64Url(DEVICE_KEY);
  addRecords({ adapter, identifier: 'email-send-limit:ana@example.com', count: 5 });
  addRecords({ adapter, identifier: `email-known-device:ana@example.com:${hash}`, count: 1 });
  expect(
    await createLimit(auth)({
      body: { email: 'ana@example.com' },
      request: nativeRequest(DEVICE_KEY),
    })
  ).toBeUndefined();
  expect(
    identifiers(adapter).filter((id) => id === 'email-send-limit:ana@example.com')
  ).toHaveLength(5);
  expect(identifiers(adapter)).toContain(`email-send-limit:ana@example.com:${hash}`);
});

test('createEmailSendLimit still caps a known phone at its own cap', async () => {
  const { adapter, auth } = createAuth();
  const hash = sha256Base64Url(DEVICE_KEY);
  addRecords({ adapter, identifier: `email-known-device:ana@example.com:${hash}`, count: 1 });
  addRecords({ adapter, identifier: `email-send-limit:ana@example.com:${hash}`, count: 5 });
  await expect(
    createLimit(auth)({ body: { email: 'ana@example.com' }, request: nativeRequest(DEVICE_KEY) })
  ).rejects.toMatchObject({ status: 'TOO_MANY_REQUESTS' });
});

test('createEmailSendLimit refuses an unknown phone when the address cap is full and gives its own slot back', async () => {
  const { adapter, auth } = createAuth();
  addRecords({ adapter, identifier: 'email-send-limit:ana@example.com', count: 5 });
  await expect(
    createLimit(auth)({ body: { email: 'ana@example.com' }, request: nativeRequest(OTHER_KEY) })
  ).rejects.toMatchObject({ status: 'TOO_MANY_REQUESTS' });
  expect(identifiers(adapter).every((id) => id === 'email-send-limit:ana@example.com')).toBe(true);
  expect(adapter.records).toHaveLength(5);
});

test('createEmailSendLimit ignores a device key from a browser or a malformed one', async () => {
  const { adapter, auth } = createAuth();
  const limit = createLimit(auth);
  await limit({ body: { email: 'ana@example.com' }, request: browserRequest(DEVICE_KEY) });
  await limit({ body: { email: 'ana@example.com' }, request: nativeRequest('short') });
  await limit({ body: { email: 'ana@example.com' }, request: nativeRequest() });
  expect(identifiers(adapter)).toEqual(Array(3).fill('email-send-limit:ana@example.com'));
});

test('createEmailSendLimit leaves a body with no email to the route', async () => {
  const getAuth = vi.fn();
  const limit = createEmailSendLimit({ getAuth, max: 5, windowSeconds: 900 });
  expect(await limit({ body: {} })).toBeUndefined();
  expect(getAuth).not.toHaveBeenCalled();
});

test('createEmailSendLimit holds the sign-in code a known phone asked for until the code expires', async () => {
  const { adapter, auth } = createAuth();
  const hash = sha256Base64Url(DEVICE_KEY);
  addRecords({ adapter, identifier: `email-known-device:ana@example.com:${hash}`, count: 1 });
  await createLimit(auth)(signInSend({ key: DEVICE_KEY }));
  const hold = adapter.records.find(
    ({ identifier }) => identifier === 'email-code-holder:ana@example.com'
  );
  expect(hold.value).toBe(hash);
  expect(hold.expiresAt.getTime() - hold.createdAt.getTime()).toBe(300 * 1000);
});

test('createEmailSendLimit moves a live hold on when anyone else sends, and never takes it', async () => {
  const { adapter, auth } = createAuth();
  const hash = sha256Base64Url(DEVICE_KEY);
  const soon = new Date(Date.now() + 1000);
  adapter.records.push({
    id: 'hold',
    identifier: 'email-code-holder:ana@example.com',
    value: hash,
    expiresAt: soon,
  });
  await createLimit(auth)(signInSend({ key: OTHER_KEY }));
  const hold = adapter.records.find(({ id }) => id === 'hold');
  expect(hold.value).toBe(hash);
  expect(hold.expiresAt.getTime()).toBeGreaterThan(soon.getTime());
});

test('createEmailSendLimit holds no code for a password reset send', async () => {
  const { adapter, auth } = createAuth();
  const hash = sha256Base64Url(DEVICE_KEY);
  addRecords({ adapter, identifier: `email-known-device:ana@example.com:${hash}`, count: 1 });
  await createLimit(auth)({
    body: { email: 'ana@example.com' },
    path: '/forget-password/email-otp',
    request: nativeRequest(DEVICE_KEY),
  });
  expect(identifiers(adapter)).not.toContain('email-code-holder:ana@example.com');
});
