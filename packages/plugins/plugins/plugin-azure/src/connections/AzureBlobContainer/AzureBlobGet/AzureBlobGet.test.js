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

const mockDownloadToBuffer = jest.fn();
const mockGetProperties = jest.fn();
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

const { default: AzureBlobGet } = await import('./AzureBlobGet.js');

const schema = AzureBlobGet.schema;
const { checkRead, checkWrite } = AzureBlobGet.meta;

beforeEach(() => {
  mockDownloadToBuffer.mockReset();
  mockGetProperties.mockReset();
  mockGetBlockBlobClient.mockReset();
  mockGetContainerClient.mockReset();
  mockBlobServiceClientConstructor.mockReset();
  mockStorageSharedKeyCredentialConstructor.mockReset();
  mockGetContainerClient.mockImplementation(() => ({
    getBlockBlobClient: mockGetBlockBlobClient,
  }));
  mockGetBlockBlobClient.mockImplementation(() => ({
    downloadToBuffer: mockDownloadToBuffer,
    getProperties: mockGetProperties,
  }));
  mockDownloadToBuffer.mockImplementation(async () => Buffer.from('file content'));
  mockGetProperties.mockImplementation(async () => ({
    contentType: 'text/plain',
    contentLength: 12,
  }));
});

test('AzureBlobGet reads the blob and returns base64 content', async () => {
  const request = { key: 'key' };
  const connection = {
    account: 'account',
    accountKey: 'accountKey',
    container: 'container',
    read: true,
  };
  const res = await AzureBlobGet({ request, connection });
  expect(mockBlobServiceClientConstructor.mock.calls[0][0]).toEqual(
    'https://account.blob.core.windows.net'
  );
  expect(mockGetContainerClient.mock.calls).toEqual([['container']]);
  expect(mockGetBlockBlobClient.mock.calls).toEqual([['key']]);
  expect(res).toEqual({
    bucket: 'container',
    key: 'key',
    content: Buffer.from('file content').toString('base64'),
    contentType: 'text/plain',
    size: 12,
  });
  expect(Buffer.from(res.content, 'base64').toString('utf8')).toEqual('file content');
});

test('AzureBlobGet omits contentType when properties have none and sizes from content', async () => {
  mockGetProperties.mockImplementation(async () => ({}));
  const request = { key: 'key' };
  const connection = {
    account: 'account',
    accountKey: 'accountKey',
    container: 'container',
  };
  const res = await AzureBlobGet({ request, connection });
  expect(res).toEqual({
    bucket: 'container',
    key: 'key',
    content: Buffer.from('file content').toString('base64'),
    size: 12,
  });
});

test('Error from azure client', async () => {
  mockDownloadToBuffer.mockImplementation(() => {
    throw new Error('Test Azure client error.');
  });
  const request = { key: 'key' };
  const connection = {
    account: 'account',
    accountKey: 'accountKey',
    container: 'container',
  };
  await expect(AzureBlobGet({ request, connection })).rejects.toThrow('Test Azure client error.');
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
    'AzureBlobGet request properties should be an object.'
  );
});

test('Request key missing', async () => {
  const request = {};
  expect(() => validate({ schema, data: request })).toThrow(
    'AzureBlobGet request should have required property "key".'
  );
});

test('Request key not a string', async () => {
  const request = { key: true };
  expect(() => validate({ schema, data: request })).toThrow(
    'AzureBlobGet request property "key" should be a string.'
  );
});
