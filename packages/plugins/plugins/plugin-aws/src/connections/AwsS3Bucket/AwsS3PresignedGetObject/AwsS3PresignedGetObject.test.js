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
const mockS3ClientConstructor = jest.fn();

jest.unstable_mockModule('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation((...args) => {
    mockS3ClientConstructor(...args);
    return {};
  }),
  GetObjectCommand: jest.fn().mockImplementation((params) => params),
}));

jest.unstable_mockModule('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: (...args) => mockGetSignedUrl(...args),
}));

const { default: AwsS3PresignedGetObject } = await import('./AwsS3PresignedGetObject.js');

const schema = AwsS3PresignedGetObject.schema;
const { checkRead, checkWrite } = AwsS3PresignedGetObject.meta;

const getSignedUrlMockImp = () => 'res';

beforeEach(() => {
  mockGetSignedUrl.mockReset();
  mockS3ClientConstructor.mockReset();
  mockGetSignedUrl.mockImplementation(getSignedUrlMockImp);
});

test('AwsS3PresignedGetObject', async () => {
  const request = { key: 'key' };
  const connection = {
    accessKeyId: 'accessKeyId',
    secretAccessKey: 'secretAccessKey',
    region: 'region',
    write: true,
    bucket: 'bucket',
  };
  const res = await AwsS3PresignedGetObject({ request, connection });
  expect(mockS3ClientConstructor.mock.calls).toEqual([
    [
      {
        credentials: {
          accessKeyId: 'accessKeyId',
          secretAccessKey: 'secretAccessKey',
        },
        region: 'region',
      },
    ],
  ]);
  expect(mockGetSignedUrl.mock.calls[0][1]).toEqual({
    Bucket: 'bucket',
    Key: 'key',
  });
  expect(mockGetSignedUrl.mock.calls[0][2]).toEqual({ expiresIn: undefined });
  expect(res).toEqual('res');
});

test('AwsS3PresignedGetObject options', async () => {
  const request = {
    key: 'key',
    versionId: 'versionId',
    expires: 1,
    responseContentDisposition: 'responseContentDisposition',
    responseContentType: 'responseContentType',
  };
  const connection = {
    accessKeyId: 'accessKeyId',
    secretAccessKey: 'secretAccessKey',
    region: 'region',
    bucket: 'bucket',
  };
  const res = await AwsS3PresignedGetObject({ request, connection });
  expect(mockS3ClientConstructor.mock.calls).toEqual([
    [
      {
        credentials: {
          accessKeyId: 'accessKeyId',
          secretAccessKey: 'secretAccessKey',
        },
        region: 'region',
      },
    ],
  ]);
  expect(mockGetSignedUrl.mock.calls[0][1]).toEqual({
    Key: 'key',
    Bucket: 'bucket',
    VersionId: 'versionId',
    ResponseContentDisposition: 'responseContentDisposition',
    ResponseContentType: 'responseContentType',
  });
  expect(mockGetSignedUrl.mock.calls[0][2]).toEqual({ expiresIn: 1 });
  expect(res).toEqual('res');
});

test('AwsS3PresignedGetObject passes endpoint and forcePathStyle to the S3 client', async () => {
  const request = { key: 'key' };
  const connection = {
    accessKeyId: 'accessKeyId',
    secretAccessKey: 'secretAccessKey',
    region: 'auto',
    bucket: 'bucket',
    endpoint: 'https://account.r2.cloudflarestorage.com',
    forcePathStyle: true,
  };
  await AwsS3PresignedGetObject({ request, connection });
  expect(mockS3ClientConstructor.mock.calls).toEqual([
    [
      {
        credentials: {
          accessKeyId: 'accessKeyId',
          secretAccessKey: 'secretAccessKey',
        },
        region: 'auto',
        endpoint: 'https://account.r2.cloudflarestorage.com',
        forcePathStyle: true,
      },
    ],
  ]);
});

test('AwsS3PresignedGetObject returns virtual-hosted public URL when request is public', async () => {
  const request = { key: 'folder/my file.pdf', public: true };
  const connection = {
    accessKeyId: 'accessKeyId',
    secretAccessKey: 'secretAccessKey',
    region: 'eu-west-1',
    bucket: 'bucket',
  };
  const res = await AwsS3PresignedGetObject({ request, connection });
  expect(res).toEqual('https://bucket.s3.eu-west-1.amazonaws.com/folder/my%20file.pdf');
  expect(mockGetSignedUrl).not.toHaveBeenCalled();
});

test('AwsS3PresignedGetObject returns path-style public URL on a custom endpoint', async () => {
  const request = { key: 'key', public: true };
  const connection = {
    accessKeyId: 'accessKeyId',
    secretAccessKey: 'secretAccessKey',
    region: 'auto',
    bucket: 'bucket',
    endpoint: 'https://account.r2.cloudflarestorage.com/',
  };
  const res = await AwsS3PresignedGetObject({ request, connection });
  expect(res).toEqual('https://account.r2.cloudflarestorage.com/bucket/key');
  expect(mockGetSignedUrl).not.toHaveBeenCalled();
});

test('AwsS3PresignedGetObject public URL uses publicUrlBase override', async () => {
  const request = { key: 'key', public: true };
  const connection = {
    accessKeyId: 'accessKeyId',
    secretAccessKey: 'secretAccessKey',
    region: 'auto',
    bucket: 'bucket',
    endpoint: 'https://account.r2.cloudflarestorage.com',
    publicUrlBase: 'https://cdn.example.com/',
  };
  const res = await AwsS3PresignedGetObject({ request, connection });
  expect(res).toEqual('https://cdn.example.com/key');
  expect(mockGetSignedUrl).not.toHaveBeenCalled();
});

test('AwsS3PresignedGetObject signs the URL when public is false', async () => {
  const request = { key: 'key', public: false };
  const connection = {
    accessKeyId: 'accessKeyId',
    secretAccessKey: 'secretAccessKey',
    region: 'region',
    bucket: 'bucket',
  };
  const res = await AwsS3PresignedGetObject({ request, connection });
  expect(mockGetSignedUrl).toHaveBeenCalled();
  expect(res).toEqual('res');
});

test('Request public not a boolean', async () => {
  const request = { key: 'key', public: 'public' };
  expect(() => validate({ schema, data: request })).toThrow(
    'AwsS3PresignedGetObject request property "public" should be a boolean.'
  );
});

test('checkRead should be true', async () => {
  expect(checkRead).toBe(true);
});

test('checkWrite should be false', async () => {
  expect(checkWrite).toBe(false);
});

test('Error from s3 client', async () => {
  mockGetSignedUrl.mockImplementation(() => {
    throw new Error('Test S3 client error.');
  });
  const request = { key: 'key' };
  const connection = {
    accessKeyId: 'accessKeyId',
    secretAccessKey: 'secretAccessKey',
    region: 'region',
    bucket: 'bucket',
  };
  await expect(AwsS3PresignedGetObject({ request, connection })).rejects.toThrow(
    'Test S3 client error.'
  );
});

test('Request properties is not an object', async () => {
  const request = 'request';
  expect(() => validate({ schema, data: request })).toThrow(
    'AwsS3PresignedGetObject request properties should be an object.'
  );
});

test('Request key missing', async () => {
  const request = {};
  expect(() => validate({ schema, data: request })).toThrow(
    'AwsS3PresignedGetObject request should have required property "key".'
  );
});

test('Request expires property not a number', async () => {
  const request = { key: 'key', expires: 'expires' };
  expect(() => validate({ schema, data: request })).toThrow(
    'AwsS3PresignedGetObject request property "expires" should be a number.'
  );
});

test('Request key not a string', async () => {
  const request = { key: true };
  expect(() => validate({ schema, data: request })).toThrow(
    'AwsS3PresignedGetObject request property "key" should be a string.'
  );
});

test('Request responseContentDisposition not a string', async () => {
  const request = { key: 'key', responseContentDisposition: true };
  expect(() => validate({ schema, data: request })).toThrow(
    'AwsS3PresignedGetObject request property "responseContentDisposition" should be a string.'
  );
});

test('Request responseContentType not a string', async () => {
  const request = { key: 'key', responseContentType: true };
  expect(() => validate({ schema, data: request })).toThrow(
    'AwsS3PresignedGetObject request property "responseContentType" should be a string.'
  );
});

test('Request versionId not a string', async () => {
  const request = { key: 'key', versionId: true };
  expect(() => validate({ schema, data: request })).toThrow(
    'AwsS3PresignedGetObject request property "versionId" should be a string.'
  );
});
