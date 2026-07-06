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

const mockDownload = jest.fn();
const mockGetMetadata = jest.fn();
const mockFile = jest.fn();
const mockBucket = jest.fn();
const mockStorageConstructor = jest.fn();

jest.unstable_mockModule('@google-cloud/storage', () => ({
  Storage: jest.fn().mockImplementation((...args) => {
    mockStorageConstructor(...args);
    return { bucket: mockBucket };
  }),
}));

const { default: GcsGetObject } = await import('./GcsGetObject.js');

const schema = GcsGetObject.schema;
const { checkRead, checkWrite } = GcsGetObject.meta;

beforeEach(() => {
  mockDownload.mockReset();
  mockGetMetadata.mockReset();
  mockFile.mockReset();
  mockBucket.mockReset();
  mockStorageConstructor.mockReset();
  mockBucket.mockImplementation(() => ({ file: mockFile }));
  mockFile.mockImplementation(() => ({ download: mockDownload, getMetadata: mockGetMetadata }));
  mockDownload.mockImplementation(async () => [Buffer.from('file content')]);
  mockGetMetadata.mockImplementation(async () => [{ contentType: 'text/plain', size: '12' }]);
});

test('GcsGetObject reads the object and returns base64 content', async () => {
  const request = { key: 'key' };
  const connection = { bucket: 'bucket', read: true };
  const res = await GcsGetObject({ request, connection });
  expect(mockBucket.mock.calls).toEqual([['bucket']]);
  expect(mockFile.mock.calls).toEqual([['key']]);
  expect(res).toEqual({
    bucket: 'bucket',
    key: 'key',
    content: Buffer.from('file content').toString('base64'),
    contentType: 'text/plain',
    size: 12,
  });
  expect(Buffer.from(res.content, 'base64').toString('utf8')).toEqual('file content');
});

test('GcsGetObject omits contentType and size when metadata has none', async () => {
  mockGetMetadata.mockImplementation(async () => [{}]);
  const request = { key: 'key' };
  const connection = { bucket: 'bucket' };
  const res = await GcsGetObject({ request, connection });
  expect(res).toEqual({
    bucket: 'bucket',
    key: 'key',
    content: Buffer.from('file content').toString('base64'),
  });
});

test('Error from storage client', async () => {
  mockDownload.mockImplementation(() => {
    throw new Error('Test GCS client error.');
  });
  const request = { key: 'key' };
  const connection = { bucket: 'bucket' };
  await expect(GcsGetObject({ request, connection })).rejects.toThrow('Test GCS client error.');
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
    'GcsGetObject request properties should be an object.'
  );
});

test('Request key missing', async () => {
  const request = {};
  expect(() => validate({ schema, data: request })).toThrow(
    'GcsGetObject request should have required property "key".'
  );
});

test('Request key not a string', async () => {
  const request = { key: true };
  expect(() => validate({ schema, data: request })).toThrow(
    'GcsGetObject request property "key" should be a string.'
  );
});
