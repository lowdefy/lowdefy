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

const mockGenerateBlobSASQueryParameters = jest.fn();
const mockStorageSharedKeyCredentialConstructor = jest.fn();
const mockPermissionsParse = jest.fn();

jest.unstable_mockModule('@azure/storage-blob', () => ({
  StorageSharedKeyCredential: jest.fn().mockImplementation((...args) => {
    mockStorageSharedKeyCredentialConstructor(...args);
    return { type: 'credential' };
  }),
  generateBlobSASQueryParameters: (...args) => mockGenerateBlobSASQueryParameters(...args),
  BlobSASPermissions: {
    parse: (...args) => mockPermissionsParse(...args),
  },
}));

const { default: AzureBlobDownloadSas } = await import('./AzureBlobDownloadSas.js');

const schema = AzureBlobDownloadSas.schema;
const { checkRead, checkWrite } = AzureBlobDownloadSas.meta;

beforeEach(() => {
  mockGenerateBlobSASQueryParameters.mockReset();
  mockStorageSharedKeyCredentialConstructor.mockReset();
  mockPermissionsParse.mockReset();
  mockPermissionsParse.mockImplementation((permissions) => permissions);
  mockGenerateBlobSASQueryParameters.mockImplementation(() => ({
    toString: () => 'sas-token',
  }));
});

test('AzureBlobDownloadSas returns a read SAS URL', async () => {
  const request = { key: 'folder/file.pdf' };
  const connection = {
    account: 'account',
    accountKey: 'accountKey',
    container: 'container',
  };
  const res = await AzureBlobDownloadSas({ request, connection });
  const sasOptions = mockGenerateBlobSASQueryParameters.mock.calls[0][0];
  expect(sasOptions.containerName).toEqual('container');
  expect(sasOptions.blobName).toEqual('folder/file.pdf');
  expect(mockPermissionsParse.mock.calls).toEqual([['r']]);
  expect(sasOptions.expiresOn.getTime()).toBeGreaterThan(Date.now());
  expect(res).toEqual('https://account.blob.core.windows.net/container/folder/file.pdf?sas-token');
});

test('AzureBlobDownloadSas passes contentDisposition and contentType', async () => {
  const request = {
    key: 'key',
    contentDisposition: 'attachment; filename="file.pdf"',
    contentType: 'application/pdf',
  };
  const connection = {
    account: 'account',
    accountKey: 'accountKey',
    container: 'container',
  };
  await AzureBlobDownloadSas({ request, connection });
  const sasOptions = mockGenerateBlobSASQueryParameters.mock.calls[0][0];
  expect(sasOptions.contentDisposition).toEqual('attachment; filename="file.pdf"');
  expect(sasOptions.contentType).toEqual('application/pdf');
});

test('AzureBlobDownloadSas returns public URL when request is public', async () => {
  const request = { key: 'folder/my file.pdf', public: true };
  const connection = {
    account: 'account',
    accountKey: 'accountKey',
    container: 'container',
  };
  const res = await AzureBlobDownloadSas({ request, connection });
  expect(res).toEqual('https://account.blob.core.windows.net/container/folder/my%20file.pdf');
  expect(mockGenerateBlobSASQueryParameters).not.toHaveBeenCalled();
});

test('AzureBlobDownloadSas public URL uses publicUrlBase override', async () => {
  const request = { key: 'key', public: true };
  const connection = {
    account: 'account',
    accountKey: 'accountKey',
    container: 'container',
    publicUrlBase: 'https://cdn.example.com/',
  };
  const res = await AzureBlobDownloadSas({ request, connection });
  expect(res).toEqual('https://cdn.example.com/key');
  expect(mockGenerateBlobSASQueryParameters).not.toHaveBeenCalled();
});

test('Error from azure client', async () => {
  mockGenerateBlobSASQueryParameters.mockImplementation(() => {
    throw new Error('Test Azure client error.');
  });
  const request = { key: 'key' };
  const connection = {
    account: 'account',
    accountKey: 'accountKey',
    container: 'container',
  };
  await expect(AzureBlobDownloadSas({ request, connection })).rejects.toThrow(
    'Test Azure client error.'
  );
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
    'AzureBlobDownloadSas request properties should be an object.'
  );
});

test('Request key missing', async () => {
  const request = {};
  expect(() => validate({ schema, data: request })).toThrow(
    'AzureBlobDownloadSas request should have required property "key".'
  );
});

test('Request key not a string', async () => {
  const request = { key: true };
  expect(() => validate({ schema, data: request })).toThrow(
    'AzureBlobDownloadSas request property "key" should be a string.'
  );
});

test('Request public not a boolean', async () => {
  const request = { key: 'key', public: 'public' };
  expect(() => validate({ schema, data: request })).toThrow(
    'AzureBlobDownloadSas request property "public" should be a boolean.'
  );
});
