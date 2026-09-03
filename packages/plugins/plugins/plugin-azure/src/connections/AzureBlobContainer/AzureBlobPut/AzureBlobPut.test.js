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

const mockUpload = jest.fn();
const mockGetBlockBlobClient = jest.fn();
const mockGetContainerClient = jest.fn();
const mockBlobServiceClientConstructor = jest.fn();
const mockStorageSharedKeyCredentialConstructor = jest.fn();

jest.unstable_mockModule('@azure/storage-blob', () => ({
  StorageSharedKeyCredential: jest.fn().mockImplementation((...args) => {
    mockStorageSharedKeyCredentialConstructor(...args);
    return { type: 'credential' };
  }),
  BlobServiceClient: jest.fn().mockImplementation((...args) => {
    mockBlobServiceClientConstructor(...args);
    return { getContainerClient: mockGetContainerClient };
  }),
}));

const { default: AzureBlobPut } = await import('./AzureBlobPut.js');

const schema = AzureBlobPut.schema;
const { checkRead, checkWrite } = AzureBlobPut.meta;

beforeEach(() => {
  mockUpload.mockReset();
  mockGetBlockBlobClient.mockReset();
  mockGetContainerClient.mockReset();
  mockBlobServiceClientConstructor.mockReset();
  mockStorageSharedKeyCredentialConstructor.mockReset();
  mockGetContainerClient.mockImplementation(() => ({
    getBlockBlobClient: mockGetBlockBlobClient,
  }));
  mockGetBlockBlobClient.mockImplementation(() => ({ upload: mockUpload }));
});

test('AzureBlobPut decodes base64 content and writes the blob', async () => {
  const content = Buffer.from('file content').toString('base64');
  const request = { key: 'key', content };
  const connection = {
    account: 'account',
    accountKey: 'accountKey',
    container: 'container',
    write: true,
  };
  const res = await AzureBlobPut({ request, connection });
  expect(mockStorageSharedKeyCredentialConstructor.mock.calls).toEqual([['account', 'accountKey']]);
  expect(mockBlobServiceClientConstructor.mock.calls[0][0]).toEqual(
    'https://account.blob.core.windows.net'
  );
  expect(mockGetContainerClient.mock.calls).toEqual([['container']]);
  expect(mockGetBlockBlobClient.mock.calls).toEqual([['key']]);
  const [body, length, options] = mockUpload.mock.calls[0];
  expect(Buffer.isBuffer(body)).toBe(true);
  expect(body.toString('utf8')).toEqual('file content');
  expect(length).toEqual(body.length);
  expect(options).toEqual({});
  expect(res).toEqual({ bucket: 'container', key: 'key' });
});

test('AzureBlobPut sets blobContentType when contentType is provided', async () => {
  const content = Buffer.from('file content').toString('base64');
  const request = { key: 'key', content, contentType: 'text/plain' };
  const connection = {
    account: 'account',
    accountKey: 'accountKey',
    container: 'container',
    write: true,
  };
  await AzureBlobPut({ request, connection });
  const options = mockUpload.mock.calls[0][2];
  expect(options).toEqual({ blobHTTPHeaders: { blobContentType: 'text/plain' } });
});

test('Error from azure client', async () => {
  mockUpload.mockImplementation(() => {
    throw new Error('Test Azure client error.');
  });
  const request = { key: 'key', content: 'content' };
  const connection = {
    account: 'account',
    accountKey: 'accountKey',
    container: 'container',
    write: true,
  };
  await expect(AzureBlobPut({ request, connection })).rejects.toThrow('Test Azure client error.');
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
    'AzureBlobPut request properties should be an object.'
  );
});

test('Request key missing', async () => {
  const request = { content: 'content' };
  expect(() => validate({ schema, data: request })).toThrow(
    'AzureBlobPut request should have required property "key".'
  );
});

test('Request content missing', async () => {
  const request = { key: 'key' };
  expect(() => validate({ schema, data: request })).toThrow(
    'AzureBlobPut request should have required property "content".'
  );
});

test('Request content not a string', async () => {
  const request = { key: 'key', content: true };
  expect(() => validate({ schema, data: request })).toThrow(
    'AzureBlobPut request property "content" should be a string.'
  );
});

test('Request contentType not a string', async () => {
  const request = { key: 'key', content: 'content', contentType: true };
  expect(() => validate({ schema, data: request })).toThrow(
    'AzureBlobPut request property "contentType" should be a string.'
  );
});
