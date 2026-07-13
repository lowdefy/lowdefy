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
import { validate } from '@lowdefy/ajv';

const mockGenerateSignedPostPolicyV4 = jest.fn();
const mockFile = jest.fn();
const mockBucket = jest.fn();
const mockStorageConstructor = jest.fn();

jest.unstable_mockModule('@google-cloud/storage', () => ({
  Storage: jest.fn().mockImplementation((...args) => {
    mockStorageConstructor(...args);
    return { bucket: mockBucket };
  }),
}));

const { default: GcsSignedPostPolicy } = await import('./GcsSignedPostPolicy.js');

const schema = GcsSignedPostPolicy.schema;
const { checkRead, checkWrite } = GcsSignedPostPolicy.meta;

beforeEach(() => {
  mockGenerateSignedPostPolicyV4.mockReset();
  mockFile.mockReset();
  mockBucket.mockReset();
  mockStorageConstructor.mockReset();
  mockBucket.mockImplementation(() => ({ file: mockFile }));
  mockFile.mockImplementation(() => ({
    generateSignedPostPolicyV4: mockGenerateSignedPostPolicyV4,
  }));
  mockGenerateSignedPostPolicyV4.mockImplementation(() => [
    {
      url: 'https://storage.googleapis.com/bucket/',
      fields: { key: 'key', policy: 'policy' },
    },
  ]);
});

test('GcsSignedPostPolicy returns a POST descriptor with top-level key and bucket', async () => {
  const request = { key: 'key' };
  const connection = {
    bucket: 'bucket',
    client_email: 'client_email',
    private_key: 'private_key',
    projectId: 'projectId',
    write: true,
  };
  const res = await GcsSignedPostPolicy({ request, connection });
  expect(mockStorageConstructor.mock.calls).toEqual([
    [
      {
        projectId: 'projectId',
        credentials: { client_email: 'client_email', private_key: 'private_key' },
      },
    ],
  ]);
  expect(mockBucket.mock.calls).toEqual([['bucket']]);
  expect(mockFile.mock.calls).toEqual([['key']]);
  expect(res).toEqual({
    url: 'https://storage.googleapis.com/bucket/',
    fields: { key: 'key', policy: 'policy' },
    bucket: 'bucket',
    key: 'key',
    method: 'POST',
  });
});

test('GcsSignedPostPolicy passes expires, fields and conditions', async () => {
  const request = {
    key: 'key',
    expires: 60,
    fields: { acl: 'public-read' },
    conditions: [['content-length-range', 0, 1000]],
  };
  const connection = { bucket: 'bucket', write: true };
  await GcsSignedPostPolicy({ request, connection });
  const options = mockGenerateSignedPostPolicyV4.mock.calls[0][0];
  expect(options.fields).toEqual({ acl: 'public-read' });
  expect(options.conditions).toEqual([['content-length-range', 0, 1000]]);
  expect(options.expires).toBeGreaterThan(Date.now());
  expect(options.expires).toBeLessThanOrEqual(Date.now() + 60 * 1000);
});

test('GcsSignedPostPolicy throws when fields is not an object', async () => {
  const request = { key: 'key', fields: 'fields' };
  const connection = { bucket: 'bucket', write: true };
  await expect(GcsSignedPostPolicy({ request, connection })).rejects.toThrow(
    'properties.fields must be an object.'
  );
});

test('Error from storage client', async () => {
  mockGenerateSignedPostPolicyV4.mockImplementation(() => {
    throw new Error('Test GCS client error.');
  });
  const request = { key: 'key' };
  const connection = { bucket: 'bucket', write: true };
  await expect(GcsSignedPostPolicy({ request, connection })).rejects.toThrow(
    'Test GCS client error.'
  );
});

test('checkRead should be false', async () => {
  expect(checkRead).toBe(false);
});

test('checkWrite should be true', async () => {
  expect(checkWrite).toBe(true);
});

test('Request properties is not an object', async () => {
  const request = 'request';
  expect(() => validate({ schema, data: request })).toThrow(
    'GcsSignedPostPolicy request properties should be an object.'
  );
});

test('Request key missing', async () => {
  const request = {};
  expect(() => validate({ schema, data: request })).toThrow(
    'GcsSignedPostPolicy request should have required property "key".'
  );
});

test('Request key not a string', async () => {
  const request = { key: true };
  expect(() => validate({ schema, data: request })).toThrow(
    'GcsSignedPostPolicy request property "key" should be a string.'
  );
});

test('Request expires not a number', async () => {
  const request = { key: 'key', expires: 'expires' };
  expect(() => validate({ schema, data: request })).toThrow(
    'GcsSignedPostPolicy request property "expires" should be a number.'
  );
});

test('Request conditions not an array', async () => {
  const request = { key: 'key', conditions: 'conditions' };
  expect(() => validate({ schema, data: request })).toThrow(
    'GcsSignedPostPolicy request property "conditions" should be a array.'
  );
});
