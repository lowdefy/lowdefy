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

const mockGetSignedUrl = jest.fn();
const mockFile = jest.fn();
const mockBucket = jest.fn();
const mockStorageConstructor = jest.fn();

jest.unstable_mockModule('@google-cloud/storage', () => ({
  Storage: jest.fn().mockImplementation((...args) => {
    mockStorageConstructor(...args);
    return { bucket: mockBucket };
  }),
}));

const { default: GcsSignedGetUrl } = await import('./GcsSignedGetUrl.js');

const schema = GcsSignedGetUrl.schema;
const { checkRead, checkWrite } = GcsSignedGetUrl.meta;

beforeEach(() => {
  mockGetSignedUrl.mockReset();
  mockFile.mockReset();
  mockBucket.mockReset();
  mockStorageConstructor.mockReset();
  mockBucket.mockImplementation(() => ({ file: mockFile }));
  mockFile.mockImplementation(() => ({ getSignedUrl: mockGetSignedUrl }));
  mockGetSignedUrl.mockImplementation(() => ['https://signed.example.com/key']);
});

test('GcsSignedGetUrl returns a signed read URL', async () => {
  const request = { key: 'key' };
  const connection = { bucket: 'bucket' };
  const res = await GcsSignedGetUrl({ request, connection });
  expect(mockBucket.mock.calls).toEqual([['bucket']]);
  expect(mockFile.mock.calls).toEqual([['key']]);
  const options = mockGetSignedUrl.mock.calls[0][0];
  expect(options.version).toEqual('v4');
  expect(options.action).toEqual('read');
  expect(options.expires).toBeGreaterThan(Date.now());
  expect(res).toEqual('https://signed.example.com/key');
});

test('GcsSignedGetUrl passes responseDisposition and responseType', async () => {
  const request = {
    key: 'key',
    responseDisposition: 'attachment; filename="file.pdf"',
    responseType: 'application/pdf',
  };
  const connection = { bucket: 'bucket' };
  await GcsSignedGetUrl({ request, connection });
  const options = mockGetSignedUrl.mock.calls[0][0];
  expect(options.responseDisposition).toEqual('attachment; filename="file.pdf"');
  expect(options.responseType).toEqual('application/pdf');
});

test('GcsSignedGetUrl returns public URL when request is public', async () => {
  const request = { key: 'folder/my file.pdf', public: true };
  const connection = { bucket: 'bucket' };
  const res = await GcsSignedGetUrl({ request, connection });
  expect(res).toEqual('https://storage.googleapis.com/bucket/folder/my%20file.pdf');
  expect(mockGetSignedUrl).not.toHaveBeenCalled();
});

test('GcsSignedGetUrl public URL uses publicUrlBase override', async () => {
  const request = { key: 'key', public: true };
  const connection = { bucket: 'bucket', publicUrlBase: 'https://cdn.example.com/' };
  const res = await GcsSignedGetUrl({ request, connection });
  expect(res).toEqual('https://cdn.example.com/key');
  expect(mockGetSignedUrl).not.toHaveBeenCalled();
});

test('Error from storage client', async () => {
  mockGetSignedUrl.mockImplementation(() => {
    throw new Error('Test GCS client error.');
  });
  const request = { key: 'key' };
  const connection = { bucket: 'bucket' };
  await expect(GcsSignedGetUrl({ request, connection })).rejects.toThrow('Test GCS client error.');
});

test('checkRead should be true', async () => {
  expect(checkRead).toBe(true);
});

test('checkWrite should be false', async () => {
  expect(checkWrite).toBe(false);
});

test('Request properties is not an object', async () => {
  const request = 'request';
  expect(() => validate({ schema, data: request })).toThrow(
    'GcsSignedGetUrl request properties should be an object.'
  );
});

test('Request key missing', async () => {
  const request = {};
  expect(() => validate({ schema, data: request })).toThrow(
    'GcsSignedGetUrl request should have required property "key".'
  );
});

test('Request key not a string', async () => {
  const request = { key: true };
  expect(() => validate({ schema, data: request })).toThrow(
    'GcsSignedGetUrl request property "key" should be a string.'
  );
});

test('Request public not a boolean', async () => {
  const request = { key: 'key', public: 'public' };
  expect(() => validate({ schema, data: request })).toThrow(
    'GcsSignedGetUrl request property "public" should be a boolean.'
  );
});
