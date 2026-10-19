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

const { default: AzureBlobUploadSas } = await import('./AzureBlobUploadSas.js');

const schema = AzureBlobUploadSas.schema;
const { checkRead, checkWrite } = AzureBlobUploadSas.meta;

beforeEach(() => {
  mockGenerateBlobSASQueryParameters.mockReset();
  mockStorageSharedKeyCredentialConstructor.mockReset();
  mockPermissionsParse.mockReset();
  mockPermissionsParse.mockImplementation((permissions) => permissions);
  mockGenerateBlobSASQueryParameters.mockImplementation(() => ({
    toString: () => 'sas-token',
  }));
});

test('AzureBlobUploadSas returns a PUT descriptor with top-level key and bucket', async () => {
  const request = { key: 'uploads/file.pdf' };
  const connection = {
    account: 'account',
    accountKey: 'accountKey',
    container: 'container',
    write: true,
  };
  const res = await AzureBlobUploadSas({ request, connection });
  expect(mockStorageSharedKeyCredentialConstructor.mock.calls).toEqual([['account', 'accountKey']]);
  const sasOptions = mockGenerateBlobSASQueryParameters.mock.calls[0][0];
  expect(sasOptions.containerName).toEqual('container');
  expect(sasOptions.blobName).toEqual('uploads/file.pdf');
  expect(mockPermissionsParse.mock.calls).toEqual([['cw']]);
  expect(sasOptions.expiresOn.getTime()).toBeGreaterThan(Date.now());
  expect(res).toEqual({
    method: 'PUT',
    url: 'https://account.blob.core.windows.net/container/uploads/file.pdf?sas-token',
    bucket: 'container',
    key: 'uploads/file.pdf',
    headers: { 'x-ms-blob-type': 'BlockBlob' },
  });
});

test('AzureBlobUploadSas sets the Content-Type header when contentType is provided', async () => {
  const request = { key: 'key', contentType: 'application/pdf' };
  const connection = {
    account: 'account',
    accountKey: 'accountKey',
    container: 'container',
    write: true,
  };
  const res = await AzureBlobUploadSas({ request, connection });
  expect(res.headers).toEqual({
    'x-ms-blob-type': 'BlockBlob',
    'Content-Type': 'application/pdf',
  });
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
    write: true,
  };
  await expect(AzureBlobUploadSas({ request, connection })).rejects.toThrow(
    'Test Azure client error.'
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
    'AzureBlobUploadSas request properties should be an object.'
  );
});

test('Request key missing', async () => {
  const request = {};
  expect(() => validate({ schema, data: request })).toThrow(
    'AzureBlobUploadSas request should have required property "key".'
  );
});

test('Request key not a string', async () => {
  const request = { key: true };
  expect(() => validate({ schema, data: request })).toThrow(
    'AzureBlobUploadSas request property "key" should be a string.'
  );
});

test('Request expires not a number', async () => {
  const request = { key: 'key', expires: 'expires' };
  expect(() => validate({ schema, data: request })).toThrow(
    'AzureBlobUploadSas request property "expires" should be a number.'
  );
});
